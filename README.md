# Math Workspace

Browser-based scientific, engineering, and research mathematics workspace with English/Arabic UI. Core calculations run locally in the browser.

## Main workspaces

- **Scientific Calculator** — natural lecture-style entry, exact fractions, trigonometry, calculus helpers, probability, scientific constants, complex-number mode, and expert functions.
- **Advanced Solver** — equations, systems, numerical roots, limits, supported symbolic calculus/transforms, and verified polynomial roots through degree 8.
- **Research Mode** — exact BigInt rational arithmetic, dimension-aware physical quantities, uncertainty propagation, Student-t inference, linear-regression diagnostics, chi-square goodness-of-fit, and scientific constants.
- **Math Lab** — MATLAB-style numerical workspace with matrices, linear systems, LU/QR/Cholesky/SVD, condition number, pseudoinverse, least squares, FFT, interpolation, polynomial/signal tools, numerical calculus, root finding, and RK4/ODE helpers.
- **Graphing** — multiple expressions, configurable viewport, discontinuity detection, and robust automatic scaling.
- **Professional knowledge libraries** — accounting, civil engineering, hydraulics, environmental engineering, design & construction, advanced engineering mathematics, and PMP references.
- **Utility tools** — unit conversion, programmer calculator, date calculation, and ramp geometry.

## Performance and privacy

Large specialist modules are loaded on demand where practical:
- Math Lab engine is lazy-loaded on first Math Lab use.
- Professional knowledge libraries are lazy-loaded on first knowledge-library use, including direct formula deep links.

Google AdSense and optional analytics are gated behind explicit external-services consent. Users can revisit their choice from **Privacy choices** in the footer.

## Accuracy boundaries

- General numerical/transcendental calculations use IEEE-754 double precision unless the UI states otherwise.
- Research Mode exact rational arithmetic uses BigInt for supported algebraic operations.
- Research/engineering helpers expose input-domain and dimensional validation but do not replace governing codes, signed engineering design, laboratory procedures, or specialist professional review.
- Advanced Solver is not a general-purpose CAS equivalent to Mathematica/Maple across all symbolic mathematics.
- Image/camera input currently provides local preview only; production OCR/math recognition is not connected.

## Verification

Run the full repository gate:

```bash
node scripts/verify-calculator.mjs
```

The GitHub Pages workflow runs this command before deployment. The gate executes all `tests/*.test.mjs`, including calculator behavior, lecture regression, scientific accuracy, research statistics, matrix decompositions, engineering/formula libraries, localization, accessibility contracts, privacy controls, startup lazy-loading, and global content integrity.

## Deployment

GitHub Pages deploys from `main` only after the verification job succeeds.
