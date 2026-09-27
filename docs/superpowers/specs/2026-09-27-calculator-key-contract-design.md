# Calculator Key Contract & Natural Math Display Redesign

Date: 2026-09-27
Status: REVISED_DESIGN_READY FOR USER REVIEW
Scope: Web calculator redesign only
Review mode: "100 expert perspectives" — structured multidisciplinary review, not 100 real people.

## 1. Why this redesign exists

The current calculator visually resembles a familiar scientific calculator, but its feature completeness is not guaranteed. The user identified the most important concrete gap: there is no true vertical numerator/denominator input template.

The redesign replaces ad-hoc key arrays with a **Key Completeness Contract** and replaces plain-text mathematical entry with **Structured Natural Math Input**.

No production UI changes should be merged until the key contract and math-input behaviors below are implemented with regression tests.

## 2. Evidence and reference behavior

Primary references:

- CASIO fx-570ES PLUS / fx-991ES PLUS official User's Guide:
  https://www.casio.com/content/dam/casio/global/support/manuals/calculators/pdf/004-en/f/fx-570_991ES_PLUS_EN.pdf
- CASIO fx-991ES PLUS official product page:
  https://www.casio.com/intl/scientific-calculators/product.FX-991ESPLUS/
- CASIO Arabic fx-570ES PLUS / fx-991ES PLUS manual:
  https://support.casio.com/global/ar/calc/manual/fx-570ESPLUS_991ESPLUS_ar/

Reference facts used in this design:

- Natural Display shows fractions and supported functions as written on paper.
- Official documentation lists Natural Display support for fractions, logarithms, powers, roots, inverse powers, 10^x, e^x, integration, derivatives, summation and Abs.
- SHIFT invokes yellow alternate labels and then automatically clears after the next applicable key.
- ALPHA invokes variables/constants/symbols and then clears after the next applicable key.
- REPLAY/history uses directional navigation.
- S↔D toggles compatible results between exact/fraction and decimal forms.
- SHIFT + S↔D is used for mixed/improper fraction result conversion.
- Fraction result format can be mixed (a b/c) or improper (d/c).
- Modes include COMP, CMPLX, STAT, BASE-N, EQN, MATRIX, TABLE and VECTOR.

We reproduce familiar interaction concepts but do not copy CASIO branding, logos, product names, or proprietary industrial artwork.

## 3. Design principles

1. Familiar before novel.
2. Every visible key must have a defined primary action.
3. Every visible SHIFT or ALPHA legend must be implemented.
4. Math structures are edited structurally, not faked as strings.
5. Keyboard and on-screen input produce the same expression tree.
6. Visual similarity must not come at the cost of missing functionality.
7. Missing key/function = failed release gate.

## 4. Structured Math Input Model

The display/editor owns an expression tree rather than only a flat string.

Minimum node types:

- Number
- Variable
- Constant
- UnaryFunction
- BinaryOperator
- Parenthesized
- Fraction
- MixedFraction
- Power
- SquareRoot
- NthRoot
- FunctionCall
- AbsoluteValue

Future nodes:
- Integral
- Derivative
- Summation
- Matrix
- Vector

### 4.1 Vertical fraction

Pressing the fraction-template key creates:

    [ numerator ]
    -------------
    [ denominator ]

This is a real two-slot structure.

Required navigation:

- New template focuses numerator.
- Down / REPLAY ↓ moves numerator → denominator.
- Up / REPLAY ↑ moves denominator → numerator.
- Right at denominator end exits the fraction.
- Left at numerator start exits before the fraction.
- Backspace at an empty slot can collapse/remove the template safely.
- Nested expressions are allowed in both slots.
- Keyboard "/" invokes the same vertical fraction structure when context allows.

Required examples:

- fraction key, 1, down, 2  =>  1/2 shown vertically.
- 1/2 + 1/3 => exact 5/6.
- numerator may contain x^2 + 1.
- denominator may contain sqrt(x) + 3.
- nested fractions must remain navigable.

### 4.2 Mixed fraction

A mixed-fraction template has integer, numerator and denominator regions.
It must be distinct from improper fraction display settings.

### 4.3 Powers and roots

Power:
- x^[slot]
- cursor enters exponent
- right exits exponent

Square root:
- radical bar expands over its child expression

Nth root:
- root-index slot plus radicand slot
- deterministic navigation between index, radicand, and outside

## 5. Key Completeness Contract

Every key is declared in one data source.

Required fields:

- id
- row
- column
- primaryLabel
- primaryAction
- shiftLabel
- shiftAction
- alphaLabel
- alphaAction
- styleRole
- expressionTemplate
- navigationBehavior
- accessibilityName
- regressionCaseIds

A build-time or test-time audit must fail when:

- a rendered key has no contract entry;
- a contract entry has no rendered key;
- a visible SHIFT/ALPHA label has no implementation;
- a key action points to an unknown command;
- a required key from the approved inventory is missing.

## 6. Approved minimum key inventory

This inventory is based on the user's reference image and the official fx-991ES PLUS family documentation. Exact visual spacing may differ to preserve our own identity.

### Control deck

| ID | Primary | Required behavior |
|---|---|---|
| SHIFT | SHIFT | one-shot alternate-function state |
| ALPHA | ALPHA | one-shot variable/symbol state |
| MODE | MODE | mode selector |
| SETUP | SETUP | display/angle/format setup |
| ON | ON | reset transient input state / wake behavior |
| REPLAY_UP | ↑ | history/template navigation |
| REPLAY_DOWN | ↓ | history/template navigation |
| REPLAY_LEFT | ← | cursor/template navigation |
| REPLAY_RIGHT | → | cursor/template navigation |

### Scientific/function area

| ID | Primary | SHIFT / secondary requirement |
|---|---|---|
| FRAC | vertical fraction template | mixed-fraction template |
| SQRT | √ | square |
| SQUARE | x² | no secondary legend until verified |
| POWER | x^y | nth-root |
| LOG | log | 10^x |
| LN | ln | e^x |
| INVERSE | x⁻¹ | factorial |
| NEGATE | (-) | no secondary legend until verified |
| DMS | °′″ | no secondary legend until verified |
| HYP | hyp | hyperbolic function state |
| SIN | sin | sin⁻¹ |
| COS | cos | cos⁻¹ |
| TAN | tan | tan⁻¹ |
| NCR | nCr | nPr |
| ABS | Abs | no secondary legend until verified |
| RCL | RCL | STO is a separate state/action; do not infer an alternate legend |
| ENG | ENG | no secondary legend until verified |
| LPAREN | ( | no secondary/alpha legend until verified |
| RPAREN | ) | no secondary/alpha legend until verified |
| S_D | S↔D | mixed ↔ improper conversion via SHIFT |
| M_PLUS | M+ | no secondary legend until verified |
| EXP | ×10^x / EXP | no secondary/alpha legend until verified |
| ANS | Ans | no secondary legend until verified |

### Numeric/operation area

- 0 1 2 3 4 5 6 7 8 9
- decimal point
- multiply
- divide
- add
- subtract
- DEL
- AC
- equals

### Advanced functions available through MODE / menus rather than crowding the main face

- CALC
- SOLVE
- Integration
- Derivative
- Summation
- Complex
- Statistics
- Base-N
- Equation
- Matrix
- Table
- Vector
- Scientific constants
- Metric conversions

These functions are required at product level, but do not all need dedicated face keys if the approved physical reference accesses them through alternate keys/menus.

## 7. SHIFT and ALPHA state rules

SHIFT:
- activates one-shot alternate action;
- visible indicator appears on display;
- successful alternate action clears SHIFT;
- AC clears SHIFT;
- pressing SHIFT again cancels it.

ALPHA:
- activates one-shot variable/symbol action;
- visible indicator appears on display;
- successful alpha input clears ALPHA;
- AC clears ALPHA;
- pressing ALPHA again cancels it.

The exact variable map must be verified from the approved reference before its legends are rendered. Unverified ALPHA legends are omitted rather than guessed. The mapping must never be inferred ad hoc inside click handlers.

## 8. Display behavior

The calculator display is split into:

1. status indicators;
2. structured input region;
3. result region.

Natural Display rules:

- fractions render vertically;
- roots use expanding radicals;
- superscripts render as actual exponent layout;
- cursor position is visually obvious;
- active template slot is highlighted without relying on color alone;
- Arabic UI direction must not reverse mathematical order;
- expression rendering remains mathematically LTR while surrounding UI can be RTL.

## 9. Architecture

### Components

CalculatorShell
- physical-style layout only

Keypad
- renders keys from KeyContract

KeyContract
- single source of truth for key inventory

MathFieldAdapter
- abstraction over the structured math editor implementation

MathExpressionModel
- normalized expression representation

CalculatorController
- SHIFT/ALPHA/mode/memory/history state

MathEngineAdapter
- converts structured expression to evaluator form

ResultFormatter
- exact / decimal / fraction / engineering output

### Library boundary

Evaluate MathLive first for structured input because it supports math fields, templates and programmable navigation.

Do not bind application logic directly to MathLive APIs.

Required interface:

- insertFraction()
- insertMixedFraction()
- insertPower()
- insertSquareRoot()
- insertNthRoot()
- moveNextSlot()
- movePreviousSlot()
- moveUp()
- moveDown()
- getCanonicalExpression()
- setCanonicalExpression()
- focus()

A different editor library must be swappable behind this adapter.

## 10. Regression tests

### Completeness tests

- approved key count matches rendered key count;
- FRAC exists;
- FRAC has a vertical-template action;
- every visible SHIFT label has an action;
- every visible ALPHA label has an action;
- no key uses noop/placeholder in release mode.

### Fraction tests

- 1/2 entered structurally;
- 1/2 + 1/3 = 5/6;
- 7/3 renders as an improper fraction when configured;
- mixed-fraction display works when configured;
- S↔D converts 1/2 ↔ 0.5;
- SHIFT + S↔D switches compatible mixed/improper results;
- nested numerator/denominator navigation;
- keyboard "/" and FRAC key produce equivalent structures.

### Natural Display tests

- x^3 renders exponent vertically;
- sqrt(x+1) has an expanding radical;
- nth-root has index and radicand slots;
- cursor exits templates predictably;
- RTL UI leaves math token order intact.

### State tests

- SHIFT one-shot lifecycle;
- ALPHA one-shot lifecycle;
- AC reset;
- DEL structured deletion;
- REPLAY/history navigation;
- memory store/recall;
- Ans.

### Visual regression checklist

Representative screenshots:

- desktop Arabic;
- desktop English;
- narrow mobile Arabic;
- narrow mobile English;
- fraction active in numerator;
- fraction active in denominator;
- SHIFT active;
- ALPHA active;
- dark mode;
- high-contrast/focus state.

## 11. "100 expert perspectives" review summary

Coverage groups:

- Product/UI familiarity
- Human factors and key density
- Web frontend architecture
- Structured math editing
- Numerical correctness
- Scientific calculator behavior
- Accessibility
- Keyboard/focus
- Arabic/RTL
- Responsive/mobile
- State management
- Error recovery
- Regression testing
- Visual regression
- Performance
- Security/privacy
- Dependency/supply-chain
- Observability
- Release management
- Long-term Windows parity

Primary finding:
The previous implementation treated physical similarity as the main artifact. The redesign makes **behavioral completeness + structured math input** the primary contract, with visual similarity layered on top.

## 12. Acceptance gates before GitHub Pages deployment

PASS only when all are true:

- no missing approved keys;
- no visible placeholder/noop key;
- vertical fraction works;
- fraction navigation works;
- Natural Display works for fraction, power and root;
- key contract audit passes;
- math behavior regression suite passes;
- RTL/LTR checks pass;
- keyboard checks pass;
- mobile layout checks pass;
- visual screenshot review completed;
- GitHub Pages deployment succeeds.

If any mandatory gate fails, status is BLOCKED.

## 13. Implementation order

1. Freeze approved primary key inventory and verify every displayed SHIFT/ALPHA legend against the reference/manual before rendering it.
2. Add KeyContract and completeness tests.
3. Add MathFieldAdapter behind a test double.
4. Implement vertical fraction template.
5. Implement power/root templates.
6. Wire FRAC, REPLAY and keyboard navigation.
7. Implement S↔D and mixed/improper formatting.
8. Complete SHIFT/ALPHA mappings.
9. Complete remaining approved keys.
10. Visual redesign against the reference image.
11. Responsive + RTL/LTR QA.
12. Visual regression review.
13. Deploy to GitHub Pages only after gates pass.

## 14. Non-goals for this redesign

- CASIO trademark/logo reproduction.
- Pixel-for-pixel industrial-design copying.
- Implementing every one of the 417 calculator functions in the first redesign batch.
- Advanced web solver integration.
- OCR/handwriting provider integration.

Those remain separate workstreams.


## Approved interaction baseline

The user approved a familiar ES Plus-style interaction model as the baseline for the first release, implemented independently with this product's own branding and visual identity.

Behavior requirements:
- MODE opens a selectable calculation-mode menu rather than directly toggling the angle unit.
- The target mode inventory is COMP, CMPLX, STAT, BASE-N, EQN, MATRIX, TABLE, and VECTOR; a mode is shown in release UI only when its workflow is implemented and tested.
- SHIFT + MODE opens SETUP.
- SETUP owns angle unit, input/output format, number format, fraction-result format, and other implemented calculation/display settings.
- SHIFT and ALPHA are one-shot modifier states with visible status indicators.
- REPLAY direction keys are context-sensitive for structured-expression navigation and calculation history.
- CALC evaluates an expression after prompting for required variable values.
- SHIFT + CALC enters SOLVE where supported.
- S↔D toggles compatible exact/fraction and decimal results.
- SHIFT + S↔D toggles compatible improper/mixed fraction presentation.
- ON is not implemented as an AC alias.
- Menus define numbered choices, arrow navigation, direct numeric selection where supported, confirm, cancel/back, resulting state, keyboard equivalent, and accessibility announcement.

## Behavior profile architecture

Add a BehaviorProfile boundary beside KeyContract. It defines menu semantics, key state transitions, supported modes, setup options, and result-toggle behavior. The first profile is an ES Plus-style scientific profile. Future profiles may reuse the math engine without changing its internals.

## Additional regression gates

The release test suite must verify:
- MODE opens a menu and does not merely toggle DEG/RAD.
- MODE selection enters the selected implemented mode.
- SHIFT + MODE opens SETUP.
- SETUP angle-unit selection updates both indicator and engine behavior.
- CALC prompts for required variables.
- SHIFT + CALC enters SOLVE only where supported.
- REPLAY is tested in expression-edit and history contexts.
- S↔D and SHIFT + S↔D have separate verified result-format behavior.
- A visible mode with an unimplemented workflow fails the release gate.

## Evidence boundary

Official manuals, product pages, and FAQs document observable behavior and supported features; they do not disclose proprietary firmware source code. This project independently implements documented external behavior.

Every key behavior is classified before implementation:
- VERIFIED: backed by an official reference.
- PRODUCT_DECISION: deliberate behavior required by browser/app constraints.
- BLOCKED: insufficient evidence; do not show a misleading legend or claim.

Primary verification sources are the official fx-570ES PLUS / fx-991ES PLUS User's Guide, official product specifications, official CASIO MODE/S↔D FAQs, and the official Arabic manual for terminology/workflow cross-checks.

## Council-of-100 release rule

The multidisciplinary review adopts a behavior-first definition of completeness. A calculator face is complete only when every visible key and alternate legend has a verified state transition, mathematical effect or menu workflow, error behavior, focus/keyboard behavior, and regression test.

Priority order: complete primary keys; MODE/SETUP; Natural Display templates; SHIFT/ALPHA; CALC/SOLVE; REPLAY/history; memory/Ans; exact-decimal-fraction formatting; then advanced modes according to tested implementation status.
