// ─────────────────────────────────────────────
// Energy Meter (Stable Protocol Version)
//
// Energy = ΔT × √R
// ΔT = T_baseline - T_actual
// R  = ΔT / T_baseline
//
// Dual Baseline:
//   T_baseline = max(globalBaseline, localBaseline)
//
// Fixes:
// - Prevent baseline collapse
// - Prevent gaming (local best = minimum)
// - Normalize distribution
// ─────────────────────────────────────────────

import type { AuditLogEntry } from '../types/index.js';

export interface EnergyComponents {
  T_baseline:        number;
  T_baseline_global: number;
  T_baseline_local:  number;
  T_actual:          number;
  delta_T:           number;
  R:                 number;
  energy:            number;
}

export interface EnergyReport {
  period_start:        number;
  period_end:          number;
  total_submissions:   number;
  total_energy:        number;
  mean_energy:         number;
  baseline_used:       number;
  distribution_credit: number;
  top_contributors:    Array<{
    transmission_id: string;
    energy:          number;
    R:               number;
  }>;
}

export class EnergyMeter {
  private entries: AuditLogEntry[] = [];

  // Global baseline (EMA)
  private globalBaseline: number;

  // Local best (minimum tokens per user)
  private localBest: Map<string, number> = new Map();

  constructor(initialBaseline: number = 500) {
    this.globalBaseline = initialBaseline;
  }

  // ── Core Formula ───────────────────────────
  static calculate(
    T_actual: number,
    globalBaseline: number,
    localBaseline: number = Infinity
  ): EnergyComponents {

    const T_baseline = Math.max(globalBaseline, localBaseline);

    const delta_T = Math.max(0, T_baseline - T_actual);
    const R       = T_baseline > 0 ? delta_T / T_baseline : 0;

    // Stabilized reward
    const energy  = delta_T * Math.sqrt(R);

    return {
      T_baseline,
      T_baseline_global: globalBaseline,
      T_baseline_local:  localBaseline === Infinity ? 0 : localBaseline,
      T_actual,
      delta_T,
      R,
      energy
    };
  }

  // ── Global Baseline (EMA) ──────────────────
  updateGlobalBaseline(T_actual: number): void {
    const ALPHA = 0.05;
    this.globalBaseline =
      (1 - ALPHA) * this.globalBaseline + ALPHA * T_actual;
  }

  getGlobalBaseline(): number {
    return this.globalBaseline;
  }

  // ── Local Best (ANTI-GAMING FIX) ───────────
  updateLocalBest(userId: string, T_actual: number): void {
    const current = this.localBest.get(userId);

    if (current === undefined) {
      this.localBest.set(userId, T_actual);
    } else {
      // Keep minimum (best efficiency)
      this.localBest.set(userId, Math.min(current, T_actual));
    }
  }

  getLocalBaseline(userId?: string): number {
    if (!userId) return Infinity;
    return this.localBest.get(userId) ?? Infinity;
  }

  // ── Measurement ────────────────────────────
  measure(T_actual: number, userId?: string): EnergyComponents {
    const localBaseline = this.getLocalBaseline(userId);

    return EnergyMeter.calculate(
      T_actual,
      this.globalBaseline,
      localBaseline
    );
  }

  // ── Full Calculation ───────────────────────
  calcEnergy(T_actual: number, userId?: string): EnergyComponents {
    const components = this.measure(T_actual, userId);

    // Update baselines AFTER measurement
    this.updateGlobalBaseline(T_actual);

    if (userId) {
      this.updateLocalBest(userId, T_actual);
    }

    return components;
  }

  // ── Distribution (FIXED NORMALIZATION) ─────
  static distributeJule(
    energy: number,
    baseline: number,
    distribution_rate: number = 0.10,
    J_MAX: number = 100
  ): number {

    // Normalize by baseline (scale-safe)
    const normalized = baseline > 0
      ? Math.min(energy / baseline, 1)
      : 0;

    return normalized * J_MAX * distribution_rate;
  }

  // ── Pipeline ───────────────────────────────
  run(
    T_actual: number,
    distribution_rate: number = 0.10,
    userId?: string
  ): {
    components: EnergyComponents;
    distribution: number;
  } {

    const components = this.calcEnergy(T_actual, userId);

    const distribution = EnergyMeter.distributeJule(
      components.energy,
      components.T_baseline,
      distribution_rate
    );

    return { components, distribution };
  }

  // ── Record ────────────────────────────────
  record(entry: AuditLogEntry): void {
    this.entries.push(entry);
  }

  // ── Report ────────────────────────────────
  generateReport(
    period_start: number,
    period_end: number,
    distribution_rate: number = 0.10
  ): EnergyReport {

    const period = this.entries.filter(
      e => e.timestamp >= period_start && e.timestamp <= period_end
    );

    const total_energy = period.reduce(
      (a, e) => a + e.energy_saved, 0
    );

    const top = [...period]
      .sort((a, b) => b.energy_saved - a.energy_saved)
      .slice(0, 10)
      .map(e => ({
        transmission_id: e.transmission_id,
        energy: e.energy_saved,
        R: e.R ?? 0, // ← FIX
      }));

    return {
      period_start,
      period_end,
      total_submissions: period.length,
      total_energy,
      mean_energy: period.length > 0
        ? total_energy / period.length
        : 0,
      baseline_used: this.globalBaseline,
      distribution_credit: total_energy * distribution_rate,
      top_contributors: top,
    };
  }
}
