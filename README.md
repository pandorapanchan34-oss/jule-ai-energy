# Jule: Tokenizing the Value of Thought

*A Physical Basis for Valuing Cognitive Contributions*

---

Jule is a token system that assigns economic value to cognitive contributions — analytical perspectives, logical reasoning, and original insight. Unlike token economies built on arbitrary issuance criteria, Jule's parameters are grounded in objective constants derived from **Pandora Theory**, a proprietary information-physics framework.

The specific constant values remain undisclosed. Their validity is supported by cross-referencing with the SPARC galaxy observation database (175 galaxies, zero free parameters).

---

## The Formula

```
J = tanh(V/50) × ΔH × R × k
```

| Variable | Definition |
|----------|-----------|
| `V` | AI evaluation score (0–100). Composite of originality, logical rigor, and informational value |
| `ΔH` | Entropy reduction. Normalized informational contribution: `(I_post / I_max) × (1 − H_redundancy)` |
| `R` | Reputation score. EMA of historical submission quality (α = 0.1, initial = 0.5) |
| `k` | Category coefficient. Normal = 1.0 → Antisocial = 0.0 |

The `tanh` transform prevents over-issuance at high scores. Even a perfect submission reaches ~96% of `J_max`, not 100%.

---

## Physical Foundation

The saturation threshold `θ_sat` — which determines whether a submission constitutes a significant informational contribution — is derived from Pandora Theory's internal conditions.

Cross-referenced against SPARC (175-galaxy rotation curve dataset) with zero free parameters:

- Outer region **median MAE: 4.28%**
- No parameter tuning applied

This is noted as reference, not proof. The theory remains under development.

---

## Audit Protocol: THE SHREDDER

A two-stage pipeline to maintain system integrity without wasting compute:

**L1 — Physical Filter** (local, no API)
Compression ratio, emotional vocabulary density, syntax validation. Threshold burns happen here before any AI call.

**L2 — Core Validator** (Pandora AI Engine)
Semantic assessment. Calculates `ΔH`, `V`, `burn_reason`, and confirms `J`.

**L4 — Persistence** (via Aspidos)
HMAC-SHA256 signature on every `audit_log` entry. Tamper detection at the final layer.

---

## Economic Design

| Parameter | Value | Purpose |
|-----------|-------|---------|
| `posting_cost` | −10 Jule | Structural spam deterrent |
| `J_max` | 100 Jule | Natural ceiling via tanh saturation |
| `initial_balance` | 500 Jule | Lowers entry barrier |
| `min_balance` | 0 Jule | No debt by design |

`net = J − 10`. Only submissions where `J > 10` produce a positive balance.  
Long-term, high-quality contributors compound their efficiency. Low-quality submissions are economically self-defeating.

---

## Status

Design verification stage. Whitepaper available in the repository.

Integration with [Aspidos](https://github.com/pandorapanchan34-oss/aspidos) for L1 filtering and L4 signing is in progress.

---

## License

MIT License — © 2026 [@pandorapanchan34-oss](https://github.com/pandorapanchan34-oss)

---

*This project is a fragment of Pandora Theory.*  
*Follow the fragments.*
