import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Math Lab UI exposes grid generation tools bilingually",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-i18n="gridGeneration"/);
  assert.match(index,/data-i18n="mathLabGridGenerationCommands"/);
  assert.match(index,/logspace\(0,3,4\)/);
  assert.match(index,/\[X,Y\] = meshgrid/);
  assert.match(index,/\[U,V\] = ndgrid/);
  assert.match(strings,/gridGeneration:"Grid generation"/);
  assert.match(strings,/gridGeneration:"توليد الشبكات"/);
  assert.match(strings,/mathLabGridGenerationCommands:"توليد الشبكات"/);
});
