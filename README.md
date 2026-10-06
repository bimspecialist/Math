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
