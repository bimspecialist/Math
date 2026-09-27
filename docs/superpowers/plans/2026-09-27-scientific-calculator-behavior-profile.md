# Scientific Calculator Behavior Profile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ad-hoc calculator face with a behavior-complete ES Plus-style scientific profile: menu-driven MODE/SETUP, Natural Display fractions/powers/roots, alternate keys, REPLAY navigation, and release gates preventing visible nonfunctional controls.

**Architecture:** Split calculator logic from `index.html` into focused static ES modules while keeping GitHub Pages dependency-light. `KeyContract` and `BehaviorProfile` are sources of truth; a structured math-field adapter owns visual templates; the evaluator sits behind an engine adapter. Independent branding is retained.

**Tech Stack:** HTML5, CSS, browser-native JavaScript ES modules, Node.js built-in test runner, GitHub Pages/Actions.

**Spec:** `docs/superpowers/specs/2026-09-27-calculator-key-contract-design.md`

## Global Constraints

- Independent branding; no CASIO logos/product names/proprietary casing artwork.
- First behavior profile follows documented ES Plus-style interaction where applicable.
- Every visible primary/SHIFT/ALPHA legend maps to an implemented action or remains hidden.
- Fractions, powers, and roots are structural Natural Display templates.
- Mathematical content stays LTR inside Arabic RTL UI.
- No visible placeholder/no-op mode/key in release UI.
- Official docs verify observable behavior; no claim of proprietary firmware access.
- GitHub Pages remains deployment target.
- TDD for every behavior change.

## Review Focus

- Nested fraction deletion/navigation must not corrupt the expression tree (Task 3).
- SHIFT/ALPHA around menu cancel/error must have deterministic lifecycle (Task 4).
- REPLAY must distinguish structured-expression navigation from history recall (Task 5).
- Arabic RTL must not reverse math tokens; keyboard slash/arrows must match face keys (Task 6).
- Unsupported advanced modes must not appear selectable (Task 4).

---

### Task 1: KeyContract and completeness gate
**Files:** Create `src/calculator/key-contract.js`, `src/calculator/behavior-profile.js`, `tests/key-contract.test.mjs`; modify `index.html`.
**Interfaces:** Produce `KEY_CONTRACT`, `ES_PLUS_PROFILE`, `validateKeyContract(keys, profile) -> string[]`.

- [ ] Write failing tests asserting required primary/control keys, unique ids, known commands, and implemented actions for every rendered legend.
- [ ] Run `node --test tests/key-contract.test.mjs`; expect FAIL because modules do not exist.
- [ ] Implement JSDoc contracts, command ids, inventory, and validation only.
- [ ] Run contract tests; expect PASS.
- [ ] Commit: `test: enforce calculator key completeness contract`.

### Task 2: Tested math engine and exact rational path
**Files:** Create `src/calculator/math-engine.js`, `src/calculator/result-format.js`, `tests/math-engine.test.mjs`; modify `index.html`.
**Interfaces:** Produce `evaluateExpression(source, context) -> CalculationResult`, `formatExactDecimal(result, displayMode) -> string`.

- [ ] Write failing tests for precedence, DEG/RAD trig, factorial, nCr/nPr, roots, division/domain errors, Ans, and exact `1/2 + 1/3 = 5/6`.
- [ ] Run engine tests; expect FAIL before extraction/exact rational support.
- [ ] Extract tokenizer/parser/evaluator and add exact rational handling for rational-only arithmetic; transcendental functions remain floating point.
- [ ] Run tests; expect PASS.
- [ ] Commit: `refactor: isolate tested scientific math engine`.

### Task 3: Structured Natural Display
**Files:** Create `src/calculator/math-field-adapter.js`, `src/calculator/math-model.js`, `tests/math-field.test.mjs`; modify `index.html`.
**Interfaces:** Produce `insertFraction`, `insertMixedFraction`, `insertPower`, `insertSquareRoot`, `insertNthRoot`, directional movement, `deleteBackward`, `getCanonicalExpression`.

- [ ] Write failing tests: FRAC creates numerator/denominator, starts in numerator, down/up navigate slots, right exits, nested fractions serialize, empty-slot deletion is safe.
- [ ] Run math-field tests; expect FAIL.
- [ ] Implement structural model/DOM adapter with vertical fraction bars, expanding roots, superscript slots.
- [ ] Add test that keyboard `/` and FRAC produce equivalent structures.
- [ ] Run tests; expect PASS.
- [ ] Commit: `feat: add structured natural math editor`.

### Task 4: MODE/SETUP and modifier state machines
**Files:** Create `src/calculator/calculator-state.js`, `src/calculator/menu-controller.js`, `tests/calculator-state.test.mjs`; modify `index.html`.
**Interfaces:** Produce `dispatchCalculatorCommand(state, command) -> CalculatorState` and menu view model.

- [ ] Write failing tests: MODE opens menu; SHIFT+MODE opens SETUP; DEG/RAD changes via SETUP; SHIFT/ALPHA one-shot; cancel/error lifecycle; CALC prompts variables; SHIFT+CALC enters supported SOLVE.
- [ ] Assert an unimplemented mode cannot be emitted as selectable release UI.
- [ ] Run tests; expect FAIL.
- [ ] Implement DOM-independent state/menu transitions.
- [ ] Run tests; expect PASS.
- [ ] Commit: `feat: add calculator mode and setup state machines`.

### Task 5: Complete controller wiring
**Files:** Create `src/calculator/calculator-controller.js`, `tests/calculator-controller.test.mjs`; modify `index.html`.
**Interfaces:** Consume contract/state/math field/engine; produce `CalculatorController.dispatch(keyId)`, `dispatchKeyboard(event)`, history/memory/result view models.

- [ ] Write failing integration tests for DEL/AC, arithmetic, functions, constants, memory, Ans, S↔D, SHIFT+S↔D, equals, EXP and REPLAY.
- [ ] Add REPLAY context tests: edit structured slots when editing; recall history only in valid history context without destroying uncommitted input.
- [ ] Run tests; expect FAIL.
- [ ] Replace label-based dispatch and fake MODE/SETUP/ON mappings with contract-driven controller.
- [ ] Run `node --test tests/*.test.mjs`; expect PASS.
- [ ] Commit: `feat: wire complete scientific calculator controls`.

### Task 6: Behavior-driven calculator face
**Files:** Create `styles/calculator.css`, `src/calculator/render-calculator.js`, `tests/render-contract.test.mjs`; modify `index.html`.
**Interfaces:** Consume contract/controller/math-field DOM; produce semantic responsive calculator UI.

- [ ] Write failing render tests: every key id in contract, no unimplemented legend, math region LTR, REPLAY directions are focusable buttons, Arabic shell RTL.
- [ ] Add keyboard/RTL tests for slash and arrow commands preserving canonical math order.
- [ ] Run tests; expect FAIL.
- [ ] Implement semantic rendering/responsive styles with familiar scientific density and original identity.
- [ ] Run all tests; expect PASS.
- [ ] Commit: `feat: render behavior-driven scientific calculator face`.

### Task 7: Release gates and deployment
**Files:** Create `scripts/verify-calculator.mjs`, `docs/CALCULATOR_BEHAVIOR_MATRIX.md`; modify `.github/workflows/pages.yml`, `README.md`.
**Interfaces:** Consume all tests/contracts; produce one release verification command and behavior-status matrix.

- [ ] Add verification checks that fail on tests, missing required keys, visible unimplemented modes, or placeholder/no-op release commands.
- [ ] Run verification before workflow wiring; expect FAIL.
- [ ] Add `node scripts/verify-calculator.mjs` before Pages artifact upload.
- [ ] Document VERIFIED / PRODUCT_DECISION / BLOCKED for each visible behavior with evidence references.
- [ ] Run verification; expect PASS before deployment.
- [ ] Manually inspect desktop/mobile, Arabic/English, fraction slot focus, SHIFT/ALPHA, MODE/SETUP, keyboard focus, dark/high-contrast; record anything not testable.
- [ ] Commit: `ci: gate calculator deployment on behavior verification`.

## Final verification

- [ ] `node --test tests/*.test.mjs`
- [ ] `node scripts/verify-calculator.mjs`
- [ ] Inspect GitHub Pages workflow after push.
- [ ] Inspect deployed vertical fractions, MODE/SETUP, REPLAY, RTL/LTR, responsive layout.
- [ ] Never mark an advanced mode complete without dedicated workflow tests.
