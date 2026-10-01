import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Math Lab UI exposes dimension-aware transforms bilingually",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-i18n="dimensionTransforms"/);
  assert.match(index,/data-i18n="mathLabDimensionTransformCommands"/);
  assert.match(index,/cumsum\(A,2\)/);
  assert.match(index,/cumprod\(A,1\)/);
  assert.match(index,/diff\(A,1,2\)/);
  assert.match(index,/sort\(A,2\)/);
  assert.match(strings,/dimensionTransforms:"Dimension transforms"/);
  assert.match(strings,/dimensionTransforms:"تحويلات بحسب البعد"/);
  assert.match(strings,/mathLabDimensionTransformCommands:"تحويلات بحسب البعد"/);
});
