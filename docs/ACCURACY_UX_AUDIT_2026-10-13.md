# Math Workspace | Accuracy and UI/UX Review
Date: 2026-10-13
Branch: automation/accuracy-smooth-ui-20261013

## Executive summary / ملخص
The scope is targeted correctness and task-flow work on the existing deployed calculator, not a redesign or removal of advanced functionality. The existing design system, mathematical engines, privacy choices and lazy-loaded workspaces remain intact.

الهدف هو تقوية الدقة والحاسبة وسهولة التنقل مع الحفاظ على الأدوات الهندسية، ودعم العربية والإنجليزية، واحترام الموافقة على خدمات التتبع.

## Findings and resolved issues
1. Student-t and chi-square p-values could round to zero when calculated as `1 - CDF` at small upper-tail probabilities. Added direct Student-t beta-survival calculations and a gamma upper-tail evaluator; regression uses the stable Student-t method. Tests include SciPy distribution reference anchors, including chi-square df=2 at statistic=100 (p≈1.9287498479639183e-22) and Student-t df=30 at t=20 (two-sided p≈6.7490836657712895e-19).
2. The global calculator key listener formerly responded while navigating other tools. It now runs only when the scientific calculator is active and excludes native interactive elements, modifier shortcuts, contenteditable and handled events.
3. The scientific entry field had dark text against a dark surface and Enter was the only submission mechanism. Added contrasting field text, an explicit Calculate button, and post-render focus restoration. Change-on-blur no longer destroys a pending button click.
4. Research Mode had seven simultaneous form panels. Native accessible details accordions now progressively disclose one workflow at a time, with all input IDs and calculations preserved. Keep the first workflow open.
5. Ramp displayed two calculation forms at once. Basic geometry remains upfront; deriving from a selected slope is available under a labelled optional disclosure.
6. Blank unit entries were coerced to numerical zero by JavaScript `Number("")`; they are now validation errors. The precision selector remains available as an optional setting.
7. Civil engineering/hydraulics landing calls-to-action previously opened the default Accounting library. English and Arabic links now use the supported `#knowledge/civil` and `#knowledge/hydraulics` routes.
8. A small quick-access navigation offers scientific calculation, equation solving, unit conversion and Math Lab without requiring the entire sidebar.

## Assurance boundaries
- Small p-values now remain positive whenever floating-point representation permits. Literal machine-underflow of probabilities below the double-precision representable range cannot be avoided using ordinary JavaScript `number` alone.
- A chi-square goodness-of-fit test is distinct from an independence test; sufficiently large expected frequencies and the model's sampling assumptions remain the analyst's responsibility.
- Perfect least-squares fits and degenerate variance may require special interpretation; displaying a result does not establish causal inference.
- Ramp calculations remain geometry-only, not a building-code accessibility verdict.
- No new external analytics, cookies, AI APIs or advertising were added.

## Automated checks
`node scripts/verify-calculator.mjs` executes all repository `tests/*.test.mjs`. New checks cover numerical survival tails against independent references, exact route targets, bilingual labels, keyboard-scope eligibility, optional controls and blank-input rejection. GitHub CI is the merge gate.

## Manual visual acceptance still required
- 360/390 px phone, 768px tablet, 1366px laptop and desktop.
- Both Arabic RTL and English LTR, including long labels and numeric expressions.
- Focus via Tab/Shift+Tab, Enter on direct input, clicking Calculate after editing, Escape in sidebar, Ctrl+K for tool search.
- Open/close research accordions; values preserved; slope details; offline/narrow-screen behavior.
- Browser-reported CWV and accessibility checks (LCP/INP/CLS, contrast, 200% zoom). Do not claim these passed based on CI alone.

## Release criteria
Do not merge until full CI passes. After merge, separately verify GitHub Pages deployment success and use real audience data rather than fabricated performance or engagement metrics.
