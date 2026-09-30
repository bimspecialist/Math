import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getProfessionalLibrary, getProfessionalFormula } from "../src/knowledge/professional-libraries.js";
import { evaluateProfessionalFormula } from "../src/knowledge/formula-workbench.js";
import { professionalFormulaExplanation } from "../src/knowledge/formula-explanations.js";

test("Civil Engineering Library includes expanded geometry statics and reinforcement tools",()=>{
  const civil=getProfessionalLibrary("civil");
  assert.ok(civil);
  for(const id of ["rect-area","concrete-volume","concrete-mass","footing-volume","slope-percent","bearing-pressure","udl-moment","udl-reaction","center-load-moment","center-load-reaction","point-load-left-reaction","point-load-right-reaction","rebar-area","rebar-unit-weight","rebar-total-length","rebar-total-weight"]){
    assert.ok(civil.formulas.some(x=>x.id===id),id);
  }
});

test("Civil quantity formulas calculate with explicit units and density",()=>{
  let r=evaluateProfessionalFormula(getProfessionalFormula("civil","rect-area"),{L:5,W:4});
  assert.equal(r.ok,true);assert.equal(r.value,20);assert.equal(r.unit," m²");

  r=evaluateProfessionalFormula(getProfessionalFormula("civil","concrete-volume"),{L:5,W:4,T:0.2});
  assert.equal(r.ok,true);assert.equal(r.value,4);

  r=evaluateProfessionalFormula(getProfessionalFormula("civil","concrete-mass"),{V:4,Density:2400});
  assert.equal(r.ok,true);assert.equal(r.value,9600);
});

test("Civil statics formulas satisfy equilibrium for a point load",()=>{
  const left=evaluateProfessionalFormula(getProfessionalFormula("civil","point-load-left-reaction"),{P:100,L:10,a:3});
  const right=evaluateProfessionalFormula(getProfessionalFormula("civil","point-load-right-reaction"),{P:100,L:10,a:3});
  assert.equal(left.ok,true);assert.equal(right.ok,true);
  assert.equal(left.value,70);
  assert.equal(right.value,30);
  assert.equal(left.value+right.value,100);

  const udl=evaluateProfessionalFormula(getProfessionalFormula("civil","udl-reaction"),{w:12,L:6});
  assert.equal(udl.ok,true);assert.equal(udl.value,36);

  const center=evaluateProfessionalFormula(getProfessionalFormula("civil","center-load-reaction"),{P:100});
  assert.equal(center.ok,true);assert.equal(center.value,50);
});

test("Civil beam moment formulas return expected simple-support values",()=>{
  let r=evaluateProfessionalFormula(getProfessionalFormula("civil","udl-moment"),{w:10,L:4});
  assert.equal(r.ok,true);assert.equal(r.value,20);

  r=evaluateProfessionalFormula(getProfessionalFormula("civil","center-load-moment"),{P:20,L:4});
  assert.equal(r.ok,true);assert.equal(r.value,20);
});

test("Civil physical constraints reject impossible or undefined inputs",()=>{
  for(const [id,values,code] of [
    ["bearing-pressure",{P:100,A:0},"VALUE_BELOW_MINIMUM"],
    ["slope-percent",{Rise:1,Run:0},"VALUE_BELOW_MINIMUM"],
    ["udl-moment",{w:10,L:0},"VALUE_BELOW_MINIMUM"],
    ["rebar-area",{d:0},"VALUE_BELOW_MINIMUM"],
    ["rebar-total-weight",{UnitWeight:0.617,Length:12,Quantity:2.5},"INTEGER_REQUIRED"],
    ["point-load-left-reaction",{P:100,L:10,a:11},"LOAD_OUTSIDE_SPAN"]
  ]){
    const r=evaluateProfessionalFormula(getProfessionalFormula("civil",id),values);
    assert.equal(r.ok,false,id);
    assert.equal(r.code,code,id+":"+r.code);
  }
});

test("Civil rebar formulas are internally consistent",()=>{
  const area=evaluateProfessionalFormula(getProfessionalFormula("civil","rebar-area"),{d:16});
  const unit=evaluateProfessionalFormula(getProfessionalFormula("civil","rebar-unit-weight"),{d:16});
  const length=evaluateProfessionalFormula(getProfessionalFormula("civil","rebar-total-length"),{Length:12,Quantity:10});
  const weight=evaluateProfessionalFormula(getProfessionalFormula("civil","rebar-total-weight"),{UnitWeight:unit.value,Length:12,Quantity:10});
  assert.equal(area.ok,true);assert.ok(Math.abs(area.value-Math.PI*64)<1e-10);
  assert.equal(unit.ok,true);assert.ok(Math.abs(unit.value-(7850*Math.PI*(0.016**2)/4))<1e-12);
  assert.equal(length.value,120);
  assert.ok(Math.abs(weight.value-unit.value*120)<1e-10);
});

test("Civil explanations document assumptions for every formula",()=>{
  const civil=getProfessionalLibrary("civil");
  for(const formula of civil.formulas){
    const en=professionalFormulaExplanation("civil",formula.id,"en");
    const ar=professionalFormulaExplanation("civil",formula.id,"ar");
    assert.ok(en,formula.id+" en");
    assert.ok(ar,formula.id+" ar");
  }
});

test("Civil UI maps physical-domain errors and input constraints",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(app,/LOAD_OUTSIDE_SPAN:"loadOutsideSpan"/);
  assert.match(app,/variable\.integer\?"1":"any"/);
  assert.match(app,/exclusiveMin/);
  assert.match(strings,/loadOutsideSpan/);
});
