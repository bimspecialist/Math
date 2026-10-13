# Math Workspace — ECC-inspired numerical semantics review

**Date:** 2026-10-13  
**Repository:** `bimspecialist/Math`  
**Base:** `f28e27df93412becc781e33951f7e10f83d6f71b` (`main` at task start)  
**Branch:** `automation/ecc-numerical-semantics-20261013`

## Goal and boundaries

Protect students and engineers from incorrect, plausible-looking results. Scope was deliberately limited to three existing code paths: dimensional expression precedence, extreme Student-t quantiles, and measurement uncertainty validation/formatting. Preserve calculator key layout, Math Lab, formula libraries, landing pages, lazy loading, consent and bilingual application navigation.

**Skills/process:** Systematic Problem Solving Engineer plus installed Test-Driven Development and verification processes; inspired by ECC engineering discipline. The external Everything Claude Code runtime was **not** installed or claimed to have run.

## Findings, evidence and fixes

### 1. Quantity exponent precedence
- **Root cause:** The quantity parser evaluated unary signs before exponentiation, while the scientific calculator already handled exponentiation first. It also parsed only a single exponent operator.
- **Before:** `-2^2` returned `+4`; `2^3^2` returned `INVALID_EXPRESSION`.
- **After:** `-2^2=-4`, `(-2)^2=4`, `2^3^2=512`, `2^-2^2=1/16`. Dimensional exponent validation, `m^-2`, `20 m / 4 s` and conversion to mph remain guarded.
- **Regression:** `tests/quantity-power-precedence.test.mjs` covers sign, associativity, dimensions and invalid formulas.
- **RED:** [GitHub run 38359030352](https://github.com/bimspecialist/Math/actions/runs/38359030352), three failing tests, 686 passing.
- **GREEN:** [GitHub run 38359130569](https://github.com/bimspecialist/Math/actions/runs/38359130569), 689 passing and no failures.

### 2. Student-t high-confidence critical values
- **Root cause:** Hard-coded `hi < 1e6` capped the inverse solver; it could return a plausible number for a target whose correct critical value exceeded one million.
- **Before:** For `df=1, p=0.9999999`, it returned `1048576` rather than the Cauchy reference `≈3183098.86`.
- **After:** A Cauchy closed-form handles `df=1`; the general bracket grows only while the floating-point upper tail remains reliable. Finite validation and a `NaN` failure boundary protect unrepresentable cases.
- **Regression:** `tests/research-tail-precision.test.mjs` now includes Cauchy/df=1 and df=2 reference quantiles plus invalid/extreme input guards.
- **RED:** [GitHub run 38359309967](https://github.com/bimspecialist/Math/actions/runs/38359309967), three failing tests, 689 passing.
- **GREEN:** [GitHub run 38359433509](https://github.com/bimspecialist/Math/actions/runs/38359433509), 692 passing and no failures.

### 3. Measurement uncertainty integrity
- **Root cause:** `Number(null)`, `Number("")` and `Number(false)` produce zero, so a missing value could turn into a fabricated measurement. Decimal scaling in the formatter could overflow for subnormal standard uncertainties.
- **Before:** `measurement("",0.1)` accepted zero, and `formatMeasurement` could display `NaN ± NaN` for valid finite inputs.
- **After:** The shared number validator accepts primitive numbers and non-empty finite numeric strings only. The Research Mode wrapper passes correlation through to this validator, preventing premature coercion. Formatting uses a scientific fallback when the rounding scale overflows.
- **Regression:** `tests/uncertainty-data-integrity.test.mjs` covers missing values, explicit zero, research wrapper errors, correlation and subnormal formatting.
- **RED:** [GitHub run 38359618243](https://github.com/bimspecialist/Math/actions/runs/38359618243), four failing tests, 692 passing.
- **GREEN:** [GitHub run 38359740993](https://github.com/bimspecialist/Math/actions/runs/38359740993), 696 passing and no failures.

## Recurrence-prevention rule

This is a recurrence of the input-coercion failure pattern documented in [the earlier research audit](ECC_RESEARCH_DATA_INTEGRITY_2026-10-13.md), now found in a separate numerical engine. **Any changes to scientific data inputs must reject blank/boolean/null inputs at both presentation and domain boundaries**, with tests proving that legitimate zero is accepted.

## Verification boundaries

- Full repository CI verifies math, research, Math Lab, localization, consent, SEO and existing protected behavior.
- Browser QA is still required for hands-on interaction and accessibility, including Arabic and English, touch/mobile, keyboard and screen readers. No browser screenshots or live Core Web Vitals measurements were taken in this task.
- All general numerical operations except supported exact rational arithmetic remain limited to IEEE-754 double precision. Underflow, ill-conditioning and poorly specified physical error models still require professional assessment.
- No new dependencies, network calls, external AI providers or tracking services were introduced.

## Release policy

Merge only after the final branch-head GitHub Actions run passes; then verify both `verify` and `deploy` jobs for the merge commit on `main`. Publishing cannot guarantee absence of problems without browser/manual validation.
