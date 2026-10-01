import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { UI_STRINGS } from "../src/i18n/ui-strings.js";

const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const qualityCss=readFileSync(new URL("../styles/ui-quality.css",import.meta.url),"utf8");

test("every HTML localization key exists in both English and Arabic",()=>{
  const keys=[...index.matchAll(/data-i18n(?:-[a-z-]+)?="([^"]+)"/g)].map(m=>m[1]);
  const unique=[...new Set(keys)];
  const missingEn=unique.filter(key=>!Object.prototype.hasOwnProperty.call(UI_STRINGS.en,key));
  const missingAr=unique.filter(key=>!Object.prototype.hasOwnProperty.call(UI_STRINGS.ar,key));
  assert.deepEqual(missingEn,[]);
  assert.deepEqual(missingAr,[]);
});

test("primary navigation terminology is explicit and consistent",()=>{
  assert.equal(UI_STRINGS.en.navScientific,"Scientific Calculator");
  assert.equal(UI_STRINGS.ar.navScientific,"الحاسبة العلمية");
  assert.equal(UI_STRINGS.en.navGraphing,"Graphing Calculator");
  assert.equal(UI_STRINGS.ar.navGraphing,"حاسبة الرسم البياني");
  assert.equal(UI_STRINGS.en.navProgrammer,"Programmer Calculator");
  assert.equal(UI_STRINGS.ar.navProgrammer,"حاسبة المبرمج");
  assert.equal(UI_STRINGS.ar.navAdvancedSolver,"الحل المتقدم للمعادلات");
});

test("Math Lab examples use grouped progressive disclosure instead of one flat toolbar",()=>{
  assert.doesNotMatch(index,/<div class="mathlab-toolbar">/);
  assert.match(index,/class="mathlab-example-browser"/);
  assert.match(index,/class="mathlab-example-groups"/);
  assert.equal((index.match(/class="mathlab-example-group"/g)||[]).length,4);
  assert.ok((index.match(/data-mathlab-example=/g)||[]).length>=30);
});

test("Math Lab example groups are localized in both languages",()=>{
  for(const key of [
    "mathLabExamplesTitle",
    "mathLabExamplesHint",
    "mathLabExampleGroupBasics",
    "mathLabExampleGroupMatrices",
    "mathLabExampleGroupNumerical",
    "mathLabExampleGroupSignals"
  ]){
    assert.ok(UI_STRINGS.en[key],`missing English ${key}`);
    assert.ok(UI_STRINGS.ar[key],`missing Arabic ${key}`);
  }
});

test("the UI quality stylesheet loads after the legacy calculator stylesheet",()=>{
  const base=index.indexOf("./styles/calculator.css");
  const quality=index.indexOf("./styles/ui-quality.css");
  assert.ok(base>=0);
  assert.ok(quality>base);
});

test("responsive quality layer protects controls from overlap and text expansion",()=>{
  assert.match(qualityCss,/\.mathlab-example-groups\s*\{[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(qualityCss,/\.mathlab-example-grid\s*\{[\s\S]*minmax\(min\(100%,150px\),1fr\)/);
  assert.match(qualityCss,/\.tool-item,[\s\S]*white-space:normal/);
  assert.match(qualityCss,/@media\(max-width:700px\)[\s\S]*grid-template-columns:1fr/);
  assert.match(qualityCss,/html\[dir="rtl"\][\s\S]*text-align:start/);
  assert.match(qualityCss,/@media\(prefers-reduced-motion:reduce\)/);
});

test("technical math/code surfaces remain LTR inside Arabic UI",()=>{
  assert.match(qualityCss,/html\[dir="rtl"\] code,[\s\S]*direction:ltr/);
  assert.match(qualityCss,/textarea\[dir="ltr"\]/);
});
