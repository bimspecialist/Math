import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

function approx(actual,expected,tolerance=1e-9){
  assert.ok(Math.abs(actual-expected)<=tolerance,`expected ${actual} ~= ${expected}`);
}

test("Math Lab parses single and double quoted string literals",()=>{
  const r=runMathLabScript("a='linear'\nb=\"nearest\"");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.a,"linear");
  assert.equal(r.workspace.b,"nearest");
});

test("Math Lab interp1 keeps linear interpolation as the default",()=>{
  const r=runMathLabScript("x=[0 1 2]\ny=[0 10 20]\na=interp1(x,y,0.5)\nb=interp1(x,y,[0.25 1.5])");
  assert.equal(r.ok,true);
  approx(r.workspace.a,5);
  assert.deepEqual(r.workspace.b,[[2.5,15]]);
});

test("Math Lab interp1 supports nearest interpolation",()=>{
  const r=runMathLabScript("x=[0 1 2]\ny=[0 10 30]\na=interp1(x,y,[0.2 0.8 1.6],'nearest')");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a,[[0,10,30]]);
});

test("Math Lab interp1 supports previous and next interpolation",()=>{
  const r=runMathLabScript("x=[0 1 2]\ny=[5 10 20]\np=interp1(x,y,[0.2 1.8],'previous')\nn=interp1(x,y,[0.2 1.8],'next')");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.p,[[5,10]]);
  assert.deepEqual(r.workspace.n,[[10,20]]);
});

test("Math Lab interp1 linearly extrapolates with extrap",()=>{
  const r=runMathLabScript("x=[0 1 2]\ny=[0 10 20]\na=interp1(x,y,[-1 3],'linear','extrap')");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a,[[-10,30]]);
});

test("Math Lab interp1 supports constant extrapolation values",()=>{
  const r=runMathLabScript("x=[0 1 2]\ny=[0 10 20]\na=interp1(x,y,[-1 1.5 3],'linear',99)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a,[[99,15,99]]);
});

test("Math Lab interp1 nearest extrap clamps to endpoint samples",()=>{
  const r=runMathLabScript("a=interp1([0 1 2],[5 10 20],[-1 3],'nearest','extrap')");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a,[[5,20]]);
});

test("Math Lab interp1 preserves out-of-range validation without extrapolation",()=>{
  const r=runMathLabScript("a=interp1([0 1],[0 1],2,'linear')");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INTERPOLATION_OUT_OF_RANGE");
});

test("Math Lab interp1 validates methods and extrapolation modes",()=>{
  let r=runMathLabScript("a=interp1([0 1],[0 1],0.5,'cubic')");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"UNSUPPORTED_INTERPOLATION_METHOD");
  r=runMathLabScript("a=interp1([0 1],[0 1],2,'linear','bad')");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_EXTRAPOLATION");
});

test("String literal support does not break matrix transpose syntax",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nB=A'");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.B,[[1,3],[2,4]]);
});
