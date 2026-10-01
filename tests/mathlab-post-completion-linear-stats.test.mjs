import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

function approx(actual,expected,tolerance=1e-9){
  assert.ok(Math.abs(actual-expected)<=tolerance,`expected ${actual} ~= ${expected}`);
}

test("Math Lab computes eigenpairs for symmetric 3x3 matrices",()=>{
  const r=runMathLabScript("A=[2 1 0;1 2 0;0 0 5]\ne=eig(A)\nv=eigvec(A)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.e,[1,3,5]);
  assert.equal(r.workspace.v.length,3);
  assert.deepEqual(r.workspace.v.map(x=>x.value),[1,3,5]);
});

test("Math Lab keeps general real 2x2 eig support",()=>{
  const r=runMathLabScript("A=[0 1;2 3]\ne=eig(A)");
  assert.equal(r.ok,true);
  approx(r.workspace.e[0],-0.56155281280883,1e-10);
  approx(r.workspace.e[1],3.5615528128088,1e-10);
});

test("Math Lab computes matrix rank with pivoting",()=>{
  const r=runMathLabScript("A=[1 2 3;2 4 6;0 1 1]\nr=rank(A)");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.r,2);
});

test("Math Lab computes covariance correlation and corrcoef",()=>{
  const r=runMathLabScript("x=[1 2 3 4]\ny=[2 4 6 8]\nc=cov(x,y)\nr=corr(x,y)\nR=corrcoef(x,y)");
  assert.equal(r.ok,true);
  approx(r.workspace.c,3.3333333333333,1e-12);
  approx(r.workspace.r,1,1e-12);
  assert.deepEqual(r.workspace.R,[[1,1],[1,1]]);
});

test("Math Lab supports polynomial fit and evaluation",()=>{
  const r=runMathLabScript("x=[0 1 2 3]\ny=[1 3 7 13]\np=polyfit(x,y,2)\ny2=polyval(p,4)");
  assert.equal(r.ok,true);
  approx(r.workspace.p[0][0],1,1e-10);
  approx(r.workspace.p[0][1],1,1e-10);
  approx(r.workspace.p[0][2],1,1e-10);
  approx(r.workspace.y2,21,1e-9);
});

test("Math Lab validates correlation zero-variance input",()=>{
  const r=runMathLabScript("r=corr([1 1 1],[1 2 3])");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"ZERO_VARIANCE");
});

test("Math Lab validates unsupported general higher-order eig",()=>{
  const r=runMathLabScript("A=[1 2 0;0 3 4;0 0 5]\ne=eig(A)");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"EIGEN_REAL_SYMMETRIC_ONLY");
});
