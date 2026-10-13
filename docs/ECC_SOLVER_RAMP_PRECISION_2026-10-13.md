# ECC-inspired numerical accuracy audit — Advanced Solver & Ramp Calculator
Date: 2026-10-13
Repository: `bimspecialist/Math`
Base commit: `0ee4337c599f75c205519d7bd40d76b29ecb0ec4`
Branch: `automation/ecc-solver-ramp-accuracy-20261013`

## Goal / protected behavior
Maintain an easy-to-use bilingual Math Workspace while raising the trustworthiness of mathematical and engineering answers. Preserve the existing Scientific Calculator, Graphing, Math Lab, Research Mode, formula libraries, graphing/lazy-loading, SEO pages, analytics/consent and GitHub Pages release pipeline. No interface redesign or third-party library introduction.

This pass applies ECC-style engineering disciplines through installed systematic debugging, test-driven development, numerical reference cases, source review and full regression gates. An external Everything Claude Code agent runtime was **not** installed or executed, and this is not a claim of independent human-professor review.

## Finding A: Quadratic root cancellation and incorrect merging
**Before:** Solving `x^2-100000000*x+1=0` gave the small root around `7.4505805969238e-9`, although the expected small root is around `1e-8`. The direct quadratic formula subtracts two nearly equal floating-point quantities. When the discriminant was small, `abs(discriminant)<1e-9` collapsed two distinct real roots into one. A separate general-purpose solver cleanup rule also converted real roots below `1e-9` to zero.

**Fix:** Use the cancellation-resistant `q=-0.5(b+sign(b)*sqrt(d))` and compute real roots as `q/a` and `c/q`; classify a truly repeated root only when the computed discriminant is exactly zero. Use root-specific precision formatting that does not suppress legitimate nonzero roots. Leave other unrelated solver cleanup semantics alone.

**Cases:** Wide-coefficient roots, close but distinct real roots, values around `1e-10`, ordinary `x^2-4=0`, true repeated roots, and conjugate complex roots.

## Finding B: Ramp side derivation overflow and cancellation
**Before:** A missing side computed using `sqrt(l*l-side*side)`. Finite positive inputs `rise=3e200`, `length=5e200` overflowed in intermediate squared terms and returned `NaN`. With `length=1e12`, `rise=1e12-1`, the prior result was `1414205.9131993`, versus the reference `1414213.5623727415`.

**Fix:** Evaluate the equivalent `sqrt(l-side) * sqrt(l) * sqrt(1+side/l)` to preserve significance and keep intermediate values finite when the resulting geometry is representable. Validate the resulting side and retain the existing `INVALID_RAMP_GEOMETRY` error contract.

## Finding C: Relative validation and numeric input semantics
- The three-side consistency check used `max(1, abs(a), abs(b))` for tolerance. This could accept contradictory positive sub-millimeter triangles because the absolute error allowance dwarfed the input. Tolerance now scales with `max(abs(a), abs(b))`.
- The ramp input validator previously accepted boolean `true` as numeric length 1. It now permits finite positive numbers and nonblank numeric strings, while rejecting nonnumeric objects or booleans.

## Evidence and regression gates

| Stage | GitHub Actions evidence | Outcome |
|---|---|---|
| Initial RED: six regression cases | [run 38365264342](https://github.com/bimspecialist/Math/actions/runs/38365264342) | 5 failing new cases; 706 passed |
| Initial GREEN | [run 38365459720](https://github.com/bimspecialist/Math/actions/runs/38365459720) | 711 passed; 0 failed |
| Additional RED: tiny roots, consistency | [run 38365657762](https://github.com/bimspecialist/Math/actions/runs/38365657762) | 2 failures; 712 passed |
| Second GREEN | [run 38365763422](https://github.com/bimspecialist/Math/actions/runs/38365763422) | 714 passed; 0 failed |
| Third RED: output representability | [run 38366329411](https://github.com/bimspecialist/Math/actions/runs/38366329411) | 2 failing tests; 714 passed |
| Reviewed GREEN | [run 38366586581](https://github.com/bimspecialist/Math/actions/runs/38366586581) | 716 passed; 0 failed |


Regression file: `tests/ecc-solver-ramp-numerical-regression.test.mjs`. The complete `node scripts/verify-calculator.mjs` repository gate verifies 86 test files, including existing solver, ramp, math engines, calculator/UI contracts, localization, consent and SEO assertions.

## Finding D: Explicit failures for unrepresentable numerical results
The previous ramp result formatter could surface `Infinity` as a valid length or slope when intermediate or final values exceeded IEEE-754 representable limits. Results now reject non-finite geometry, grades, and ratios with `INVALID_RAMP_GEOMETRY` rather than returning a plausible-looking successful object.

**Test correction captured in review:** An initial boundary check incorrectly assumed `hypot(1e308,1e308)` overflows, even though its true value `≈1.414e308` is finite. The final regression explicitly verifies that this case **succeeds**, and that `hypot(1.5e308,1.5e308)` — which exceeds the floating-point maximum — is rejected. The correction was required by the math, not to suppress a valid regression.

## Deliberate boundaries and remaining QA
- Mathematical double-precision calculations have finite representability. This is not a general arbitrary-precision solver, symbolic proof engine, or substitute for approved ramp-accessibility design.
- Display precision does not imply certified instrument accuracy or tolerance compliance.
- No actual cross-browser, mobile, Arabic RTL pixel-level, keyboard-only or screen-reader session was performed here. Those checks remain **required manual validation** before claiming fully verified UX.
- The code changes are limited to small, reversible math functions. The branch base is the rollback point.

## Prevention rule
When altering a solver or engineering calculator, include **ill-conditioned cases, nearly equal operands, tiny nonzero results, overflow of intermediate expressions, true degenerate cases and invalid-but-coercible values** in RED→GREEN tests. Do not replace real measurements or roots with a generic absolute near-zero threshold without documented mathematical justification.

## Merge policy
Merge only after PR-head CI succeeds; separately verify the actual `main` merge commit's GitHub Pages `verify` and `deploy` steps. Do not claim production/browser verification from CI alone.
