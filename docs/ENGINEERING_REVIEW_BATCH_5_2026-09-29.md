# Engineering Review — Batch 5 — 2026-09-29

Status: PASS WITH REQUIRED VALIDATION

## Scope
Formula-calculator resilience, shareable formula routes, input validation, and professional knowledge search.

## Implemented

### Formula calculator reliability
- Formula inputs are required numeric fields with accessible invalid-state feedback.
- Missing/invalid values focus the first invalid field.
- Enter submits the formula form.
- Clear values resets the workbench.
- Copy result copies the substituted expression and calculated result when Clipboard API is available.
- Numeric professional results use locale-aware formatting.
- Entered values survive switching between English and Arabic.
- Formula calculator heading remains correct after locale changes.

### Shareable formula links
- Professional formulas use hash routes in the form `#formula/professional/<library>/<formula>`.
- General formulas use `#formula/reference/<formula>`.
- Direct visits restore the requested formula when it exists.

### Professional knowledge search
- Accounting, Civil Engineering, and PMP libraries now include live search.
- Search covers bilingual titles, formulas, and bilingual explanations.
- Result counts and empty states are localized.

## Protected / unchanged
- AdSense publisher identity and root ads.txt
- Google CMP configuration
- calculator behavior
- existing formula explanations and professional calculation logic
- /Math/ public route

## Validation required
- Latest GitHub Actions verify/deploy must pass.
- Manual browser QA: formula deep links, copy action, locale switch while inputs contain values, mobile workbench layout, and knowledge search.
