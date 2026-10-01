import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Math Lab UI exposes numerical methods examples and bilingual labels",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-i18n="numericalMethods"/);
  assert.match(index,/data-i18n="sampledData"/);
  assert.match(index,/data-i18n="odeSolvers"/);
  assert.match(index,/data-i18n="mathLabNumericalCommands"/);
  assert.match(index,/fzero\(f,\[0 2\]\)/);
  assert.match(index,/rk4\(f,\[0 1\],1,20\)/);
  assert.match(strings,/numericalMethods:"Numerical methods"/);
  assert.match(strings,/numericalMethods:"طرق عددية"/);
  assert.match(strings,/mathLabNumericalCommands:"الطرق العددية"/);
});
