import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript, describeMathLabValue } from "../src/mathlab/math-lab-engine.js";

test("Math Lab supports MATLAB-style implicit expansion",()=>{
  const r=runMathLabScript("A=[1;2]\nB=[10 20 30]\nC=A+B\nD=A.*B\nE=A>1 & B>15");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.C,[[11,21,31],[12,22,32]]);
  assert.deepEqual(r.workspace.D,[[10,20,30],[20,40,60]]);
  assert.deepEqual(r.workspace.E,[[0,0,0],[0,1,1]]);
});

test("implicit expansion still rejects incompatible shapes",()=>{
  const r=runMathLabScript("A=ones(2,3)\nB=ones(4,2)\nA+B");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"MATRIX_DIMENSION_MISMATCH");
});

test("Math Lab supports named function handles",()=>{
  const r=runMathLabScript("f=@sin;\ny=f(pi/2)\nA=arrayfun(f,[0 pi/2])");
  assert.equal(r.ok,true);
  assert.ok(Math.abs(r.workspace.y-1)<1e-12);
  assert.ok(Math.abs(r.workspace.A[0][0])<1e-12);
  assert.ok(Math.abs(r.workspace.A[0][1]-1)<1e-12);
  assert.equal(describeMathLabValue(r.workspace.f).preview,"@sin");
});

test("named handles can target user-defined functions",()=>{
  const script=`function y = squareIt(x)
y=x^2;
end
f=@squareIt;
a=feval(f,5)`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,true);
  assert.equal(r.workspace.a,25);
});
