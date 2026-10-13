# Math Workspace — Interactive Dashboard implementation and QA
Date: 2026-10-13
Repository: `bimspecialist/Math`
Branch: `automation/interactive-dashboard-redesign-20261013`
Starting main: `ce3210d4d2eddae952959acf0e08bd2c34bdd200`

## Intent and design source
Implement the approved simple, premium math/engineering dashboard UI **as functioning HTML/CSS/JS**, not as a pasted image. Prioritize a clear primary action (interactive Ramp Calculator), short paths to common tasks, an uncluttered grid, bilingual Arabic/English, mobile screens, and existing real calculation engines. Follow the Product UI Designer design-system, localization and quality-gate workflows.

## Implementation inventory

- `index.html`: new responsive Home section, site brand/top navigation/search, 12 real tool entry cards, live ramp fields/diagram/metrics, scientific expression preview, advanced equation preview, and inline unit converter.
- `styles/dashboard.css`: isolated semantic blue/white cards and tokens; responsive 4/2/1-card grids; compact tablet and phone ramp arrangements; light/dark theme token overrides; focus and reduced-motion states.
- `src/dashboard/ramp-diagram.js`: dependency-free SVG visualization using calculated rise, run, length, grade, slope ratio, and angle; unit labels and accessible bilingual text. Diagram reflows when the data changes. Extreme proportions are clamped visually and labelled as **illustrative**, never a substitute for numeric or code verification.
- `src/dashboard/dashboard.js`: mount/query controls; on-input calculation/validation; correct unit conversion on switch; reset; scientific evaluation; deferred Advanced Solver load after explicit action; inline length conversion; search filtering with clear empty state and Enter navigation.
- `src/app.js`: default to `home` without breaking the original hash routes; preserve calculator keyboard isolation; open full Ramp Calculator with preview values; show a live diagram on the original full ramp page; refresh Arabic/English text; route menu to the complete tools list.
- `src/i18n/ui-strings.js`: complete translation keys for both languages and accessible control labels.

## Behavior contracts
1. **Ramp:** type 0.75 m rise and 3 m run → length about 3.092329 m, grade 25%, angle about 14.036°. Display values are calculated using `calculateRamp`, with `m` or `ft` labels only for units that were explicitly selected. Blank/negative entries show errors and clear stale diagram and metrics; the full calculator remains available for any two of rise/run/length.
2. **Units:** selecting Imperial converts the existing numeric inputs from m to ft; selecting Metric converts them back. Reset reverts to 0.75 m and 3 m. Converters reverse input/output when swapping direction.
3. **Scientific:** the sample `sin(30)+2^3` is evaluated in degree mode by the real expression engine (8.5). Changes are submitted via button or Enter and failures show localized error text.
4. **Advanced Solver:** pressing Solve loads existing solver only on demand; equations are not sent to an AI/cloud API.
5. **Navigation:** cards and header buttons route to real existing `data-tool-target` sections; full knowledge libraries use supported library IDs; `Ctrl+K` focuses dashboard search when Home is active, and sidebar search on other screens.
6. **Privacy:** `CONSENT_KEY`, provider loading, SEO landing pages, lazy Math Lab modules and published calculator UI are unchanged.

## Accessibility and internationalization targets
- Native button/input/select controls, persistent visible labels or accessible `<label>` names, role/status and native `<output>` feedback.
- Numeric expressions and SVG plotting remain LTR even in Arabic RTL; Arabic text is resolved from `UI_STRINGS.ar`, not hardcoded into the English source HTML.
- Keyboard access to submit and reset actions; reduced-motion and high-contrast CSS; no drag requirement; dynamic diagram has an SVG title and screen-reader label.
- Target WCAG 2.2 AA, but this remains an **objective**, not a verified certification.

## Automated verification
- `node scripts/verify-calculator.mjs` executes the complete project suite.
- New tests verify real mathematical ramp geometry, diagram responsiveness and safe unit handling; twelve card routes; all translation hooks; lazy advanced solver; live preview controls; consent and math-engine preservation; CSS breakpoints and JavaScript syntax checks.
- Pre-existing SEO, math engines, privacy, localization, unit converter and performance contracts still run as part of CI.

## Known visual validation gaps
This environment provides source-code and GitHub Actions access, but **not a direct interactive Chrome/Firefox/Safari screen session**. Consequently, passing CI is not proof that spacing or typography exactly reproduces the mockup. Review at widths 360, 390, 768, 1024 and 1440+ px, including Arabic RTL, dark mode, 200% zoom, focus order, light/dark contrast, small and extreme ramp dimensions, and touch keyboard. Validate actual lazy module loading and sticky UI with network throttling; record real Core Web Vitals only from measured data.

## Release gate
Do not merge until the final PR head passes CI. After merge independently verify both `verify` and GitHub Pages `deploy` on the merge SHA.
