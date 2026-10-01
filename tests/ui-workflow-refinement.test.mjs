import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { UI_STRINGS } from "../src/i18n/ui-strings.js";

const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles/ui-quality.css",import.meta.url),"utf8");

test("sidebar groups are collapsible and preserve accessible expanded state",()=>{
  assert.match(index,/class="tool-group-title tool-group-toggle" aria-expanded="true"/);
  assert.ok(app.includes("function setToolGroupCollapsed(group,collapsed)"));
  assert.ok(app.includes('setAttribute("aria-expanded",String(!collapsed))'));
  assert.ok(app.includes('setToolGroupCollapsed(group,!group.querySelector(".tool-item.active"))'));
  assert.match(css,/\.tool-group\.is-collapsed > :not\(\.tool-group-title\)\{display:none\}/);
});

test("tool search and active navigation expand relevant groups",()=>{
  assert.match(app,/function syncToolGroupsForContext\(\)/);
  assert.match(app,/if\(query\|\|containsActive\)setToolGroupCollapsed\(group,false\)/);
  assert.match(app,/toolSearch\?\.addEventListener\("input",syncToolGroupsForContext\)/);
});

test("Math Lab uses a vertical task flow with scrollable examples",()=>{
  assert.match(css,/\.mathlab-layout\{[\s\S]*grid-template-columns:1fr/);
  assert.match(css,/\.mathlab-example-browser\{[\s\S]*max-block-size:340px;[\s\S]*overflow:auto/);
  assert.match(css,/\.mathlab-results > section:first-child\{\s*grid-column:1\/-1/);
  assert.match(css,/\.mathlab-results\{[\s\S]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test("Ramp duplicate geometry result is hidden instead of repeated",()=>{
  assert.match(index,/id="ramp-design-match-note"/);
  assert.match(app,/function rampResultsMatch\(a,aUnit,b,bUnit\)/);
  assert.match(app,/rampDesignResult\.hidden=matches/);
  assert.match(app,/translate\(locale,"rampResultsMatch"\)/);
  assert.ok(UI_STRINGS.en.rampResultsMatch);
  assert.ok(UI_STRINGS.ar.rampResultsMatch);
});
