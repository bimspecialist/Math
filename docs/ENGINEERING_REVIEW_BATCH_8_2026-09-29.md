# Engineering Review — Batch 8 — 2026-09-29

Status: PASS WITH REQUIRED VALIDATION

## Scope
Focused expansion of Math Lab from a basic numerical scratchpad toward a durable browser-based engineering workspace.

## Implemented

### Persistent session workspace
- Variables now survive successive Run operations during the current page session.
- Added Clear workspace without forcing the user to erase the script.
- Added Clear output independently from workspace state.
- Ctrl+Enter / Cmd+Enter runs the current script.

### Statistics
Added:
- `sum`
- `mean`
- `median`
- `min`
- `max`
- `var` / `variance`
- `std`

Variance and standard deviation use sample normalization (N-1) when more than one value is present.

### Vector operations
Added:
- `dot(a,b)`
- `cross(a,b)` for 3D vectors
- existing `norm` retained

Dimension mismatches return explicit errors rather than silently coercing data.

### Array / shape utilities
Added:
- `reshape(value, rows, cols)`
- `numel(value)`
- `rows(value)`
- `cols(value)`
- existing `size`, `linspace`, `eye`, `zeros`, `ones`, and `diag` retained

### Diagnostics
- Runtime errors now include the failing script line and source text.
- Common Math Lab errors have English and Arabic explanations.
- Workspace and command-window rendering is more readable for matrices.

### UI / discoverability
- Added examples for Linear systems, Statistics, and Vectors.
- Added a collapsible Supported commands reference.
- Added localized run status, workspace clearing, and output clearing feedback.

## Protected / unchanged
- Scientific calculator behavior
- Advanced Solver behavior
- Formula libraries
- AdSense identity / ads.txt / CMP
- Public /Math/ route

## Required validation
- Latest GitHub Actions verify/deploy must pass.
- Manual browser QA: persistent variables across runs, Ctrl+Enter, statistics example, vectors example, error line display, Arabic localization, mobile Math Lab layout.
