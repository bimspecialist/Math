import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Math Lab UI exposes polynomial and signal processing tools",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-i18n="polynomialRoots"/);
  assert.match(index,/data-i18n="signalProcessing"/);
  assert.match(index,/data-i18n="mathLabSignalCommands"/);
  assert.match(index,/roots\(\[1 -6 11 -6\]\)/);
  assert.match(index,/fftshift\(fft\(x\)\)/);
  assert.match(strings,/polynomialRoots:"Polynomial roots"/);
  assert.match(strings,/polynomialRoots:"جذور كثيرات الحدود"/);
  assert.match(strings,/mathLabSignalCommands:"كثيرات الحدود والإشارات"/);
});
