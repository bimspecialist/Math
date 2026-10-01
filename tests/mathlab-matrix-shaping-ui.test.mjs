import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Math Lab UI exposes matrix shaping utilities bilingually",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-i18n="matrixShapingTools"/);
  assert.match(index,/data-i18n="mathLabMatrixShapingCommands"/);
  assert.match(index,/repmat\(A,2,2\)/);
  assert.match(index,/rot90\(A\)/);
  assert.match(index,/kron\(A,\[1 0;0 1\]\)/);
  assert.match(index,/blkdiag\(A,5\)/);
  assert.match(strings,/matrixShapingTools:"Matrix shaping"/);
  assert.match(strings,/matrixShapingTools:"تشكيل المصفوفات"/);
  assert.match(strings,/mathLabMatrixShapingCommands:"تشكيل المصفوفات"/);
});
