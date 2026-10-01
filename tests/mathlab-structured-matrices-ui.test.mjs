import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Math Lab UI exposes structured matrix utilities bilingually",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-i18n="structuredMatrices"/);
  assert.match(index,/data-i18n="mathLabStructuredMatrixCommands"/);
  assert.match(index,/toeplitz\(\[1 2 3\]\)/);
  assert.match(index,/hankel\(\[1 2 3\],\[3 4 5\]\)/);
  assert.match(index,/tril\(A,-1\)/);
  assert.match(index,/triu\(A,1\)/);
  assert.match(strings,/structuredMatrices:"Structured matrices"/);
  assert.match(strings,/structuredMatrices:"المصفوفات المنظمة"/);
  assert.match(strings,/mathLabStructuredMatrixCommands:"المصفوفات المنظمة"/);
});
