# Full Expert Site Audit — 2026-10-06

Status: **PASS WITH REQUIRED LIVE VISUAL VALIDATION**

## Review roles
This pass applied the review perspectives of:
- software/system architecture
- systematic debugging and QA
- mathematics/professor-level numerical correctness
- civil/engineering use
- product UX and accessibility
- Arabic/English localization
- performance engineering
- software security/privacy static review

These are specialist review lenses applied to the repository; this document does not represent signed external human certification.

## Scope
- Scientific Calculator and expert functions
- Advanced Solver
- Research Mode
- Math Lab
- Graphing
- Formula Library and professional knowledge libraries
- Converter, Programmer, Date, and Ramp tools
- English/Arabic and RTL/LTR
- Accessibility contracts
- startup/module-loading performance
- AdSense/Analytics consent behavior
- static security/input-output surfaces
- GitHub Pages verification/deployment gate
- documentation and cache-busting

## Confirmed defects fixed

### 1. External services could load before explicit consent
**Root cause:** AdSense was initialized in `setupConsent()` and also had an eager script in `<head>`, while the consent state only gated analytics.

**Fix:**
- Removed the eager AdSense script.
- Added one external-services consent state for advertising and optional analytics.
- Migrates the previous analytics consent value.
- Added a persistent **Privacy choices** control.
- Revoking consent after services were enabled reloads the page into the rejected state.

**Regression guard:** monetization/privacy tests now fail if AdSense is eagerly loaded or consent/revocation wiring disappears.

### 2. Heavy specialist modules increased initial JavaScript work
**Evidence:** repository source sizes included approximately:
- Math Lab engine: 102 KB
- professional knowledge libraries: 157 KB

**Fix:**
- Math Lab engine is dynamically imported on first Math Lab execution.
- Professional knowledge libraries are dynamically imported on first knowledge-library use.
- Professional formula deep links continue to load the required library before routing.

**Regression guard:** site audit tests reject static imports for these specialist modules.

### 3. Expert Calculator group labels were hardcoded in English
**Fix:** Constants, Probability, Calculus, and Complex headings now use the bilingual UI resource dictionary.

**Regression guard:** site audit verifies the resource keys exist in both English and Arabic and that the calculator renderer uses them.

### 4. Graph auto-scaling could be distorted by finite values near an asymptote
**Root cause:** line discontinuities were detected, but automatic Y bounds could still include extreme neighboring finite samples.

**Fix:** when a discontinuity is detected, graph bounds exclude samples around the break and use a robust trimmed range. Smooth functions retain the normal bounds path.

**Regression guard:** a dense `tan(x)` test around π/2 requires a useful auto viewport rather than an asymptote-dominated one.

### 5. Research statistics could silently discard invalid input tokens
**Root cause:** non-finite values were filtered out before analysis.

**Risk:** a dataset such as `1, 2, abc, 4` could be analyzed as `1,2,4`, producing a plausible but invalid scientific result.

**Fix:** invalid sample elements now make the entire analysis fail explicitly.

**Regression guard:** t-test, regression, and chi-square tests require `INVALID_INPUT` when a sample contains NaN/non-numeric data.

### 6. Privacy consent could not be revisited easily
**Fix:** added footer Privacy choices and safe consent revocation flow.

### 7. Release assets used stale cache-busting versions
**Fix:** synchronized the audited `app.js` and `calculator.css` version to `20261006-1`.

## New capability added

### Advanced Solver
- Automatic one-variable polynomial solving through degree 8.
- Degree 1/2 preserve closed-form behavior.
- Degree 3–8 use Durand–Kerner complex root iteration.
- Roots are accepted only after polynomial residual verification.
- Cubic complex-root and quartic real-root regression tests added.

### Research Mode
Added visible research workflows for:
- linear regression diagnostics
  - slope/intercept
  - R²
  - slope standard error
  - t statistic
  - p-value
  - slope confidence interval
- chi-square goodness-of-fit
  - χ²
  - degrees of freedom
  - p-value

### Global content integrity
A new repository-wide test validates:
- English/Arabic UI dictionary key parity and non-empty values
- unique professional library and formula IDs
- bilingual formula/variable metadata
- variable min/max constraint consistency
- no undeclared symbols in calculator expressions
- reference formula category and ID integrity

## Areas reviewed with no confirmed defect in this pass
- Date Calculator UTC/ISO date handling and month/year clamping
- Programmer Calculator BigInt and word-size/shift constraints
- Ramp Calculator geometry/slope consistency validation
- Unit Converter absolute-zero and linear conversion handling
- image preview lifecycle and object-URL cleanup
- calculation output escaping paths inspected in the main application
- no `eval` / `new Function` execution surface found in the reviewed source

This is not a penetration-test certification; it is repository/static review evidence.

## Verification gates
The GitHub Pages workflow runs:

```
node scripts/verify-calculator.mjs
```

That command executes every `tests/*.test.mjs` file and blocks deployment on failure.

New/strengthened gates in this pass include:
- privacy-first external service loading
- consent review/revocation
- lazy Math Lab loading
- lazy professional-library loading with deep links
- accessibility focus/reduced-motion contracts
- bilingual dynamic expert calculator copy
- graph discontinuity viewport behavior
- higher-degree polynomial roots
- invalid scientific-sample rejection
- regression / chi-square UI + workbench
- global bilingual/formula content integrity

## Remaining required validation
The following were not proven by repository tests and therefore remain explicit validation items:
1. Live browser visual QA at representative desktop/tablet/mobile widths.
2. Runtime screen-reader/keyboard walkthrough in a real browser.
3. Real network waterfall/Core Web Vitals measurement for startup improvements.
4. Pixel-level Arabic RTL visual QA for every long professional formula.
5. Full adversarial penetration testing.
6. OCR/math recognition remains intentionally unconnected.
7. Advanced Solver is broader than before but is not a general symbolic CAS equivalent to Mathematica/Maple.
8. Engineering reference formulas remain educational/engineering aids and do not replace current governing codes or signed professional design.

## Release decision
**PASS WITH REQUIRED LIVE VISUAL VALIDATION**

The automated/static audit found and fixed the confirmed defects listed above. No known failing automated repository gate should be accepted for merge.
