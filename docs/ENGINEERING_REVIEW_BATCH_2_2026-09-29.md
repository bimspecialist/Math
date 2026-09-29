# Engineering Review — Batch 2 — 2026-09-29

Status: PASS WITH REQUIRED VALIDATION

## Goals
Improve navigation continuity, initial-load efficiency, accessibility resilience, and consent correctness without changing calculator mathematics or AdSense identity.

## Implemented

### High — local consent text did not match actual AdSense loading
Evidence: the AdSense ownership script is intentionally loaded in `<head>`, while the local banner claimed advertising stayed off until local acceptance.
Root cause: the first-party banner was created before Google CMP was configured.
Fix:
- AdSense initialization is independent of the local analytics preference.
- The local banner now gates only optional GA4 analytics.
- Copy is updated in English and Arabic.
- Google CMP remains the consent surface for Google advertising.

### Medium — no deep links to individual tools
Fix:
- Valid tool selections are reflected in URL hashes such as `#calculator`, `#graphing`, and `#converter`.
- Direct hash visits restore the corresponding tool.
- Unknown hashes fall back safely to Calculator.

### Medium — unnecessary graph work during initial load
Fix:
- Graph plotting is now lazy and runs when Graphing is activated for the first time.
- Manual redraw behavior remains unchanged.

### Medium — mobile navigation recovery
Fix:
- Escape closes the mobile tool drawer and restores focus to the menu toggle.
- Opening the drawer moves keyboard focus into the tool list.
- Hidden tool sections expose `aria-hidden` state.

### Medium — focus/high-contrast coverage
Fix:
- Native `select` controls and links receive the same visible focus treatment as buttons and inputs.
- Added forced-colors handling for active navigation and key controls.
- Sidebar overscroll is contained on compact screens.

### Delivery integrity
- CSS and JS cache-busting versions were bumped together.
- Regression tests were added for hash navigation, lazy graph rendering, asset-version synchronization, and consent separation.

## Protected / unchanged
- AdSense client `ca-pub-5386218928692257`
- root-domain ads.txt strategy
- Google CMP configuration in AdSense
- public route `/Math/`
- calculator behavior and key map
- bilingual English/Arabic architecture

## Validation still required
- GitHub Actions verify/deploy on the final head commit.
- Real-browser mobile drawer behavior, hash restoration, keyboard focus, forced-colors, and responsive graph rendering.
- Google AdSense review remains external and must not be inferred from deployment.
