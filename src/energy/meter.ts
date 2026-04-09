// ─────────────────────────────────────────────
// Energy Meter
//
// Energy = ΔT × R
//        = ΔT × (ΔT / T_baseline)
//        = ΔT² / T_baseline
//
// ΔT = T_baseline - T_actual  (token reduction)
// R  = ΔT / T_baseline        (reduction rate 0-1)
//
// Quadratic reward: the more you reduce,
// the higher the reduction rate → exponential gain.
// ─────────────────────────────────────────────
import type { AuditLogEntry } from '../types/index.js';

export interface EnergyComponents {
  T_baseline:      number;  // effective baseline (max of global/local)
  T_baseline_global: number; // system-wide rolling average
  T_baseline_local:  number; // user's personal best baseline
  T_actual:        number;  // actual tokens in this submission
  delta_T:         number;  // T_baseline - T_actual
  R:               number;  // delta_T / T_baseline (reduction rate)
  energy:          number;  // delta_T × sqrt(R)
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
  private entries:       AuditLogEntry[] = [];
  private baseline:      number;           // global baseline (EMA)
  private localBest:     Map<string, number> = new Map(); // per-user best

  constructor(initialBaseline: number = 500) {
    this.baseline = initialBaseline;
  }

  // ── Core Formula ───────────────────────────
  // baseline = Math.max(global, local)
  // → Stricter baseline: personal best or system average
  // energy = ΔT × √R (stabilized: smoother reward curve)
  static calculate(
    T_actual:        number,
    globalBaseline:  number,
    localBaseline:   number = 0
  ): EnergyComponents {
    const T_baseline = Math.max(globalBaseline, localBaseline);
    const delta_T    = Math.max(0, T_baseline - T_actual);
    const R          = T_baseline > 0 ? delta_T / T_baseline : 0;
    const energy     = delta_T * Math.sqrt(R); // stabilized
    return {
      T_baseline,
      T_baseline_global: globalBaseline,
      T_baseline_local:  localBaseline,
      T_actual, delta_T, R, energy
    };
  }

  // ── Step 1: Baseline Generation ────────────
  // Dynamic: rolling EMA of recent submissions
  updateBaseline(T_actual: number): void {
    const ALPHA  = 0.05;
    this.baseline = (1 - ALPHA) * this.baseline + ALPHA * T_actual;
  }

  getBaseline(): number { return this.baseline; }

  // ── Step 2: Actual Measurement ─────────────
  measure(T_actual: number, userId?: string): EnergyComponents {
    const localBaseline = userId
      ? (this.localBest.get(userId) ?? 0)
      : 0;
    return EnergyMeter.calculate(T_actual, this.baseline, localBaseline);
  }

  // Update local best: if user was more efficient before, keep that bar
  updateLocalBest(userId: string, T_actual: number): void {
    const current = this.localBest.get(userId) ?? 0;
    // Local best = highest T_actual seen (user's own baseline)
    // We track their average, not their worst
    const ALPHA = 0.1;
    const updated = current === 0
      ? T_actual
      : (1 - ALPHA) * current + ALPHA * T_actual;
    this.localBest.set(userId, updated);
  }

  // ── Step 3: Energy Calculation ─────────────
  // Mutates baseline + local best after measurement
  calcEnergy(T_actual: number, userId?: string): EnergyComponents {
    const components = this.measure(T_actual, userId);
    this.updateBaseline(T_actual);
    if (userId) this.updateLocalBest(userId, T_actual);
    return components;
  }

  // ── Step 4: Distribution Calculation ────────
  static distributeJule(
    energy:            number,
    distribution_rate: number = 0.10,
    J_MAX:             number = 100
  ): number {
    const normalized = Math.min(energy / (J_MAX * J_MAX), 1);
    return normalized * J_MAX * distribution_rate;
  }

  // ── Full Pipeline ───────────────────────────
  // baseline → actual → energy → distribution
  run(T_actual: number, distribution_rate: number = 0.10, userId?: string): {
    components:   EnergyComponents;
    distribution: number;
  } {
    const components   = this.calcEnergy(T_actual, userId);
    const distribution = EnergyMeter.distributeJule(
      components.energy, distribution_rate
    );
    return { components, distribution };
  }

  // ── Record & Report ─────────────────────────
  record(entry: AuditLogEntry): void {
    this.entries.push(entry);
  }

  generateReport(
    period_start:      number,
    period_end:        number,
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
        energy:          e.energy_saved,
        R:               0,
      }));

    return {
      period_start, period_end,
      total_submissions:   period.length,
      total_energy,
      mean_energy:         period.length > 0
                           ? total_energy / period.length : 0,
      baseline_used:       this.baseline,
      distribution_credit: total_energy * distribution_rate,
      top_contributors:    top,
    };
  }
}
