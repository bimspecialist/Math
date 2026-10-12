# SEO & AI Search Audit — 2026-10-12 (follow-up)

Previous SEO implementation was merged through PR #51 (main commit 297946cc). This round adds nine distinct long-tail pages supported by real calculators or engineering formula libraries, rather than doorway pages. Each guide contains an independently useful explanation, equation, worked example, pitfalls, real tool CTA, internal links, self-canonical and BreadcrumbList JSON-LD.

## QA
CI executes node scripts/verify-calculator.mjs, including tests/seo-discoverability.test.mjs. New regression assertions verify sitemap and canonical coverage, unique titles, index/follow, valid JSON-LD and internal homepage navigation. No new analytics, advertising, cookies or consent modifications. Existing lazy-loading is unchanged.

## Key technical caveat
Because the site is hosted at https://bimspecialist.github.io/Math/, the crawler policy is controlled by https://bimspecialist.github.io/robots.txt at the origin root. A /Math/robots.txt file does not govern that origin. Verify root robots settings separately before claiming OAI-SearchBot or other crawler allowance.

## Official search guidance applied
Google rewards useful, accessible content and real links; sitemap lastmod should be accurate rather than artificially refreshed. FAQPage markup is not an entitlement to rich results. OpenAI OAI-SearchBot is for ChatGPT search discovery, distinct from GPTBot model-training policy. Bing IndexNow notifies engines about changed URLs but cannot guarantee indexing or rankings. llms.txt is optional, unproven as a ranking factor, and secondary to indexable HTML.

## Deferred and verification limits
Derivative/integral, dimensional analysis and pressure/force/torque landing pages remain deferred until adequate distinct content is validated. No synthetic organic-traffic figures or invented CWV metrics. Measure indexing, CTR, top queries, organic entry sessions and Arabic vs English after launch with webmaster data and existing consent-aware instrumentation. Confirm GitHub Pages success after CI and merge.