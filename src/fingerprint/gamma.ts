// ─────────────────────────────────────────────
// γ: Genre Axis (6th Axis)
// + Repetition Decay Loop
//
// 初回: ΔH' = 1.00 (新規)
// 2回目: ΔH' × 0.50
// 3回目: ΔH' × 0.25
// ...
// 11回目: ΔH' × 0.00049 (実質Burn)
//
// Anti-Cognitive-Collusion by design.
// ─────────────────────────────────────────────
import type {
  JuleGenre, JuleAuditFingerprint,
  GenreRepetitionMap, DecayResult,
} from '../types/index.js';

// ── Genre Detection ────────────────────────
const GENRE_KEYWORDS: Record<JuleGenre, string[]> = {
  PHYSICS:       ['galaxy', 'rotation', 'quantum', 'spacetime', 'entropy',
                  '銀河', '量子', '宇宙', '情報場', 'pandora', 'tau', 'sparc'],
  MATH:          ['proof', 'theorem', 'equation', 'derive', 'axiom',
                  '証明', '定理', '導出', '固定点', '収束'],
  AI_SAFETY:     ['hallucination', 'alignment', 'safety', 'aspidos',
                  'jule', 'audit', 'burn', 'ハルシネーション', '安全'],
  ECONOMICS:     ['token', 'economy', 'incentive', 'market', 'capital',
                  'トークン', '経済', 'インセンティブ', '報酬'],
  CONSCIOUSNESS: ['consciousness', 'qualia', 'awareness', 'omega', 'unitas',
                  '意識', 'クオリア', 'ウニタス', '主観'],
  ENGINEERING:   ['code', 'implement', 'deploy', 'api', 'function',
                  'コード', '実装', 'デプロイ', 'アーキテクチャ'],
  CROSS:         [], // assigned when multiple genres detected
  OTHER:         [], // fallback
};

export function detectGenre(content: string): JuleGenre {
  const lower = content.toLowerCase();
  const scores: Partial<Record<JuleGenre, number>> = {};

  for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
    if (genre === 'CROSS' || genre === 'OTHER') continue;
    const hits = keywords.filter(kw => lower.includes(kw)).length;
    if (hits > 0) scores[genre as JuleGenre] = hits;
  }

  const detected = Object.entries(scores) as [JuleGenre, number][];
  if (detected.length === 0) return 'OTHER';
  if (detected.length >= 3) return 'CROSS'; // multi-genre → bonus

  // Return highest scoring genre
  return detected.sort((a, b) => b[1] - a[1])[0][0];
}

// ── Fingerprint Bucket ─────────────────────
// Discretize fingerprint into a bucket key for repetition tracking
// Bucket size: 0.1 per axis → 10×10 grid per genre
export function getFingerprintBucket(fp: JuleAuditFingerprint): string {
  const v  = Math.floor(fp.v_score / 10);
  const dh = Math.floor(fp.delta_h_prime * 10);
  const s  = Math.floor(fp.sigma_singularity * 10);
  return `${v}_${dh}_${s}`;
}

// ── Repetition Decay ───────────────────────
export function calculateDecay(
  userId:    string,
  genre:     JuleGenre,
  bucket:    string,
  deltaH:    number,
  repMap:    GenreRepetitionMap
): DecayResult {
  // CROSS genre gets no decay penalty (new connections are valuable)
  if (genre === 'CROSS') {
    return {
      repetition_count:  0,
      decay_factor:      1.0,
      delta_h_effective: deltaH,
      is_echo_chamber:   false,
    };
  }

  const count = repMap[userId]?.[genre]?.[bucket] ?? 0;

  // Decay: (1/2)^count
  // count=0 → 1.00 (new)
  // count=1 → 0.50
  // count=3 → 0.125
  // count=10 → ~0.001
  const decay_factor     = Math.pow(0.5, count);
  const delta_h_effective = deltaH * decay_factor;
  const is_echo_chamber  = count >= 11;

  return {
    repetition_count: count,
    decay_factor,
    delta_h_effective,
    is_echo_chamber,
  };
}

// ── Update Repetition Map ──────────────────
export function incrementRepetition(
  userId:  string,
  genre:   JuleGenre,
  bucket:  string,
  repMap:  GenreRepetitionMap
): GenreRepetitionMap {
  if (genre === 'CROSS') return repMap; // CROSS never penalized

  const updated = { ...repMap };
  if (!updated[userId])         updated[userId]         = {};
  if (!updated[userId][genre])  updated[userId][genre]  = {};

  updated[userId][genre][bucket] =
    (updated[userId][genre][bucket] ?? 0) + 1;

  return updated;
}

// ── Cross-Genre Bonus ──────────────────────
// Reward submissions that bridge multiple genres
// Pandora Theory itself is the ultimate CROSS submission
export function crossGenreBonus(genre: JuleGenre): number {
  return genre === 'CROSS' ? 1.2 : 1.0; // +20% for CROSS
}

// ── System Echo Chamber Detection ─────────
// Monitor genre distribution across all recent submissions
// Uniform distribution = healthy, concentrated = echo chamber risk
export function detectEchoChamber(
  recentGenres: JuleGenre[],
  windowSize:   number = 20
): { risk: number; dominant_genre: JuleGenre | null } {
  if (recentGenres.length === 0) return { risk: 0, dominant_genre: null };

  const window  = recentGenres.slice(-windowSize);
  const counts: Partial<Record<JuleGenre, number>> = {};

  for (const g of window) {
    counts[g] = (counts[g] ?? 0) + 1;
  }

  const entries   = Object.entries(counts) as [JuleGenre, number][];
  const maxEntry  = entries.sort((a, b) => b[1] - a[1])[0];
  const dominance = maxEntry[1] / window.length;

  // dominance > 0.6 = one genre takes over 60% = echo chamber risk
  return {
    risk:           dominance,
    dominant_genre: dominance > 0.6 ? maxEntry[0] : null,
  };
}
