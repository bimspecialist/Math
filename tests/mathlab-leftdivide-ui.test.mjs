import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Math Lab UI exposes left division and least squares bilingually",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-i18n="leastSquaresTools"/);
  assert.match(index,/data-i18n="mathLabLinearSolveCommands"/);
  assert.match(index,/x = A\\\\b/);
  assert.match(index,/lstsq\(A,b\)/);
  assert.match(index,/pinv\(A\)/);
  assert.match(strings,/leastSquaresTools:"Least squares"/);
  assert.match(strings,/leastSquaresTools:"المربعات الصغرى"/);
  assert.match(strings,/mathLabLinearSolveCommands:"الأنظمة الخطية"/);
});
