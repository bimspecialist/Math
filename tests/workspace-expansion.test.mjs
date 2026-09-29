import test from "node:test";
import assert from "node:assert/strict";
import { FORMULAS, filterFormulas, FORMULA_CATEGORIES } from "../src/formulas/formula-library.js";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";
import { readFileSync } from "node:fs";

test("formula library spans the core requested mathematical categories",()=>{
  for(const id of ["algebra","geometry","trigonometry","calculus","statistics","sequences","complex","linear-algebra"])
    assert.ok(FORMULA_CATEGORIES.some(x=>x.id===id),id);
  assert.ok(FORMULAS.length>=30);
});

test("formula library filters by category and free text",()=>{
  const trig=filterFormulas({category:"trigonometry",query:"sin"});
  assert.ok(trig.length>0);
  assert.ok(trig.every(x=>x.category==="trigonometry"));
  const pyth=filterFormulas({category:"all",query:"Pythagorean"});
  assert.ok(pyth.some(x=>/a²/.test(x.formula)||/c²/.test(x.formula)));
});

test("Math Lab evaluates assignments and reuses workspace variables",()=>{
  const r=runMathLabScript("a = 5\nb = a^2 + 3\nb");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.a,5);
  assert.equal(r.workspace.b,28);
  assert.equal(r.outputs.at(-1).value,28);
});

test("Math Lab parses matrices and computes determinant and transpose",()=>{
  const r=runMathLabScript("A = [1,2;3,4]\ndet(A)\ntranspose(A)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,2],[3,4]]);
  assert.equal(r.outputs[1].value,-2);
  assert.deepEqual(r.outputs[2].value,[[1,3],[2,4]]);
});

test("application shell exposes sidebar, formulas and Math Lab pages",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/id="tool-sidebar"/);
  assert.match(index,/data-tool-target="formulas"/);
  assert.match(index,/id="formulas-section"/);
  assert.match(index,/id="mathlab-section"/);
  assert.match(index,/id="formula-search"/);
  assert.match(index,/id="formula-category"/);
  assert.match(index,/id="mathlab-run"/);
  assert.match(app,/renderFormulaLibrary/);
  assert.match(app,/runMathLabScript/);
});


test("unit converter handles core engineering categories",async()=>{
  const {convertUnit, CONVERTER_CATEGORIES}=await import("../src/converters/unit-converter.js");
  assert.equal(convertUnit("length",1,"km","m"),1000);
  assert.equal(convertUnit("temperature",0,"C","F"),32);
  assert.ok(Math.abs(convertUnit("angle",180,"deg","rad")-Math.PI)<1e-12);
  assert.equal(convertUnit("data",1,"MB","B"),1000000);
  for(const id of ["volume","length","mass","temperature","energy","area","speed","time","power","data","pressure","angle"])
    assert.ok(CONVERTER_CATEGORIES[id],id);
});

test("sidebar exposes converter categories and shared converter page",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(index,/id="converter-section"/);
  assert.match(index,/data-converter-category="length"/);
  assert.match(index,/data-converter-category="temperature"/);
  assert.match(index,/id="converter-input"/);
  assert.match(index,/id="converter-result"/);
});

test("language toggle no longer depends on removed top-tab markup",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.doesNotMatch(app,/data-tab-target/);
});
