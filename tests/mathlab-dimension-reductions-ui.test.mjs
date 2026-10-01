import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Math Lab UI exposes dimension-aware reductions bilingually",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-i18n="dimensionReductions"/);
  assert.match(index,/data-i18n="mathLabReductionCommands"/);
  assert.match(index,/sum\(A,1\)/);
  assert.match(index,/std\(A,2\)/);
  assert.match(strings,/dimensionReductions:"Dimension reductions"/);
  assert.match(strings,/dimensionReductions:"اختزالات حسب البعد"/);
  assert.match(strings,/mathLabReductionCommands:"اختزالات المصفوفات"/);
});
