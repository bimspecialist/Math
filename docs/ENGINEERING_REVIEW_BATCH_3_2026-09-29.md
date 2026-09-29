# Engineering Review — Batch 3 — 2026-09-29

Status: PASS WITH REQUIRED VALIDATION

## Scope
Content quality, navigation clarity, privacy disclosure, SEO structure, formula empty states, and advertising layout stability.

## Implemented

### High — advertising rail overlap on scroll
Evidence: screenshot showed vertical ad rails visually intersecting the lower square ad areas while scrolling.
Root cause: vertical ad rails used `position: sticky` while lower ad slots occupied the same visual column later in the page.
Fix: vertical rails now remain in normal document flow with `position: static` and `align-self:start`.
Regression test: site audit now guards against reintroducing sticky vertical rails.

### High — privacy policy link broke the local-file integrity gate
Evidence: GitHub Actions failed the local reference audit because `./privacy.html` did not exist inside the Math repository.
Root cause: the privacy policy intentionally belongs to the root GitHub Pages site, but the link was expressed as a local relative path.
Fix: Math now links to `https://bimspecialist.github.io/privacy.html`.
Verification: regression test covers the absolute root privacy URL.

### Medium — thin public content / weak search context
Fix:
- Added WebApplication structured metadata.
- Added explanatory content for scope, privacy/external services, and bilingual behavior.
- Added footer navigation to the privacy policy and publisher home.
- Added bilingual localized content for all new public text.

### Medium — formula search had no explicit empty state
Fix: an accessible localized `role="status"` empty-result message now appears when filters return zero formulas.

### Medium — page heading did not reflect the selected tool
Fix: selected tools now update the visible page heading and browser document title while preserving localized titles.

### Delivery / cache
- CSS and JS asset versions remain synchronized.
- Root-domain sitemap includes the published privacy policy.
- Root landing page links to the privacy policy.

## Protected / unchanged
- AdSense publisher ID `ca-pub-5386218928692257`
- root-domain `ads.txt`
- Google CMP configuration
- calculator mathematical behavior
- public `/Math/` route
- English/Arabic localization architecture

## Required validation
- Final GitHub Actions verify/deploy must pass on the latest head.
- Manual browser QA remains required for responsive ad placement after the rail-flow change.
- Google AdSense review remains external.
