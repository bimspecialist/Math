import test from "node:test";
import assert from "node:assert/strict";
import { runExactResearch, runQuantityResearch, runUncertaintyResearch, researchConstants, runTTestResearch } from "../src/science/research-workbench.js";

test("Research Mode exact arithmetic returns exact and decimal forms",()=>{
  const r=runExactResearch("0.1+0.2",80);
  assert.equal(r.kind,"exact");assert.equal(r.fraction,"3/10");assert.equal(r.decimal,"0.3");
});

test("Research Mode quantity calculations preserve dimensions",()=>{
  const r=runQuantityResearch("20 m / 4 s","mph");
  assert.equal(r.kind,"quantity-conversion");
  assert.ok(Math.abs(r.value-11.18468146027201)<1e-10);
});

test("Research Mode uncertainty returns formatted propagated result",()=>{
  const r=runUncertaintyResearch({a:10,ua:0.2,b:5,ub:0.1,operation:"*",correlation:0});
  assert.equal(r.kind,"measurement");
  assert.match(r.formatted,/±/);
  assert.ok(r.uncertainty>0);
});

test("Research Mode exposes a substantial scientific constants catalog",()=>{
  const rows=researchConstants();
  assert.ok(rows.length>=15);
  assert.ok(rows.some(x=>x.id==="c0"));
  assert.ok(rows.some(x=>x.id==="kb"));
});


test("Research Mode exposes professor-level Student-t inference",()=>{
  const r=runTTestResearch([10.2,9.9,10.5,10.1,10.3],10,0.05);
  assert.equal(r.kind,"t-test");
  assert.equal(r.df,4);
  assert.ok(r.pValue>=0&&r.pValue<=1);
  assert.equal(r.ci.length,2);
});
