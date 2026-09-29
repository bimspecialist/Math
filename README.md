# Math

Scientific calculator web project with a familiar classic scientific interaction profile and independent branding.

## Current calculator work

Development branch: `feature/calculator-behavior-profile`

Implemented and regression-tested:
- contract-driven key inventory
- MODE/SETUP state behavior
- SHIFT and ALPHA one-shot modifiers
- vertical Natural Display fractions
- fraction slot navigation with REPLAY
- powers, square roots, nth roots
- CALC/SOLVE state flows
- exact/fraction ↔ decimal result toggle
- mixed/improper fraction presentation
- memory, Ans, DEL, AC, history/replay
- Arabic RTL shell with LTR mathematics

Advanced modes such as MATRIX, VECTOR, STAT, TABLE, BASE-N, EQN and CMPLX remain hidden until their complete workflows are implemented and tested.

## Verification

```bash
node scripts/verify-calculator.mjs
```

GitHub Pages deployment is gated by this verification command.

## Advanced Solver / Math Scan

The website keeps the UI entry point for image/camera input and advanced solving, but no production OCR/handwriting-recognition or symbolic-solver provider is configured yet. No provider secret is shipped in the static site.


## Math Lab

Math Lab is an expanding browser-based numerical workspace, not a MATLAB-compatible runtime. It currently supports persistent session variables, matrix algebra, linear systems, real 2×2 eigen analysis, array constructors, descriptive statistics, vector dot/cross operations, reshape/size helpers, and line-level error diagnostics. Trigonometric functions use radians by default, matching MATLAB-style numerical workflows.
