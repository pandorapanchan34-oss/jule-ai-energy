// ─────────────────────────────────────────────
// Jule AI Energy — Entry Point
//
// This is a fragment of Pandora Theory.
// Take it if you want.
// Build on it if you can.
// The rest is up to you.
// Follow the fragments.
// ─────────────────────────────────────────────

// ── Core Engine ──────────────────────────────
export { TheShredder }                        from './core/the-shredder.js';
export { calculateJule, calculateNet, canAfford } from './core/jule-calculator.js';
export { updateReputation, createNewAsset, applyJuleChange } from './core/reputation.js';

// ── Fingerprint System（各軸の正典）──────────
export { calculateSigma }                         from './fingerprint/sigma.js';
export { calculatePhi, exclusionMultiplier, hashContent } from './fingerprint/phi.js';
export { calculateDeltaHPrime, calculateEnergySaved, exceedsThreshold } from './fingerprint/delta-h-prime.js';

// ── Fingerprint6（統合・ジャンル・減衰）────────
// ※ calculatePhi / calculateSigma は上記正典からexport済みのため重複させない
export { buildFingerprint6, detectGenre, applyDecay } from './fingerprint/fingerprint6.js';
export type { JuleFingerprint6 }                      from './fingerprint/fingerprint6.js';

// ── Energy Layer ──────────────────────────────
export { EnergyMeter } from './energy/meter.js';

// ── Security Layer (Aspidos Adapter) ──────────
export { MockAspidosAIAdapter } from './adapters/aspidos-ai.js';

// ── Market Layer (Truth Economy) ──────────────
export { JuleMarket } from './market/JuleMarket.js';

// ── Types (Unified Export) ─────────────────────
export type {
  // Core
  JuleAuditFingerprint,
  L2Evaluation,
  AuditResult,
  AuditLogEntry,
  JuleAsset,
  JuleConstants,
  IAspidosAIAdapter,
  // Market
  juleSeed,
  Listing,
  SeedState,
  HydrateResult,
  // Fingerprint
  GenreRepetitionMap,
  JuleGenre,
} from './types/index.js';
