# Calculator UX / Physical-Parity Audit — 2026-09-28

Status: BLOCKED
Review mode: Council of 1000 perspectives (organized review lenses; not 1000 literal people)
Scope: deployed GitHub Pages artifact, calculator rendering, bidi/layout, structured math, key map, menus, tests, and deployment evidence.

## Executive finding

The repeated RTL fixes targeted the wrong layer.

The currently deployed artifact already contains:
- `<html lang="ar" dir="ltr">`;
- `document.documentElement.dir="ltr"` on language switch;
- calculator shell `dir="ltr"`;
- calculator face `dir="ltr"`;
- CSS hard-isolation forcing the calculator subtree to LTR.

Therefore the remaining user-visible “right-to-left” problem is **not primarily bidi direction**. It is caused by **visual alignment and physical key-map semantics**.

The strongest concrete defect is:
- `.math-input { justify-content:flex-end; }`

That rule places the entered expression at the **right edge** of the LCD even though the DOM is LTR. A user reasonably experiences that as right-to-left calculator entry.

The result area is also intentionally right aligned:
- `.math-result { text-align:right; }`
- later overridden to flex with `justify-content:flex-end`.

For physical-calculator parity, entry and result alignment must be specified separately.

## Evidence

### Deployment evidence

Latest inspected GitHub Pages artifact:
- workflow run: `36429873382`
- head SHA: `58467520261704b7f6ff5ee274f7d8dde4ee3f4f`
- deployment conclusion: success
- artifact digest: `sha256:5213bfef2797a62f26a8acf559fb15017e47930e35e6f697cbbe4ef3dccc5a1c`

The deployed artifact itself contains the LTR attributes/rules listed above. This rules out “the code was never deployed” as the primary explanation.

### Official behavior evidence

CASIO fx-570ES PLUS / fx-991ES PLUS documentation states:
- alternate functions are printed above keys;
- SHIFT or ALPHA followed by a second key invokes the alternate function;
- MODE opens calculation-mode selection;
- SHIFT + MODE opens SETUP;
- Natural Display shows fractions and expressions in textbook form.

CASIO also documents COMP, CMPLX, STAT, BASE-N, EQN, MATRIX, TABLE, and VECTOR mode selection for this family.

## Findings

### F-01 — CRITICAL — Input is visually right-aligned despite LTR DOM

Evidence:
`styles/calculator.css`:
`.math-input { ... justify-content:flex-end; ... }`

Root cause:
Bidi direction and visual alignment were treated as the same problem.

Impact:
The expression appears to grow from the right edge. This contradicts the requested traditional left-to-right entry experience and explains why repeated `dir=ltr` changes did not satisfy the user.

Fix:
Use a dedicated LCD entry viewport with `direction:ltr`, `unicode-bidi:isolate`, and left/start visual anchoring. Keep answer alignment a separate decision.

Regression:
A browser layout test must verify the first expression token's x-coordinate is near the LCD's left/start edge at both Arabic and English locale.

Verification:
Screenshot + DOM bounding-box assertion at desktop and mobile widths.

### F-02 — HIGH — Site direction was globally forced LTR to fix a calculator-local problem

Evidence:
- root HTML is `dir="ltr"` even when `lang="ar"`;
- language toggle always sets `document.documentElement.dir="ltr"`;
- `.calculator-shell * { direction:ltr; }`.

Root cause:
Direction containment was implemented globally instead of separating:
1. site language direction;
2. calculator chassis direction;
3. mathematical expression direction;
4. localized menu/message direction.

Impact:
Arabic site UI loses proper RTL semantics, while the calculator still can look visually wrong because alignment/order are independent properties.

Fix:
Restore page direction by locale. Lock only the physical calculator chassis and mathematical surfaces to LTR. Do not apply LTR blindly to every descendant.

Regression:
Arabic page header/navigation must be RTL; calculator key geometry and math entry must remain LTR.

### F-03 — HIGH — Physical key map is custom, not an approved coordinate map

Evidence:
`render-calculator.js` contains a hand-authored `scientificOrder`:
`INVERSE, FRAC, SQRT, POWER, LOG, LN, ...`

Root cause:
We used array ordering plus CSS flow instead of a verified row/column coordinate contract based on the approved reference calculator.

Impact:
Even with correct LTR direction, experienced calculator users do not get the expected muscle memory.

Fix:
Create `PHYSICAL_LAYOUT_PROFILE` with explicit row/column coordinates for every visible key. Render from coordinates, not from ad-hoc array order.

Regression:
Snapshot/coordinate test for each row and key position.

### F-04 — HIGH — SETUP exists twice conceptually

Evidence:
- MODE has SHIFT legend `SETUP`;
- a separate visible `SETUP` primary key is also rendered.

Official ES Plus behavior:
SETUP is accessed through SHIFT + MODE.

Root cause:
A convenience web control was added while the product goal later changed to physical-calculator parity.

Impact:
The user cannot operate the web calculator with the same learned key sequence as the traditional calculator.

Fix:
Remove standalone SETUP from the physical-parity profile. Keep `SHIFT → MODE` as the canonical path.

Regression:
No visible standalone SETUP key; SHIFT + MODE opens SETUP.

### F-05 — HIGH — MODE parity is incomplete

Evidence:
Behavior profile defines multiple modes, but the menu builder exposes only `implemented` modes. Currently only COMP is selectable.

Impact:
Pressing MODE cannot reproduce the expected physical-calculator workflow requested by the user.

Fix:
Implement modes incrementally behind tested workflows, but the parity roadmap must explicitly cover CMPLX, STAT, BASE-N, EQN, MATRIX, TABLE, VECTOR before claiming full physical parity.

Regression:
Each visible mode requires a workflow test; unavailable modes must be clearly staged rather than silently implied.

### F-06 — HIGH — Arrow navigation semantics are incomplete

Evidence:
`MathFieldAdapter.moveLeft()` delegates to `moveUp()`.

Root cause:
Directional navigation was modeled as template switching, not cursor/navigation behavior.

Impact:
A user pressing left in a fraction or structured expression can get an unintuitive vertical movement.

Fix:
Introduce an actual cursor/path model with horizontal and vertical semantics:
- left/right: cursor/structure traversal;
- up/down: numerator/denominator or superscript/base transitions where applicable;
- history only when expression-navigation context permits it.

Regression:
Matrix of cursor-position tests for plain text, fraction, nested fraction, power, root, and recalled history.

### F-07 — HIGH — History recall destroys Natural Display structure

Evidence:
`setCanonicalExpression(source)` restores history as one plain text node.

Impact:
A recalled structured fraction/power/root no longer has the same editable textbook structure.

Fix:
Store/restore expression AST (or serialize/deserialize the math model), not only canonical text.

Regression:
Enter nested fraction → evaluate → recall → expression remains structurally editable and visually vertical.

### F-08 — MEDIUM — Fraction result rendering is string-regex based

Evidence:
`resultMarkup()` recognizes only integer `n/d` and mixed `w n/d` strings.

Impact:
It works for simple rational outputs but is not a general Natural Display result renderer.

Fix:
Render from a typed result model (rational / radical / decimal / scientific / complex / matrix / vector) rather than parsing display strings.

Regression:
Negative rational, large rational, mixed fraction, exact radical, scientific notation, and future complex/matrix result tests.

### F-09 — MEDIUM — Current tests prove attributes, not what users see

Evidence:
Direction tests are regex checks such as checking `dir="ltr"`.

Root cause:
No browser-level geometry or screenshot tests.

Impact:
CI passed while the user still observed an incorrect visual experience.

Fix:
Add Playwright/Chromium visual and geometry tests:
- 1920×1080 desktop;
- 1366×768 desktop;
- 430×932 mobile;
- Arabic and English;
- default, SHIFT, ALPHA, MODE, fraction-edit states.

Required assertions:
- key bounding-box order;
- left/right REPLAY coordinates;
- expression first-token x-position;
- numerator above denominator;
- no legend overlap/clipping;
- numeric keypad row order;
- no layout overflow.

### F-10 — MEDIUM — Too many corrective CSS layers

Evidence:
The stylesheet has multiple later overrides for the same components and several breakpoint-specific redefinitions.

Impact:
Later patches can silently override earlier intent. This makes visual regressions likely and debugging slow.

Fix:
Refactor calculator CSS into ordered component sections with variables/tokens and one breakpoint block per component family. Remove superseded rules.

Regression:
Style audit + screenshot comparison.

## Approved direction model

The product needs four independent direction rules:

1. **Site shell:** RTL in Arabic, LTR in English.
2. **Calculator chassis/key coordinates:** always fixed physical LTR.
3. **Math input and result structures:** always mathematical LTR.
4. **Localized menu/help text:** follows its language without moving physical key coordinates.

Do not use a global `calculator-shell * { direction:ltr }` rule.

## Recovery plan

### Phase 1 — Stop patching direction
- Freeze current UI styling.
- Remove conflicting/global direction overrides.
- Add explicit direction boundaries.
- Fix LCD entry alignment from right-edge anchoring to left/start anchoring.
- Add browser visual tests before further layout changes.

### Phase 2 — Physical layout contract
- Build exact row/column key coordinate table from the approved reference.
- Remove standalone SETUP.
- Render keys from coordinate data.
- Validate arrow positions and numeric keypad geometry.

### Phase 3 — Structured math correctness
- Replace history text flattening with AST restore.
- Implement true left/right cursor traversal.
- Promote results from display strings to typed structures.

### Phase 4 — Mode parity
- MODE/SETUP behavior parity.
- Implement each advanced mode with tests before exposing it.

### Phase 5 — Visual comfort
Only after parity passes:
- typography;
- legend spacing;
- contrast;
- key sizing;
- desktop/mobile optical tuning.

## Release gates

Status remains BLOCKED until all of these pass:
1. Arabic site RTL + calculator fixed LTR simultaneously.
2. Expression entry starts visually from the left/start edge.
3. Physical key coordinates match the approved reference.
4. No standalone SETUP in parity profile.
5. Left/right/up/down navigation behaves by cursor context.
6. Fractions remain structured through entry, evaluation, and history recall.
7. Browser screenshot/geometry tests pass at desktop and mobile sizes.
8. Manual visual QA confirms the rendered GitHub Pages artifact, not merely source code.

## Council-of-1000 synthesis

The 1000-perspective review was organized across interaction design, calculator ergonomics, bidi/localization, CSS layout, structured math editing, accessibility, testing, release engineering, and adversarial regression review.

Consensus:
**Do not add another `dir=ltr` patch. The next fix must address visual alignment, explicit physical coordinates, structured cursor behavior, and browser-level verification.**
