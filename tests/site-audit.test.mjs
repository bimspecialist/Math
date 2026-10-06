import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { UI_STRINGS } from "../src/i18n/ui-strings.js";

const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
const render=readFileSync(new URL("../src/calculator/render-calculator.js",import.meta.url),"utf8");

test("all localization hooks resolve in both English and Arabic",()=>{
  const keys=[...index.matchAll(/data-i18n(?:-placeholder|-aria-label|-alt)?="([^"]+)"/g)].map(m=>m[1]);
  assert.ok(keys.length>40);
  for(const key of keys){
    assert.ok(UI_STRINGS.en[key],"missing English key: "+key);
    assert.ok(UI_STRINGS.ar[key],"missing Arabic key: "+key);
  }
});

test("all HTML ids are unique",()=>{
  const ids=[...index.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length);
});

test("every tool navigation target has a corresponding page section",()=>{
  const targets=[...new Set([...index.matchAll(/data-tool-target="([^"]+)"/g)].map(m=>m[1]))];
  for(const target of targets)assert.match(index,new RegExp('id="'+target+'-section"'),target);
});

test("local stylesheet and module entrypoint references exist",()=>{
  for(const match of index.matchAll(/(?:href|src)="\.\/([^"?]+)(?:\?[^"]*)?"/g)){
    assert.ok(existsSync(new URL("../"+match[1],import.meta.url)),match[1]);
  }
});

test("language switch updates the document title as well as visible content",()=>{
  assert.match(app,/document\.title=translate\(locale,"siteTitle"\)/);
  assert.equal(UI_STRINGS.en.siteTitle,"Math — Scientific Calculator");
  assert.equal(UI_STRINGS.ar.siteTitle,"Math — الحاسبة العلمية");
});

test("calculator rendering defaults to English while keeping its physical LTR layout",()=>{
  assert.match(render,/renderCalculatorMarkup\(view,locale="en"\)/);
  assert.match(render,/mountCalculator\(root,controller,locale="en"\)/);
});


test("site exposes indexable metadata and accessible skip navigation",()=>{
  assert.match(index,/name="description"/);
  assert.match(index,/rel="canonical" href="https:\/\/bimspecialist\.github\.io\/Math\/"/);
  assert.match(index,/class="skip-link" href="#main-content"/);
  assert.match(index,/id="main-content"/);
  assert.equal(UI_STRINGS.en.skipToContent,"Skip to main content");
  assert.equal(UI_STRINGS.ar.skipToContent,"تخطي إلى المحتوى الرئيسي");
});

test("tool selection state is exposed to assistive technology",()=>{
  assert.match(app,/setAttribute\("aria-pressed",String\(selected\)\)/);
});


test("tool navigation supports stable hash deep links and mobile escape recovery",()=>{
  assert.match(app,/history\.replaceState\(null,"","#"\+target\)/);
  assert.match(app,/window\.addEventListener\("hashchange"/);
  assert.match(app,/event\.key==="Escape"/);
  assert.match(app,/closeToolSidebar\(\{restoreFocus:true\}\)/);
});

test("graph rendering is lazy until graphing is activated",()=>{
  assert.match(app,/if\(target==="graphing"&&!graphInitialized\)drawGraph\(\)/);
  assert.match(app,/let graphInitialized=false/);
  assert.doesNotMatch(app,/graphExpression\?\.addEventListener[^\n]+\n?drawGraph\(\);/);
});

test("web asset cache-busting versions are synchronized",()=>{
  const versions=[...index.matchAll(/(?:calculator\.css|src\/app\.js)\?v=([0-9-]+)/g)].map(m=>m[1]);
  assert.equal(versions.length,2);
  assert.equal(new Set(versions).size,1);
});


test("vertical advertising rails stay in normal flow to avoid overlapping lower ad slots",()=>{
  const css=readFileSync(new URL("../styles/calculator.css",import.meta.url),"utf8");
  assert.match(css,/\.ad-left,\.ad-right,\.ad-outer-left,\.ad-outer-right\{height:720px;position:static;top:auto;align-self:start\}/);
});


test("site publishes structured application metadata and root privacy navigation",()=>{
  assert.match(index,/type="application\/ld\+json"/);
  assert.match(index,/"@type":"WebApplication"/);
  assert.match(index,/href="https:\/\/bimspecialist\.github\.io\/privacy\.html"[^>]*data-i18n="privacyPolicy"/);
});

test("formula library exposes a localized empty-result state",()=>{
  assert.ok(UI_STRINGS.en.formulaNoResults);
  assert.ok(UI_STRINGS.ar.formulaNoResults);
  assert.match(app,/class="empty-state" role="status"/);
});

test("active tool updates the visible and document headings",()=>{
  assert.match(app,/function updateToolHeading\(target\)/);
  assert.match(app,/heading\.textContent=title/);
  assert.match(app,/document\.title=target==="calculator"/);
});


test("image preview lifecycle revokes replaced object URLs",()=>{
  assert.match(app,/let scanPreviewUrl=null/);
  assert.match(app,/URL\.revokeObjectURL\(scanPreviewUrl\)/);
  assert.match(app,/String\(file\.type\|\|""\)\.startsWith\("image\/"\)/);
});


test("tool sidebar supports localized search and keyboard shortcut",()=>{
  assert.match(index,/id="tool-search"/);
  assert.match(index,/id="tool-search-status"/);
  assert.match(app,/function filterToolNavigation\(\)/);
  assert.match(app,/toolSearch\?\.addEventListener\("input",filterToolNavigation\)/);
  assert.match(app,/event\.key\.toLowerCase\(\)==="k"/);
  assert.match(app,/toolSearch\?\.focus\(\)/);
});

test("tool search hides unmatched items and empty groups without removing navigation",()=>{
  assert.match(app,/item\.hidden=!matches/);
  assert.match(app,/group\.hidden=groupVisible===0/);
  assert.match(app,/filterToolNavigation\(\);\s*renderFormulaCategories/);
});


test("heavy Math Lab engine is lazy-loaded instead of part of startup imports",()=>{
  assert.doesNotMatch(app,/^import .*math-lab-engine\.js/m);
  assert.match(app,/import\("\.\/mathlab\/math-lab-engine\.js"\)/);
  assert.match(app,/async function ensureMathLabEngine\(\)/);
});

test("dynamic expert calculator headings are localized in both languages",()=>{
  for(const key of ["expertConstants","expertProbability","expertCalculus","expertComplex","mathLabLoadingEngine","mathTools"]){
    assert.ok(UI_STRINGS.en[key],"missing English key: "+key);
    assert.ok(UI_STRINGS.ar[key],"missing Arabic key: "+key);
  }
  assert.match(render,/translate\(locale,"expertConstants"\)/);
  assert.match(render,/translate\(locale,"expertProbability"\)/);
  assert.match(render,/translate\(locale,"expertCalculus"\)/);
  assert.match(render,/translate\(locale,"expertComplex"\)/);
});

test("accessibility quality layer protects focus and reduced motion",()=>{
  const css=readFileSync(new URL("../styles/ui-quality.css",import.meta.url),"utf8");
  assert.match(css,/:focus-visible/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(index,/data-i18n-aria-label="mathTools"/);
});
