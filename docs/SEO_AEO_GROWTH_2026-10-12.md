# SEO + AEO/GEO Growth Pass — 2026-10-12

## Objective
Increase qualified organic discovery for Math Workspace across conventional search engines and AI/search-answer experiences without keyword stuffing, deceptive markup, fake authority signals, or unsupported ranking claims.

## Baseline observed on 2026-10-12
A public web search for:
- `site:bimspecialist.github.io/Math "Math Workspace"`
- `"bimspecialist.github.io/Math" scientific calculator`

returned no surfaced results in the search source used during this audit.

Interpretation: discovery/indexation is currently a prerequisite bottleneck. Ranking optimization alone cannot help pages that are not being discovered or indexed.

## Primary keyword / intent clusters

### Tier 1 — broad, high-intent product queries
1. scientific calculator online
2. equation solver online
3. engineering calculator online
4. graphing calculator online
5. engineering unit converter

### Tier 2 — differentiated engineering queries
1. civil engineering formulas
2. hydraulics formulas
3. civil engineering calculator
4. fluid mechanics calculator
5. engineering math calculator

### Tier 3 — research / specialist queries
1. research calculator
2. uncertainty calculator
3. linear regression calculator
4. chi square calculator
5. high precision calculator
6. matrix calculator / numerical math tools

### Arabic priority clusters
1. حاسبة علمية
2. حاسبة علمية اون لاين
3. حل المعادلات
4. حل المعادلات اون لاين
5. حاسبة هندسية
6. قوانين الهندسة المدنية
7. قوانين الهيدروليك
8. ميكانيكا الموائع

These are intent clusters, not claimed search-volume rankings. Search-volume and position decisions should be validated from Google Search Console and/or an SEO data provider after indexing begins.

## Changes implemented

### 1. Dedicated indexable landing URLs
Created static, crawlable pages with unique title, meta description, canonical URL, H1, visible explanatory content, internal links, FAQ content and structured data.

English:
- /scientific-calculator-online/
- /equation-solver/
- /engineering-calculator/
- /graphing-calculator/
- /unit-converter/
- /civil-engineering-formulas/
- /hydraulics-formulas/
- /research-calculator/

Arabic:
- /ar/scientific-calculator/
- /ar/equation-solver/
- /ar/engineering-calculator/
- /ar/civil-engineering-formulas/
- /ar/hydraulics-formulas/

The primary bilingual pairs include hreflang alternates.

### 2. Homepage search metadata
Strengthened the homepage title and description around the actual product:
- Scientific Calculator
- Equation Solver
- Engineering Math Tools
- Graphing
- Unit Conversion
- Civil / Hydraulics references
- Research tools

No `meta keywords` tag was added.

### 3. Structured data
The homepage and landing pages use SoftwareApplication/WebApplication schema with a free Offer (`price: 0`) and visible page content aligned to the markup. Landing pages also include page/FAQ structured data where the FAQ text is actually visible.

### 4. Internal discovery links
The main application includes crawlable HTML links to the priority SEO landing pages, including Arabic entry points.

### 5. Sitemap expansion
`sitemap.xml` now lists the homepage plus all SEO landing pages with current `lastmod` values.

### 6. Search and AI crawler access
`robots.txt` keeps public crawling allowed and explicitly allows `OAI-SearchBot`, the OpenAI crawler used for ChatGPT search discovery.

### 7. AI-readable site map
Added `llms.txt` with:
- canonical site
- primary calculator pages
- engineering references
- Arabic pages
- capability summary
- accuracy/safety boundaries

This is supplemental machine-readable guidance; it is not treated as a ranking guarantee or substitute for normal crawlable HTML.

### 8. Faster Bing/participating-engine discovery
Added a best-effort IndexNow notification after successful GitHub Pages deployment on `main`. The script submits changed public HTML URLs rather than blindly resubmitting the entire site on every commit.

IndexNow accelerates discovery; it does not guarantee crawling, indexing, or ranking.

### 9. Regression gate
Added `tests/seo-discoverability.test.mjs` to guard:
- homepage metadata
- canonical URLs
- unique landing titles/descriptions
- H1 presence
- index/follow directives
- structured data
- free Offer
- hreflang pairs
- sitemap coverage
- OpenAI search crawler access
- llms.txt
- IndexNow wiring
- no meta-keyword stuffing

## Content principles
- Target one main search intent per URL.
- Use keywords naturally in title, H1, intro and explanatory content.
- Do not repeat raw keyword lists on the page.
- Make claims only where the product actually supports the capability.
- Keep engineering/code limitations visible.
- Prefer useful worked explanations and examples over filler text.

## Measurement plan after deployment

### Primary SEO metrics
- indexed landing pages
- impressions
- clicks
- average position
- CTR
- non-branded search clicks
- top queries per landing page

### AI/AEO metrics
Where tools provide the data:
- referrals from ChatGPT / Perplexity / Copilot-like sources
- cited/linked landing pages
- AI search impressions or citations
- query themes that produce AI referrals

### First optimization rule
Do not rewrite pages merely because traffic is low during initial discovery. First confirm:
1. URL discovered
2. URL crawled
3. URL indexed
4. query impressions exist

Then optimize title/snippet/content against actual query and CTR evidence.

## Next expansion after data
After Search Console collects query data, create new focused pages only when there is evidence of distinct intent, for example:
- matrix calculator
- polynomial solver
- uncertainty calculator
- linear regression calculator
- chi-square calculator
- advanced engineering mathematics formulas

## Important limitation
No ethical or technical SEO change can guarantee first position in Google, Bing, ChatGPT, or another AI system. Ranking depends on indexing, relevance, competition, authority, links/citations, user satisfaction, freshness, and each platform's ranking systems.
