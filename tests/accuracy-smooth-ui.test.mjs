import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { shouldHandleCalculatorShortcut } from "../src/calculator/keyboard-scope.js";
import { CalculatorController } from "../src/calculator/calculator-controller.js";
import { renderCalculatorMarkup } from "../src/calculator/render-calculator.js";
import { UI_STRINGS } from "../src/i18n/ui-strings.js";
import { convertUnit } from "../src/converters/unit-converter.js";

const file=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const html=file("index.html"),app=file("src/app.js"),css=file("styles/ui-quality.css");
const renderSource=file("src/calculator/render-calculator.js");

test("calculator global keyboard shortcuts are scoped to a noninteractive active calculator",()=>{
  assert.equal(shouldHandleCalculatorShortcut({calculatorActive:true}),true);
  for(const options of [
    {calculatorActive:false},
    {calculatorActive:true,interactiveTarget:true},
    {calculatorActive:true,ctrlKey:true},
    {calculatorActive:true,metaKey:true},
    {calculatorActive:true,altKey:true},
    {calculatorActive:true,defaultPrevented:true}
  ])assert.equal(shouldHandleCalculatorShortcut(options),false,JSON.stringify(options));
  assert.match(app,/document\.querySelector\("#calculator-section"\)\?\.classList\.contains\("active"\)/);
  assert.match(app,/event\.target\.closest\("a,button,input,textarea,select,summary/);
});

test("direct entry has labelled Calculate button, localized copy and stable focus recovery",()=>{
  const en=renderCalculatorMarkup(new CalculatorController().view(),"en");
  const ar=renderCalculatorMarkup(new CalculatorController().view(),"ar");
  assert.match(en,/data-calculator-direct-run/);
  assert.match(en,/<label class="direct-entry-label" for="calculator-direct-input">Type an expression<\/label>/);
  assert.match(ar,/اكتب التعبير الرياضي/);
  assert.match(ar,/data-calculator-direct-run[^>]*>احسب<\/button>/);
  assert.match(renderSource,/replacement\.focus\(\{preventScroll:true\}\)/);
  assert.match(renderSource,/direct\?\.addEventListener\("change",\(\)=>controller\.setExpression\(direct\.value\)\)/);
  assert.match(css,/\.calculator-direct-entry\{display:grid;[\s\S]*color:#f5f9ff/);
});

test("quick links stay concise and all localization keys exist",()=>{
  const nav=html.match(/<nav class="quick-actions"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(nav);
  const targets=[...nav.matchAll(/data-tool-target="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(targets,["calculator","advanced","converter","mathlab"]);
  assert.equal(UI_STRINGS.en.quickActionsLabel,"Frequently used tools");
  assert.equal(UI_STRINGS.ar.quickActionsLabel,"الأدوات الأكثر استخدامًا");
  assert.ok(UI_STRINGS.en.quickExpressionLabel&&UI_STRINGS.ar.quickExpressionLabel);
});

test("research workflows use seven mutually exclusive native disclosures",()=>{
  const fragment=html.slice(html.indexOf('<section id="research-section"'),html.indexOf('<section id="advanced-section"'));
  const disclosures=[...fragment.matchAll(/<details class="research-disclosure" name="research-tools" data-research-tool="[^"]+"( open)?>/g)];
  assert.equal(disclosures.length,7);
  assert.equal(disclosures.filter(m=>m[1]).length,1);
  assert.equal((fragment.match(/<summary class="research-disclosure-summary">/g)||[]).length,7);
  for(const id of ["research-exact-run","research-quantity-run","research-uncertainty-run","research-stats-run","research-regression-run","research-chi-run","research-constants-list"]){
    assert.ok(fragment.includes('id="'+id+'"'),id);
  }
});

test("ramp slope workflow and converter precision remain available but folded initially",()=>{
  assert.match(html,/<details class="ramp-advanced-disclosure">/);
  assert.match(html,/<summary id="ramp-design-title" data-i18n="rampDesignTitle">/);
  assert.match(html,/<details class="converter-advanced-options"><summary data-i18n="precision">/);
  assert.match(html,/id="converter-precision"/);
});

test("invalid empty conversions are rejected rather than treated as zero",()=>{
  assert.throws(()=>convertUnit("length","","m","km"),/INVALID_VALUE/);
  assert.throws(()=>convertUnit("temperature","  ","C","F"),/INVALID_VALUE/);
  assert.equal(convertUnit("length","0","km","m"),0);
});

test("specialized engineering landing CTAs select the actual library",()=>{
  for(const [path,route] of [
    ["civil-engineering-formulas/index.html","../#knowledge/civil"],
    ["hydraulics-formulas/index.html","../#knowledge/hydraulics"],
    ["ar/civil-engineering-formulas/index.html","../../#knowledge/civil"],
    ["ar/hydraulics-formulas/index.html","../../#knowledge/hydraulics"]
  ])assert.ok(file(path).includes('href="'+route+'"'),path);
});

test("consent and startup lazy-loading contracts remain present",()=>{
  assert.match(app,/const CONSENT_KEY="math\.external-services-consent"/);
  assert.match(app,/if\(!researchWorkbenchPromise\)researchWorkbenchPromise=import/);
  assert.match(app,/if\(!mathLabEnginePromise\)mathLabEnginePromise=import/);
  assert.match(html,/id="privacy-choices"/);
});

test("research SEO links land on the correct analytics tool instead of a generic first card",()=>{
 for(const [path,hash] of [
  ["uncertainty-calculator/index.html","../#research/uncertainty"],
  ["linear-regression-calculator/index.html","../#research/regression"],
  ["chi-square-calculator/index.html","../#research/chi-square"],
  ["ar/uncertainty-calculator/index.html","../../#research/uncertainty"]
 ])assert.ok(file(path).includes('href="'+hash+'"'),path);
 const fragments=html.slice(html.indexOf('<section id="research-section"'),html.indexOf('<section id="advanced-section"'));
 for(const name of ["exact","quantity","uncertainty","statistics","regression","chi-square","constants"])
  assert.ok(fragments.includes('data-research-tool="'+name+'"'),name);
 assert.match(app,/async function restoreResearchSubtoolHash\(raw,\{track=true\}=\{\}\)/);
 assert.match(app,/if\(await restoreResearchSubtoolHash\(target\)\)return/);
 assert.match(app,/if\(await restoreResearchSubtoolHash\(initialTool,\{track:false\}\)\)return/);
});
