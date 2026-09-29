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
