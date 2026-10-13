# ECC-inspired quality review: Research data integrity
Date: 2026-10-13
Repository: bimspecialist/Math
Baseline: `7d9eaa1b93d187f64cc9866b8ef115c3d2f2ff19`
Branch: `automation/ecc-research-integrity-20261013`

## Verification-first scope

This is a focused product reliability update. We checked the ECC project's plan → test → implement → review → verify pattern, using available problem-solving and web-UX skills. No external ECC plugin was installed or executed; the purpose was to apply the method, not to import an unrelated runtime.

**Protected behavior:** scientific calculator, advanced solver, Math Lab, visual design, all other engineering tools, Arabic/English localization, existing consent/analytics handling, lazy-loading boundaries and static SEO pages.

**Authorized delta:** prevent missing research observations being silently dropped/coerced into zeros, preserve paired data alignment, give bilingual actionable errors and keyboard-visible validation.

## Verified failure and root cause

1. The statistical backend's previous `data.map(Number)` accepted null, boolean and blank-string cells as zeros.
2. The Research Mode front end previously used `.split(/[;,\\s]+/).filter(Boolean).map(Number)`, discarding empty comma-delimited cells before reaching statistical checks.
3. Clipboard-pasted blank rows and consecutive tab separators could also silently remove observations and alter data alignment.

This combination could produce mathematically consistent calculations on **incorrect data**, especially when a regression input column contained an absent cell.

## TDD evidence

- RED commit `36c0e213`: three targeted regression tests failed (676 previous tests passed).
- GREEN commit `f8b21216`: backend rejects nonnumeric/missing observations; complete CI passed.
- Strict bilingual parser plus UI commit `a06ccad1`: complete CI passed.
- RED commit `3a10daca`: one dedicated blank-spreadsheet-row/column test failed (683 tests passed).
- GREEN commit `1771ee90`: rejects the previously omitted blank cells; complete CI passed.
- Additional integration assertions check the unchanged numeric reference outputs for regression and chi-square.

These are deterministic automated findings, not fabricated browser observations.

## User experience behavior

Research Mode remains collapsed into native disclosures. Each data field includes visible guidance and a screen-reader-connected `aria-describedby` hint. Invalid input sets `aria-invalid`, focuses the affected field and writes a localized message to the existing live result output. The visual border uses a semantic error token in light and dark themes.

Accepted inputs:
- `1,2,3` or `1; 2; 3`;
- `1 2 3`, `1\t2\n3`, or vertically pasted spreadsheet values;
- `-3e-2`, `2.5`, Arabic `٢٫٥` and Persian digits.

Rejected inputs:
- `1,,3`, trailing comma, doubled separators;
- pasted blank lines and repeated tabs;
- non-finite values, hex strings or malformed exponents;
- different paired-list lengths (an explicit mismatch message);
- programmatic arrays containing `null`, `false` or blank strings.

No spreadsheet connector, external processor, data upload or new tracking service was added.

## Review and future gates

- Re-run `node scripts/verify-calculator.mjs` in GitHub Actions before merging.
- Confirm any change to `parseResearchSeries`, statistical `cleanData`, or Research Mode event handlers keeps the empty-row and paired-column regression tests.
- Check the exact workflow statuses on the PR head and main.
- **Required manual checks:** paste data in a desktop browser and mobile browser, including Arabic numerals; validate field focus, contrasts, screen-reader hint speech, and state of the currently open research disclosure. No claim of completed pixel-level validation without this evidence.

## Improvement backlog (not part of this release)

- Optional one-column CSV import with explicit preview/missing-cell highlights rather than implicit guessing.
- Large-sample performance measurement before changing limits or adding worker-based parsing.
- Field-data Core Web Vitals tracking only through consent-compliant measurement and with trustworthy comparison baselines.

**Completion rule:** report PASS for automated checks only. Runtime UI/assistive-technology coverage remains PASS WITH REQUIRED VALIDATION until exercised in a browser.
