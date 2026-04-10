/**
 * JuleMarket.ts
 * 知性の種（juleSeed）の流通・価値査定・生命周期を管理するコアマーケットレイヤー。
 * パンドラ理論 Ch.10 (n=3収束) に基づく資源配分プロトコル。
 */

import { juleSeed, Listing, SeedState, HydrateResult } from './types';
import { shredder, treasury, reputationSystem, storage } from '../core-system'; 

export class JuleMarket {
  
  /**
   * 1. 出品 (listSeed)
   * 種を市場に放流し、物理的な初期値を刻印する。
   */
  async listSeed(
    seed: juleSeed,
    priceInJule: number,
    sellerId: string
  ): Promise<Listing> {
    
    // ── 再監査：圧縮効率と情報の純度を再確認
    const audit = await shredder.executeAuditForSeed(seed);
    if (audit.status === 'BURN') {
      throw new Error('Low-value seed: Informational density below threshold.');
    }

    // ── 所有権と独自性(Σ/Φ)の検証
    if (seed.creatorId !== sellerId) {
      throw new Error('Ownership mismatch: Integrity check failed.');
    }

    // ── 品質スコア計算：独自性が高く、類似度が低いほど高評価
    // J = V * Σ * (1 - Φ)
    const qualityScore =
      audit.jule *
      audit.fingerprint.sigma *
      (1 - audit.fingerprint.phi);

    // ── ダンピング防止：最低価格の物理的拘束
    const minPrice = qualityScore * 0.5;
    if (priceInJule < minPrice) {
      throw new Error(`Price violation: Minimum required is ${minPrice.toFixed(2)} Jule.`);
    }

    const listing: Listing = {
      listingId: `L-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      seed,
      sellerId,
      price: priceInJule,
      state: {
        baseValue: audit.jule,
        createdAt: Date.now(),
        usageCount: 0,
        entropyLeak: 0,
        evolutionFactor: seed.evolution_factor || 1.0 // 生成時に刻印された進化係数
      },
      status: "ACTIVE",
      metadata: {
        qualityScore,
        deltaH: audit.fingerprint.deltaHPrime,
        sigma: audit.fingerprint.sigma
      }
    };

    await storage.saveListing(listing);
    return listing;
  }

  /**
   * 2. 購入 (buy)
   * 知性の権利を移譲し、エコシステムへの貢献度を分配する。
   */
  async buy(listingId: string, buyerId: string) {
    const listing = await storage.getListing(listingId);

    if (!listing || listing.status !== "ACTIVE") {
      throw new Error('Listing unavailable or already archived.');
    }

    // ── 実効価値の計算（劣化と進化の競合）
    const effectiveValue = this.computeEffectiveValue(listing);
    
    // 価格が実効価値を大幅に上回る（ボッタクリ）の防止
    if (effectiveValue < listing.price * 0.4) {
      throw new Error('Market Warning: Seed degradation exceeds price value.');
    }

    // ── 決済プロセス
    const fee = listing.price * 0.05; // 5% プロトコル維持費（焼却または国庫へ）
    await treasury.transfer(buyerId, listing.sellerId, listing.price - fee);
    await treasury.transfer(buyerId, "PROT_TREASURY", fee);

    // ── hydrate権限の付与（n=3にちなみ、基本3回使用で減衰加速）
    await storage.grantHydratePermission(buyerId, listing.seed, {
      maxUses: 3,
      initialDecay: 0.7
    });

    // ── レピュテーションの双方向重力更新
    await reputationSystem.update(listing.sellerId, 0.01); 
    await reputationSystem.update(buyerId, 0.002); // 優れた観測者への報酬

    // 共有物として維持する場合は利用回数を加算、1点物ならSOLDへ
    listing.state.usageCount += 1;
    if (listing.state.usageCount >= 10) listing.status = "SOLD"; 

    await storage.saveListing(listing);
    
    return { success: true, seed: listing.seed, effectiveValue };
  }

  /**
   * 3. 物理的価値計算 (computeEffectiveValue)
   * 鮮度、稀少性、進化抵抗力を統合した動的な価格算定。
   */
  private computeEffectiveValue(listing: Listing): number {
    const { baseValue, createdAt, usageCount, entropyLeak, evolutionFactor } = listing.state;
    
    const ageInHours = (Date.now() - createdAt) / (1000 * 60 * 60);
    
    // 進化係数が高いほど、時間の経過による劣化（Decay）に耐える
    // 抵抗値 = ln(1 + EvolutionFactor)
    const resistance = Math.log1p(evolutionFactor);
    const decayConst = 72 * (1 + resistance); 
    const freshness = Math.exp(-ageInHours / decayConst);
    
    // 稀少性：利用されるほど「当たり前」になり価値が下がる
    const scarcity = 1 / (1 + usageCount * 0.2);
    
    // エントロピー・ペナルティ：質の低い展開（hydrate）をされると漏洩が増える
    const integrity = Math.exp(-entropyLeak);

    return baseValue * freshness * scarcity * integrity;
  }

  /**
   * 4. 状態のフィードバック更新
   * hydrate（展開）の結果を受けて、種の寿命を調整する。
   */
  async updateAfterHydrate(listingId: string, auditResult: any) {
    const listing = await storage.getListing(listingId);
    if (!listing) return;

    // ΔH' が低い（質の低い展開）ほど、entropyLeakが増大し寿命が縮まる
    const leakSeverity = Math.max(0, 0.3 - auditResult.deltaHPrime);
    listing.state.entropyLeak += leakSeverity;

    // 逆に非常に高い価値(V)を示した場合、進化係数が微増する（成長）
    if (auditResult.jule > 80) {
      listing.state.evolutionFactor *= 1.05;
    }

    await storage.saveListing(listing);
  }
}
