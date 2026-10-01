import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Math Lab UI exposes interp1 methods and extrapolation bilingually",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-i18n="interpolationMethods"/);
  assert.match(index,/data-i18n="mathLabInterpolationCommands"/);
  assert.match(index,/interp1\(x,y,\[0.2 1.7\],'nearest'\)/);
  assert.match(index,/interp1\(x,y,\[-1 3\],'linear','extrap'\)/);
  assert.match(index,/interp1\(x,y,\[-1 3\],'linear',99\)/);
  assert.match(strings,/interpolationMethods:"Interpolation methods"/);
  assert.match(strings,/interpolationMethods:"طرق الاستيفاء"/);
  assert.match(strings,/mathLabInterpolationCommands:"الاستيفاء"/);
});
