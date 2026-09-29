# Monetization and Analytics Setup

Status: **Prepared but not live** until real Google account identifiers are supplied.

## AdSense

The site now supports:
- responsive manual ad placements: side-left, side-right, bottom-main, bottom-secondary, bottom-left, bottom-right;
- optional Auto ads;
- no AdSense request is made while `SITE_CONFIG.adsense.client` is empty.

To activate:
1. Get the exact AdSense client ID from your account, format `ca-pub-################`.
2. Decide between Auto ads and/or manual ad units.
3. For manual units, create units in AdSense and copy their numeric slot IDs into `src/config/site-config.js`.
4. Put the real publisher declaration in an `ads.txt` file at the **root domain**.

Current Google Pages project URL is `https://bimspecialist.github.io/Math/`. An `ads.txt` file inside only the `/Math/` project path is not the root-domain location Google documents. Before live monetization, use either:
- a custom domain whose root you control; or
- the account root GitHub Pages site if you intentionally manage `bimspecialist.github.io/ads.txt`.

Do not publish a fake publisher ID.

## Visitor analytics

The site now supports GA4 and virtual page views for tool navigation.
No analytics request is made while `SITE_CONFIG.analytics.measurementId` is empty.

To activate:
1. Create/select a GA4 web data stream.
2. Copy the Measurement ID, format `G-XXXXXXXXXX`.
3. Put the ID into `src/config/site-config.js`.
4. Visitor/user counts and traffic reports are then viewed in Google Analytics.

## Consent and privacy

External advertising and analytics loaders are behind the site's consent choice when IDs are configured.
Before enabling ads publicly, publish/review a privacy policy for the actual configuration and applicable jurisdictions. Google requires publishers to disclose ad-related data collection/cookies.

## Official references checked 2026-09-29
- Google AdSense: About / Get AdSense code
  https://support.google.com/adsense/answer/9274634
  https://support.google.com/adsense/answer/9274019
- Google AdSense: Auto ads
  https://support.google.com/adsense/answer/9261307
- Google AdSense: ads.txt
  https://support.google.com/adsense/answer/9785052
- Google Publisher privacy disclosures
  https://support.google.com/publisherpolicies/answer/10437794
- GA4 Measurement ID
  https://support.google.com/analytics/answer/12270356
