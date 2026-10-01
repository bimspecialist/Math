import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Math Lab UI exposes complex and Fourier examples in both locales",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-i18n="complexNumbers"/);
  assert.match(index,/data-i18n="fourierTools"/);
  assert.match(index,/data-i18n="mathLabComplexCommands"/);
  assert.match(index,/fft\(x\)/);
  assert.match(index,/sqrt\(-1\)/);
  assert.match(strings,/complexNumbers:"Complex numbers"/);
  assert.match(strings,/complexNumbers:"الأعداد المركبة"/);
  assert.match(strings,/mathLabComplexCommands:"الأعداد المركبة وفورييه"/);
});
