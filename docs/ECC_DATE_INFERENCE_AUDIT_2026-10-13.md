# ECC-inspired Date & Statistical Input Integrity Audit
Date: 2026-10-13  
Repository: `bimspecialist/Math`  
Base: `7ec1ca1a680519c2f483390fef854d907fd6ab76` (last successful `main`)  
Branch: `automation/ecc-date-reliability-20261013`

## Goal and protected behavior

Continue Math Workspace with **accuracy first** and a smooth, unchanged UI. Protect the Scientific Calculator, Math Lab, Research Mode defaults, unit converters, all current formulas, the Arabic/English experience, SEO entry pages, consent, and lazy module loading. The change is limited to date arithmetic and inference scalar validation.

## Confirmed issue A: years 0000–0099

Root cause: `Date.UTC(year, month, day)` remaps years 0–99 to 1900–1999. The date engine used it for parsing and month/year arithmetic, making valid four-digit dates fail or select the wrong leap-year rules.

- RED [CI run 38360708498](https://github.com/bimspecialist/Math/actions/runs/38360708498): six tests failed while 696 previous tests passed.
- GREEN [CI run 38360831131](https://github.com/bimspecialist/Math/actions/runs/38360831131): 702 passed, zero failed.
- Fix: create the Gregorian UTC date using `setUTCFullYear` from a known epoch; use the same helper for parsing, month end and offset generation.
- Guard output date years to the supported ISO four-digit range `0000–9999`, instead of returning malformed substrings of extended-year timestamps.
- Reject missing offsets rather than coercing `""`, `null`, booleans or undefined to zero. Preserve explicit numeric `0` and `"0"`.
- The UI now passes the raw date-offset string to domain validation; existing bilingual `INVALID_OFFSET` messaging and `aria-live` outputs are reused.

Examples protected by tests:

| Expression | Expected |
|---|---|
| `daysBetween('0099-12-31','0100-01-01')` | `1` |
| `addDateUnits('0000-01-31',1,'months')` | `0000-02-29` |
| `addDateUnits('0000-02-29',1,'years')` | `0001-02-28` |
| `addDateUnits('9999-12-31',1,'days')` | `INVALID_DATE` |
| `addDateUnits('2026-10-13','', 'days')` | `INVALID_OFFSET` |

## Confirmed issue B: invalid statistical parameter values

Root cause: the existing use of `Number(mu0)` and `Number(estimatedParameters)` converted `null`, `false`, and blank strings into numeric zero. These inputs could produce believable but unintended Student-t or chi-square results.

- RED [CI run 38361070881](https://github.com/bimspecialist/Math/actions/runs/38361070881): two failing scalar-input tests, 702 passing.
- Refined contract: `undefined`/omitted optional parameters intentionally use the existing documented defaults, while explicit null, blank or boolean values must be rejected. The refined test still failed as expected at [run 38361208944](https://github.com/bimspecialist/Math/actions/runs/38361208944).
- GREEN [CI run 38361333853](https://github.com/bimspecialist/Math/actions/runs/38361333853): 705 passed, zero failed.
- Fix: one small finite-scalar validator applied to scalar inference parameters; numeric strings remain accepted. Input datasets still use existing `cleanData` validation and previous regression tests.

## Lessons and QA boundaries

**Recurring failure fingerprint:** implicit JavaScript coercion (`Number(null)`, `Number(false)`, `Number("")`) can silently turn absent values into valid zero. Prevention: every new number-bearing API must test blank/null/boolean, legitimate zero, and default-argument behavior separately.

**Verification:** GitHub Actions executes `node scripts/verify-calculator.mjs`. New tests: `tests/date-early-year-and-input-integrity.test.mjs` and `tests/statistical-scalar-integrity.test.mjs`, in addition to all existing calculator, engineering, research, translation, SEO and consent checks.

**Open validation:** Browser visual/mobile/RTL and assistive technology flows have not been verified in a live browser in this run. Backward compatibility of valid modern-date input is supported by full automated tests, not an exhaustive human UI audit.

**Release gate:** Do not merge before final PR-head CI succeeds, and verify GitHub Pages `verify` and `deploy` stages on the actual merged commit.
