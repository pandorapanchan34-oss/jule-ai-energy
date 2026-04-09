// src/fingerprint/delta-h-prime.ts
import type { L2Evaluation } from '../types/index.js';

/**
 * ΔH': Energy-Extended Entropy Reduction
 * ΔH' = ΔH × (useful_tokens / energy_consumed)
 *
 * 修正前: dH * (efficiency / energy) → tokens²が分母に入っていた
 * 修正後: dH * (usefulTokens / energy) → 仕様通り
 */
export function calculateDeltaHPrime(
  evals: L2Evaluation[],
  sigma: number
): number {
  if (evals.length === 0) return 0;

  const values = evals.map(e => {
    const useful  = e.token_count * e.useful_ratio;
    const energy  = e.token_count;          // modelFactor=1をデフォルト
    if (energy === 0) return 0;

    const dH = e.delta_h_raw;
    return dH * (useful / energy);          // = dH × useful_ratio
  });

  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  // sigmaで重み付け（AI間一致度が高いほど信頼性↑）
  return avg * sigma;
}

/**
 * Energy Saved
 * 冗長トークンを省いた分の節約量（正規化）
 */
export function calculateEnergySaved(
  evals: L2Evaluation[]
): number {
  if (evals.length === 0) return 0;

  const saved = evals.map(e => {
    const redundant = 1 - e.useful_ratio;
    return e.token_count * redundant;
  });

  return saved.reduce((a, b) => a + b, 0) / evals.length;
}
