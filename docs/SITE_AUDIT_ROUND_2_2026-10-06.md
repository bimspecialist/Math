# Full Expert Site Audit — Round 2 — 2026-10-06

Status: **PASS PENDING FINAL BRANCH/MAIN VERIFICATION**

## Purpose
This second pass re-audits the already improved site rather than repeating the first checklist mechanically. It focuses on edge cases, silent normalization, direct routing, startup cost, consent scope, and bounded browser execution.

## Review lenses
- systematic debugging / QA
- mathematics and professor-level numerical behavior
- research-statistics integrity
- engineering calculator usage
- browser performance and resource safety
- product UX / accessibility
- Arabic/English localization
- software security/privacy static review

## Confirmed findings and changes

### 1. Research statistics accepted or normalized invalid inferential inputs too loosely
Fixed:
- finite null mean validation for Student-t
- alpha must satisfy 0 < alpha < 1
- regression rejects zero response variance instead of producing misleading inference
- chi-square rejects negative observed counts
- estimated parameter count must be a non-negative integer
- invalid degrees of freedom are explicit
- observed and expected totals must match

New errors are localized in English and Arabic.

### 2. Negative uncertainty was silently converted to positive
The uncertainty engine previously used Math.abs on uncertainty. Negative standard uncertainty is now rejected with INVALID_UNCERTAINTY.

Also corrected sqrt(0 ± 0): exact zero now propagates as exact zero, while sqrt(0 ± u) with nonzero uncertainty still rejects the singular linearized propagation case.

### 3. Blank research numeric fields could become zero before validation
Research UI now preserves blank/non-finite numeric inputs as invalid (NaN) so the scientific engines can reject them explicitly.

### 4. Advanced Solver / Research Mode still contributed to first-load JavaScript
Both are now dynamically loaded on first use. Research Mode is initialized before direct #research navigation activates the section.

### 5. Formula Library and explanations still contributed to first-load JavaScript
Reference formulas and formula explanations are now dynamically loaded on demand.

Direct routes remain supported:
- #formulas
- #formula/reference/...
- #formula/professional/...

### 6. Direct #knowledge navigation could show an uninitialized professional library
Added initializeProfessionalKnowledge() so direct hash navigation loads formula support + professional library data before rendering.

### 7. Formula rule integrity was not globally validated
Global content QA now validates rule kinds, referenced variables, thresholds, rule error codes, and expression symbols in professional formula rules.

### 8. Higher-degree polynomial expression analysis was inconsistent
Equations such as x^3-1=0 were supported, while x^3-1 without an equals sign still used the old quadratic-only analysis path.

Polynomial expression analysis now supports degree 3–8 using the same verified root engine while preserving the existing degree 1/2 path.

### 9. Legacy analytics consent could be expanded into advertising consent
The prior migration treated an old analytics acceptance as acceptance for the newer combined external-services scope.

Round 2 narrows this:
- legacy rejection may migrate to rejection;
- legacy analytics acceptance does not automatically authorize advertising;
- broader external-services acceptance requires a fresh user choice.

### 10. Math Scan image selection had weak failure-state handling
Added:
- image MIME validation
- 15 MB local preview limit
- removal/revocation of stale previews on invalid replacement
- localized type/size error messages

OCR remains intentionally unconnected.

### 11. Exact arithmetic silently normalized requested precision
Exact precision is now an explicit contract:
- integer only
- 1 to 1000
- otherwise INVALID_PRECISION

### 12. Exact BigInt expressions allowed pathological exponent workloads
Added browser execution limits for:
- integer powers
- scientific-notation decimal exponents

Values beyond the exact-engine safety budget fail explicitly rather than attempting massive BigInt allocation.

### 13. Math Lab loops were bounded, but recursive user functions were not
Existing protections already included:
- loop iteration limit
- matrix dimension limits
- linspace/logspace sample limits
- mesh/grid limits
- RK4 sample limits

Round 2 adds a user-function recursion depth limit with try/finally cleanup so runaway recursion becomes FUNCTION_CALL_DEPTH_LIMIT rather than native stack overflow.

Regression tests also protect matrix/sample allocation budgets.

## Performance architecture after Round 2
On-demand specialist loading now covers:
- Math Lab
- Advanced Solver + result formatting
- Research Mode
- Formula Library + formula explanations
- professional knowledge libraries

This reduces parse/evaluation work for users who open the site only for the scientific calculator.

## Protected behavior
The following existing behavior was intentionally preserved:
- scientific calculator lecture workflow
- bilingual calculator physical LTR behavior
- formula deep links
- professional knowledge search in both languages
- graphing behavior from Round 1
- converter/date/programmer/ramp APIs
- Math Lab existing loop and allocation limits

## Verification strategy
Repository deployment remains gated by:

```
node scripts/verify-calculator.mjs
```

The full gate executes all `tests/*.test.mjs`.

Round 2 adds/strengthens regression coverage for:
- inferential input validity
- uncertainty sign validation and sqrt zero edge
- lazy specialist loading
- direct formulas/knowledge/research routes
- professional formula rule references
- higher-degree expression analysis
- consent scope migration
- image preview validation
- exact precision/exponent budgets
- Math Lab recursion/allocation budgets

## Remaining non-automated validation
1. real-browser desktop/tablet/mobile visual QA
2. runtime keyboard + screen-reader walkthrough
3. measured network waterfall / Core Web Vitals
4. pixel-level long Arabic/RTL content review
5. independent adversarial penetration testing
6. OCR/math-recognition integration remains absent by design
7. engineering formulas remain educational/design aids, not signed code compliance

## Release decision
Do not merge solely from this document. Final status becomes **PASS WITH REQUIRED LIVE VISUAL VALIDATION** only after the latest branch verification, merge, main verification, and Pages deployment all succeed.
