# Math Workspace

Browser-based scientific, engineering, and research mathematics workspace with English/Arabic UI. Core calculations run locally in the browser.

## Main workspaces

- **Scientific Calculator** — lecture-style entry, exact fractions, trigonometry, calculus helpers, probability, scientific constants, complex-number mode, and expert functions.
- **Advanced Solver** — equations, systems, numerical roots, limits, supported symbolic calculus/transforms, and verified polynomial solving/analysis through degree 8.
- **Research Mode** — exact BigInt rational arithmetic, dimension-aware physical quantities, measurement uncertainty, Student-t inference, linear-regression diagnostics, chi-square goodness-of-fit, and scientific constants.
- **Math Lab** — MATLAB-style numerical workspace with matrices, decompositions, linear systems, FFT, interpolation, polynomial/signal tools, numerical calculus, root finding, scripts/functions, control flow, and RK4/ODE helpers.
- **Graphing** — multiple expressions, configurable viewport, discontinuity detection, and robust automatic scaling.
- **Formula and professional knowledge libraries** — general math plus accounting, civil engineering, hydraulics, environmental engineering, design & construction, advanced engineering mathematics, and PMP references.
- **Utility tools** — unit conversion, programmer calculator, date calculation, and ramp geometry.

## Performance and execution safety

Specialist modules are loaded only when needed:
- Math Lab engine
- Advanced Solver and result formatter
- Research Mode
- reference Formula Library and formula explanations
- professional knowledge libraries, including direct formula deep links

Math Lab and exact arithmetic also apply browser-safety budgets. Loop counts, recursion depth, matrix/sample sizes, and pathological exact-number exponents are bounded so malformed or accidental inputs fail with explicit errors instead of requesting unbounded browser work.

## Research integrity

Research inputs use strict validation instead of silently normalizing invalid data:
- blank/non-finite inferential parameters are rejected;
- alpha must be between 0 and 1;
- regression rejects zero predictor or response variance where inference is undefined;
- chi-square counts/parameter counts/degrees of freedom are validated and observed/expected totals must match;
- negative measurement uncertainty is rejected instead of being converted to positive;
- exact decimal precision must be an integer from 1 to 1000.

## Privacy

Google AdSense and optional analytics are gated behind explicit external-services consent. A legacy Analytics acceptance is **not** promoted automatically into broader advertising consent. Users can revisit their choice from **Privacy choices** in the footer.

## Accuracy boundaries

- General numerical/transcendental calculations use IEEE-754 double precision unless stated otherwise.
- Research Mode exact rational arithmetic uses BigInt for supported algebraic operations within the documented browser-safety limits.
- Research/engineering helpers expose input-domain and dimensional validation but do not replace governing codes, signed engineering design, laboratory procedures, or specialist professional review.
- Advanced Solver is not a general-purpose CAS equivalent to Mathematica/Maple across all symbolic mathematics.
- Image/camera input currently provides validated local preview only; production OCR/math recognition is not connected.

## Verification

Run the full repository gate:

```bash
node scripts/verify-calculator.mjs
```

The GitHub Pages workflow runs this command before deployment. The gate executes every `tests/*.test.mjs` file, covering calculator behavior, lecture regression, scientific accuracy, research statistics, uncertainty, exact arithmetic, Math Lab execution budgets, engineering/formula libraries, localization, accessibility contracts, privacy controls, direct routing, startup lazy-loading, and global content integrity.

## Deployment

GitHub Pages deploys from `main` only after the verification job succeeds.

## Search guides

Nine worked-example specialty pages complement the original SEO landing pages (matrix, polynomial, complex number, regression, chi-square, uncertainty, ramp, environmental engineering and advanced engineering math). Each uses a unique canonical, visible explanations and linked tool. See [SEO audit](docs/SEO_AEO_AUDIT_V2_2026-10-12.md).

## Accuracy and simple-use update (2026-10-13)

- Scientific calculator: an explicit, keyboard-accessible **Calculate** action for full expression entry; focus remains stable when the calculator display re-renders. Global keypad shortcuts operate only on the active calculator and do not intercept controls or other workspaces.
- Research Mode: native, localized disclosure controls show one research workflow at a time while keeping all seven analytical tasks available.
- Ramp Calculator: basic rise/run geometry first; slope-derived design is accessible in a collapsed additional section.
- Unit Converter: empty input is rejected rather than silently interpreted as zero; precision settings are optional and collapsed.
- Statistical accuracy: two-sided Student-t and chi-square upper-tail p-values use numerically stable complementary distribution functions. Observed chi-square frequencies must be whole-number counts; expected counts may be fractional.
- Civil/hydraulics English and Arabic landing pages now open the corresponding library instead of defaulting to Accounting.

Run `node scripts/verify-calculator.mjs` for the complete mathematical, bilingual UI, SEO and consent regression gate. See [accuracy and UX review](docs/ACCURACY_UX_AUDIT_2026-10-13.md).

Source-backed tests are necessary but not sufficient for final visual QA: review mobile, desktop, keyboard tab order, 200% zoom, Arabic RTL and the calculator's physical key layout in a live browser.

## Research data-entry integrity (ECC-inspired quality pass, 2026-10-13)

Research Mode accepts numerical observations separated by commas, semicolons, spaces, tabs or new lines. Arabic-Indic and Persian digits are supported. For decimal fractions, use a dot or the Arabic decimal separator (٫); **commas separate observations**.

Missing observations are **never replaced by 0**. Empty comma/semicolon fields, blank pasted spreadsheet rows, repeated tabular separators, malformed exponents and non-finite values now produce a localized validation message. If regression or chi-square input columns have different counts, the interface identifies the issue instead of attempting to calculate.

See [the evidence-based ECC-style RED → GREEN audit](docs/ECC_RESEARCH_DATA_INTEGRITY_2026-10-13.md). This repository does not install the separate Everything Claude Code runtime. Existing calculator, Math Lab, privacy/consent, SEO and GitHub Pages workflows are not intentionally modified.

## Numerical semantics and robustness (ECC-style test-driven review, 2026-10-13)

- Dimensional Quantities now follows the Scientific Calculator's mathematical precedence: `-2^2 = -4`, `(-2)^2 = 4`, and exponent chains are right-associative (`2^3^2 = 512`). Dimensional checks and unit conversion are retained.
- Student-t critical values no longer stop at an arbitrary magnitude. A Cauchy/df=1 formula handles very small tail probabilities, while other valid degrees of freedom use checked bracketing. Values not representable reliably in ordinary JavaScript double precision return `NaN` instead of a convincing incorrect critical value.
- Measurement Uncertainty rejects null, booleans and blank values instead of silently treating them as measurements of zero. Legitimate numeric zero still works; numeric strings remain supported. Extremely small, finite standard uncertainties now display in scientific notation rather than `NaN ± NaN`.
- **Simple UI is preserved:** no extra buttons, setup screens, cookies, tracking scripts, or changes to existing math-tool lazy loading were added.

A full RED → GREEN test ledger, preserved behavior and manual-review caveats are in [the numerical accuracy audit](docs/ECC_NUMERICAL_SEMANTICS_2026-10-13.md). Use `node scripts/verify-calculator.mjs` to run the complete verification suite.
