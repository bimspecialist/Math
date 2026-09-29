# Engineering Review — Batch 1 — 2026-09-29

Status: PASS WITH REQUIRED VALIDATION

## Scope
First implementation batch after Search Console and AdSense submission. Working calculator behavior and the active AdSense publisher identity were treated as protected.

## Findings addressed

### High — duplicate AdSense loader risk
Evidence: the ownership script is already present in `index.html`, while `initAdSense()` previously only checked for a dynamically-added `data-math-adsense` script.
Root cause: loader detection used an implementation marker rather than the actual AdSense script URL.
Fix: reuse any existing `pagead2.googlesyndication.com/pagead/js/adsbygoogle.js` script.
Regression test: `tests/monetization-construction.test.mjs`.

### Medium — missing canonical and search metadata
Evidence: the public page had a title but no description, canonical URL, robots metadata, or social summary metadata.
Fix: added description, canonical, robots, Open Graph, and Twitter summary metadata without changing the application route.

### Medium — keyboard navigation friction
Evidence: keyboard users had no direct skip path to the primary workspace.
Fix: added a localized skip link, focus target, and visible focus styling.

### Medium — active tool state was visual-only
Evidence: the selected sidebar tool was represented by CSS class only.
Fix: synchronize `aria-pressed` with the active tool state.

## Protected / unchanged
- AdSense client ID: `ca-pub-5386218928692257`
- root-domain `ads.txt` strategy
- calculator mathematical behavior
- bilingual English/Arabic architecture
- current public `/Math/` route

## Required validation
- GitHub Actions verification and deploy must pass on the final head commit.
- Manual browser QA is still required for skip-link focus behavior, responsive layout, and real screen-reader announcement.
- AdSense review outcome remains external and must not be inferred from deployment success.
