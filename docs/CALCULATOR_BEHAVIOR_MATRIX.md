# Calculator Behavior Matrix

Date: 2026-09-27
Profile: `es-plus-style`
Status legend: VERIFIED / PRODUCT_DECISION / BLOCKED

## Evidence boundary

This project independently implements documented observable behavior. It does not reproduce or claim access to proprietary calculator firmware.

Primary references:
- CASIO fx-570ES PLUS / fx-991ES PLUS User's Guide: https://www.casio.com/content/dam/casio/global/support/manuals/calculators/pdf/004-en/f/fx-570ESPLUS_991ESPLUS_EN.pdf
- CASIO Arabic manual: https://support.casio.com/global/ar/calc/manual/fx-570ESPLUS_991ESPLUS_ar/
- CASIO memory functions: https://support.casio.com/global/en/calc/manual/fx-570ESPLUS_991ESPLUS_en/basic_calculations/memory_functions.html
- CASIO CALC: https://support.casio.com/global/en/calc/manual/fx-570ESPLUS_991ESPLUS_en/function_calculations/using_CALC.html

## Face controls

| Control | Status | Behavior |
|---|---|---|
| SHIFT | VERIFIED | One-shot secondary function state |
| ALPHA | VERIFIED | One-shot variable/equality input state |
| MODE | VERIFIED | Opens mode menu |
| SHIFT + MODE | VERIFIED | Opens SETUP |
| ON | PRODUCT_DECISION | Resets calculator session state; does not claim device power-off |
| REPLAY ↑↓←→ | VERIFIED / PRODUCT_DECISION | Structured-template navigation first; history recall when outside template |
| FRAC | VERIFIED | Inserts vertical numerator/denominator structure |
| SHIFT + FRAC | VERIFIED | Inserts mixed-fraction structure |
| √ | VERIFIED | Structured square-root input |
| xʸ | VERIFIED | Structured power input |
| SHIFT + xʸ | VERIFIED | Structured nth-root input |
| x⁻¹ | VERIFIED | Reciprocal token |
| SHIFT + x⁻¹ | VERIFIED | Factorial |
| log / ln | VERIFIED | Logarithmic functions |
| SHIFT + log / ln | VERIFIED | 10^x / e^x |
| sin/cos/tan | VERIFIED | Trigonometric functions |
| SHIFT + trig | VERIFIED | Inverse trigonometric functions |
| nCr | VERIFIED | Combination |
| SHIFT + nCr | VERIFIED | Permutation |
| CALC | VERIFIED | Creates variable-value prompt state |
| SHIFT + CALC | VERIFIED | SOLVE workflow state in supported COMP profile |
| ALPHA + CALC | VERIFIED | Equality input |
| RCL | VERIFIED | Recall independent memory |
| SHIFT + RCL | VERIFIED | Store current result |
| M+ | VERIFIED | Add current result to memory |
| SHIFT + M+ | VERIFIED | Subtract current result from memory |
| S↔D | VERIFIED | Exact/fraction ↔ decimal presentation |
| SHIFT + S↔D | VERIFIED | Improper ↔ mixed fraction presentation |
| Ans | VERIFIED | Inserts previous result |
| DEL / AC | VERIFIED | Structured delete / clear transient input |
| 0–9, ., +, −, ×, ÷, = | VERIFIED | Basic calculation controls |
| Keyboard / | PRODUCT_DECISION | Maps to FRAC vertical template for natural web entry |

## Modes
COMP is visible/selectable and VERIFIED. CMPLX, STAT, BASE-N, EQN, MATRIX, TABLE and VECTOR are BLOCKED and hidden until their workflows are implemented and tested.

## Natural Display
Vertical fractions, numerator/denominator navigation, nested fractions, roots, powers, and RTL-shell/LTR-math behavior are covered by regression tests. Mixed fractions and the final visual proportions still require browser visual validation.

## Release gate
`node scripts/verify-calculator.mjs` must pass before GitHub Pages deployment.
