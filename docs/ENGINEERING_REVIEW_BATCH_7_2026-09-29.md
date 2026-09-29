# Engineering Review — Batch 7 — 2026-09-29

Status: PASS WITH REQUIRED VALIDATION

## Scope
Broaden the Advanced Solver with controlled numerical root solving while keeping unsupported symbolic cases explicit.

## Implemented

### Numerical root solver
New supported forms:
- `nsolve(equation, variable, guess)` — Newton iteration from an explicit initial guess.
- `nsolve(equation, variable, min, max)` — bisection inside an explicit sign-changing bracket.

Examples:
- `nsolve(cos(x)=x,x,0.7)`
- `nsolve(x^3-2=0,x,1,2)`

### Safety / correctness behavior
- The solver never searches an unbounded domain implicitly.
- Invalid guesses or intervals return an explicit localized error.
- Bracketed mode requires a sign change or an endpoint root.
- Newton mode validates finite derivatives, iterates with bounded magnitude, and verifies residual before reporting a root.
- Results include root value, method, and residual.

### UI / localization
- Added one guess-based and one bracket-based example to Advanced Solver.
- Added English and Arabic result/error strings.
- Existing Advanced Solver behavior remains unchanged.

## Protected / unchanged
- Calculator physical behavior
- Formula libraries and professional knowledge workbench
- AdSense publisher identity / ads.txt / CMP
- Existing symbolic calculus / linear and nonlinear-system logic
- Public /Math/ route

## Required validation
- Latest GitHub Actions verify/deploy must pass.
- Manual browser QA: click both nsolve examples, switch language, verify result formatting, and test invalid input feedback.
