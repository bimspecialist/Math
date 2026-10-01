import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

function approx(actual,expected,tolerance=1e-8){
  assert.ok(Math.abs(actual-expected)<=tolerance,`expected ${actual} ~= ${expected}`);
}

test("Math Lab integrates sampled data with trapz and cumtrapz",()=>{
  const r=runMathLabScript("x=[0 1 2]\ny=[0 1 4]\nA=trapz(x,y)\nC=cumtrapz(x,y)");
  assert.equal(r.ok,true);
  approx(r.workspace.A,3);
  assert.deepEqual(r.workspace.C,[[0,0.5,3]]);
});

test("Math Lab computes numerical gradients",()=>{
  const r=runMathLabScript("g=gradient([0 1 4 9],1)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.g,[[1,2,4,5]]);
});

test("Math Lab performs linear interpolation for scalar and vector queries",()=>{
  const r=runMathLabScript("x=[0 1 2]\ny=[0 10 20]\na=interp1(x,y,0.5)\nb=interp1(x,y,[0.25 1.5])");
  assert.equal(r.ok,true);
  approx(r.workspace.a,5);
  assert.deepEqual(r.workspace.b,[[2.5,15]]);
});

test("Math Lab differentiates anonymous functions numerically",()=>{
  const r=runMathLabScript("f=@(x) x^3\nd=derivative(f,2)");
  assert.equal(r.ok,true);
  approx(r.workspace.d,12,1e-6);
});

test("Math Lab integrates anonymous functions with Simpson rule",()=>{
  const r=runMathLabScript("f=@(x) x^2\nI=integral(f,0,3,200)");
  assert.equal(r.ok,true);
  approx(r.workspace.I,9,1e-9);
});

test("Math Lab finds bracketed nonlinear roots",()=>{
  const r=runMathLabScript("f=@(x) x^2-2\nr=fzero(f,[0 2])");
  assert.equal(r.ok,true);
  approx(r.workspace.r,Math.sqrt(2),1e-9);
});

test("Math Lab solves scalar ODEs with RK4",()=>{
  const r=runMathLabScript("f=@(t,y) y\nS=rk4(f,[0 1],1,20)");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.S.length,21);
  approx(r.workspace.S.at(-1)[0],1,1e-12);
  approx(r.workspace.S.at(-1)[1],Math.E,2e-6);
});

test("Math Lab returns real roots for linear and quadratic polynomials",()=>{
  const r=runMathLabScript("a=roots([1 -5 6])\nb=roots([2 -8])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a,[[2,3]]);
  assert.deepEqual(r.workspace.b,[[4]]);
});

test("Math Lab returns complex quadratic roots when required",()=>{
  const r=runMathLabScript("r=roots([1 0 1])");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.r[0].length,2);
  const roots=r.workspace.r[0];
  assert.equal(roots[0].__mathlabComplex,true);
  assert.equal(roots[1].__mathlabComplex,true);
  approx(roots[0].re,0,1e-12);
  approx(Math.abs(roots[0].im),1,1e-12);
  approx(roots[1].re,0,1e-12);
  approx(Math.abs(roots[1].im),1,1e-12);
});

test("Math Lab validates interpolation bounds",()=>{
  const r=runMathLabScript("r=interp1([0 1],[0 1],2)");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INTERPOLATION_OUT_OF_RANGE");
});
