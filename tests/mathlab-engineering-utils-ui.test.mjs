import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Math Lab UI exposes engineering utilities in both locales",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-i18n="polynomialCalculus"/);
  assert.match(index,/data-i18n="engineeringSignals"/);
  assert.match(index,/data-i18n="mathLabEngineeringCommands"/);
  assert.match(index,/polyder\(p\)/);
  assert.match(index,/\[q,r\] = deconv/);
  assert.match(index,/detrend\(x\)/);
  assert.match(strings,/polynomialCalculus:"Polynomial calculus"/);
  assert.match(strings,/polynomialCalculus:"تفاضل وتكامل كثيرات الحدود"/);
  assert.match(strings,/mathLabEngineeringCommands:"أدوات هندسية"/);
});
