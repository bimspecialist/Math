# Full Site Audit — 2026-09-29

Status: PASS WITH REQUIRED VISUAL VALIDATION

## Scope
- Default locale and language switching
- English / Arabic terminology consistency
- RTL / LTR boundaries
- Calculator physical LTR behavior
- Navigation and section wiring
- Formula Library localization
- Advanced Solver localization
- Math Lab dynamic messages
- Graphing / Programmer / Date / Converter terminology
- Accessibility localization hooks
- Local asset references
- Deployment verification

## Language decision
- Primary / default locale: English (`lang="en" dir="ltr"`)
- Alternate locale: Arabic (`lang="ar" dir="rtl"`)
- Calculator chassis and mathematical input remain physical LTR in both locales.

## Terminology baseline
The navigation terminology was reviewed against current Microsoft Calculator support terminology:
- Scientific / علمي
- Graphing / الرسم البياني
- Programmer / مبرمج
- Date calculation / حساب التاريخ
- Currency / العملة
- Volume / الحجم
- Length / الطول
- Temperature / درجة الحرارة

Microsoft Support references:
- https://support.microsoft.com/en-us/windows/apps/use-the-calculator-in-windows
- https://support.microsoft.com/ar-sa/windows/apps/use-the-calculator-in-windows
- https://support.microsoft.com/en-us/windows/apps/calculate-days-between-dates-or-calculate-a-future-or-past-date
- https://support.microsoft.com/ar-sa/windows/apps/calculate-days-between-dates-or-calculate-a-future-or-past-date

## Implemented localization architecture
- Central dictionary: `src/i18n/ui-strings.js`
- Text hooks: `data-i18n`
- Placeholder hooks: `data-i18n-placeholder`
- Accessibility hooks: `data-i18n-aria-label`
- Image-alt hooks: `data-i18n-alt`
- Dynamic locale refresh for Formula Library, Converter, Date Calculator, Advanced Solver results, document title, and calculator locale.

## Formula Library
Every formula now has:
- English title
- Arabic title
- English description
- Arabic description
- category
- formula text
- searchable tags

Search indexes both languages.

## Automated site audit gate
`tests/site-audit.test.mjs` checks:
1. Every localization key used in markup exists in English and Arabic.
2. HTML IDs are unique.
3. Every navigation tool target has a matching page section.
4. Local stylesheet and module entrypoint references exist.
5. Document title is localized.
6. Calculator render defaults to English while preserving LTR physical layout.

Additional localization regression tests verify:
- English is the default locale.
- Arabic remains available from the language toggle.
- Workspace direction is LTR in English and RTL in Arabic.
- Formula terminology is bilingual.
- Dynamic converter and Advanced Solver content refresh after locale changes.
- English-first source markup contains no hardcoded Arabic UI text.

## Verification evidence
Latest verified workflow:
- Run: 36538478255
- Head SHA: d036204f285a6b7c7ccd1e580e1e63c986a84e12
- verify: SUCCESS
- deploy: SUCCESS
- Calculator verification: PASS

## Known limitations / remaining development
These are not hidden and should not be described as complete:
- Currency conversion is not enabled yet because it needs a current online exchange-rate source.
- Camera / image Math Recognition is not connected yet.
- Advanced Solver is not yet a full CAS comparable to Symbolab across all mathematics.
- Math Lab is an early numerical workspace, not MATLAB-compatible.
- Scientific MODE currently exposes only implemented modes; full COMP/CMPLX/STAT/BASE-N/EQN/MATRIX/TABLE/VECTOR parity remains roadmap work.
- Pixel-level visual validation of the live GitHub Pages site could not be executed by the current browser tool, so screenshots / real-browser visual regression are still required.

## Next engineering priorities
1. Browser-level visual regression at desktop, tablet, and mobile widths.
2. Broader Advanced Solver CAS layer.
3. Math Lab matrix algebra and plotting integration.
4. Currency provider with safe server-side/API handling.
5. OCR / Math Recognition backend.
6. Continue terminology review as new tools are added.
