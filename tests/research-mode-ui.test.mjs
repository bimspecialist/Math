import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Professor Research Mode is reachable and exposes all four work areas",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-tool-target="research"/);
  assert.match(index,/id="research-section"/);
  assert.match(index,/id="research-exact-input"/);
  assert.match(index,/id="research-quantity-input"/);
  assert.match(index,/id="research-uncertainty-run"/);
  assert.match(index,/id="research-constants-list"/);
  assert.match(app,/runExactResearch/);
  assert.match(app,/runQuantityResearch/);
  assert.match(app,/runUncertaintyResearch/);
  assert.match(strings,/researchTitle:"Research Mode"/);
  assert.match(strings,/researchTitle:"وضع البحث"/);
});
