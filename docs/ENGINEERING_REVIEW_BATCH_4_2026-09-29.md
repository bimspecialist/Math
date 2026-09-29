# Engineering Review — Batch 4 — 2026-09-29

Status: PASS WITH REQUIRED VALIDATION

## Scope
Advertising layout cleanup and browser resource hygiene after the ad-overlap report.

## Implemented

### High — empty manual ad placeholders consumed large layout areas
Evidence: the current AdSense configuration has no manual slot IDs, so the large dashed placeholders were visual scaffolding rather than live ad units.
Fix:
- Manual ad containers are hidden when no valid slot ID is configured.
- Containers are restored automatically if a valid manual slot is configured later.
- Google AdSense script and Auto ads support remain unchanged.
- Hidden ad containers use `display:none!important` so they do not reserve grid space.

### Medium — image preview object URLs were not released
Evidence: each selected image created a new browser object URL.
Fix:
- Replaced preview URLs are revoked before creating a new one.
- The remaining preview URL is revoked on page hide.
- Non-image files are ignored by the preview handler.

## Regression coverage
- Manual ad placeholder collapse / restore behavior is guarded.
- Image object-URL lifecycle is guarded.
- Existing ad-rail overlap regression remains in the site audit.

## Protected / unchanged
- AdSense client `ca-pub-5386218928692257`
- Google CMP configuration
- root-domain `ads.txt`
- calculator behavior and tool workflows
- `/Math/` route

## Required validation
- Latest GitHub Actions verify/deploy must pass.
- User should visually inspect desktop scroll behavior and mobile layout after deployment.
- AdSense review remains external.
