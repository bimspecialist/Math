import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Math Lab UI exposes matrix decomposition workflows bilingually",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-i18n="matrixDecompositions"/);
  assert.match(index,/data-i18n="matrixReduction"/);
  assert.match(index,/data-i18n="mathLabDecompositionCommands"/);
  assert.match(index,/\[L,U,P\] = lu\(A\)/);
  assert.match(index,/\[Q,R\] = qr/);
  assert.match(index,/rref\(/);
  assert.match(strings,/matrixDecompositions:"Matrix decompositions"/);
  assert.match(strings,/matrixDecompositions:"تحليلات المصفوفات"/);
  assert.match(strings,/matrixReduction:"اختزال المصفوفات"/);
});
