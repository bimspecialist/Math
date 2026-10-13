# Math Workspace — Scientific probability precision audit (ECC-style)
Date: 2026-10-13  
Repository: `bimspecialist/Math`  
Base on main: `20222779af15f405218919d26c5ba651dc24480f`  
Feature branch: `automation/ecc-probability-precision-20261013`

## Objective / protected behavior

Increase trust in results of Scientific Calculator probability functions used in study, engineering and research while keeping the UI simple. Protect keypad contracts, calculator state, existing Math Lab and engineering libraries, Arabic and English, lazy loading, search landing pages, GitHub Pages, consent and existing analytics settings.

We applied the systematic diagnosis, TDD RED → GREEN, reference-case numerical verification and release gates available in the installed skills. This does **not** claim that an external ECC agent runtime or a team of human experts reviewed the code.

## A — Large binomial PDF/CDF values

**Observed issue:** For large counts such as `binompdf(5000,10000,0.5)`, separately multiplying `nCr(n,k)`, `p^k`, and `(1-p)^(n-k)` overflowed/underflowed intermediate numbers despite a representable final probability. Also `binomcdf(k>=n,n,p)` could return `0.9999999999999994` rather than the mathematically exact 1 after summing approximate probabilities.

**Correction:** exact boundary cases are short-circuited; moderate values keep the original elementary calculation where safe. Other mass functions combine factors in log space. CDF accumulation walks the smaller tail from its largest term with recurrence and compensated summation, avoiding repeatedly evaluating Gamma for each term. If a large CDF computation exceeds the 200,000-term convergence budget, it returns an explicit `DOMAIN_ERROR` rather than a partial numeric answer.

Reference anchors calculated independently with Python exact-integer binomial coefficients and 80-digit Decimal arithmetic:

| Expression | Expected approximate result |
|---|---:|
| `binompdf(500,1000,0.5)` | `0.025225018178360802` |
| `binomcdf(500,1000,0.5)` | `0.5126125090891804` |
| `binomcdf(70,1000,0.1)` | `0.0005744958408379693` |
| `binompdf(5000,10000,0.5)` | `0.007978646139382154` |

## B — Normal CDF and erfc lower tails

**Observed issue:** `normalcdf(-10)` produced 0 instead of a representable positive probability of about `7.619853024160593e-24`. The earlier approximation computed `0.5*(1+erf(negative))`, which loses tiny tails in subtractive cancellation. `erfc(8)` likewise returned zero instead of around `1.122429717298293e-29`. `erf(0.1)` also exhibited avoidable absolute approximation error.

**Correction:** evaluate erfc directly by a convergent continued fraction for positive arguments at or above 1.5; use an alternating-series representation near zero. Compute the negative normal CDF tail directly as `0.5*erfc(-z)` rather than via `1+erf(z)`. Positive-argument erf and complementary erf are derived consistently from the same functions. The reference values are independently cross-checked using Python `math.erfc` and known distribution properties.

## C — Extremely high trial counts

**Observed issue:** For `binompdf(500000000000,1000000000000,0.5)`, the cancellation in `logGamma(n+1)-logGamma(k+1)-logGamma(n-k+1)` loses significant figures, returning roughly a 0.17% error even when the final probability fits IEEE-754.

**Correction:** for high trial counts, use the Stirling correction plus binary relative entropy/Kullback–Leibler divergence expressed through `log1p`, avoiding subtraction of enormous close log-factorials. For an endpoint within 49 trials use a short log-binomial coefficient product instead of the divergent large-number cancellation. The calculator still rejects non-safe integer trial counts.

Additional independently calculated 80-digit asymptotic anchors:

| Expression | Expected approximate result |
|---|---:|
| `binompdf(5000000000,10000000000,0.5)` | `7.978845607829182e-6` |
| `binompdf(500000000000,1000000000000,0.5)` | `7.978845608026659e-7` |
| `binompdf(200000000000,1000000000000,0.2)` | `9.973557010031454e-7` |
| `binompdf(500000500000,1000000000000,0.5)` | `4.839414490383674e-7` |

## Verification evidence

| RED / GREEN | Github Actions run | Outcome |
|---|---|---|
| Binomial RED | [38367534553](https://github.com/bimspecialist/Math/actions/runs/38367534553) | 2 test failures; 720 passing |
| Binomial GREEN | [38367882538](https://github.com/bimspecialist/Math/actions/runs/38367882538) | 722 passing, 0 failures |
| Normal tail RED | [38368299723](https://github.com/bimspecialist/Math/actions/runs/38368299723) | 3 test failures; 723 passing |
| Normal tail GREEN | [38368433813](https://github.com/bimspecialist/Math/actions/runs/38368433813) | 726 passing, 0 failures |
| Huge-n RED | [38368779567](https://github.com/bimspecialist/Math/actions/runs/38368779567) | 1 failing test |
| Extended huge-n RED | [38368968687](https://github.com/bimspecialist/Math/actions/runs/38368968687) | 2 failures; 726 passing |
| Huge-n GREEN | [38369159074](https://github.com/bimspecialist/Math/actions/runs/38369159074) | 728 passing, 0 failures, 88 test files |

New regression files:
- `tests/ecc-binomial-probability-stability.test.mjs`
- `tests/ecc-normal-tail-precision.test.mjs`

## Numerical and delivery limits

- JavaScript `Number` is IEEE-754 double precision. Values smaller than the minimum representable subnormal probability may still round to zero; values closer to 1 than machine epsilon may round to 1.
- The Stirling/KL approximation is validated against the listed cases; it is not a formal guarantee of uniform relative accuracy over every feasible `n,k,p` combination. Very large CDFs may deliberately yield an error instead of a silently partial result.
- No new tracking, external data dependencies or sensitive information collection.
- Existing visual layout, key navigation and localization files were not changed. Live browser/mobile/RTL, keyboard-only and screen-reader testing remains required to claim full UX coverage.
- CI cannot by itself prove mathematical accuracy for every input or warrant scientific/engineering certification.

## Prevention principle

Regression tests for distributions should include: extreme probability tails, `p=0` and `p=1`, `n=0`, underflowing intermediate factors, large but representable final probabilities, large counts with small nonzero mass, and previously valid ordinary classroom calculations. Do not emit a plausible numeric CDF from incomplete summation.

## Release gate

Merge only after final PR-head verify succeeds, then confirm the independently triggered `main` workflow completes both `verify` and GitHub Pages `deploy`.
