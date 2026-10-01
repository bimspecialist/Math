import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

function approx(actual,expected,tolerance=1e-10){
  assert.ok(Math.abs(actual-expected)<=tolerance,`expected ${actual} ~= ${expected}`);
}
function approxMatrix(actual,expected,tolerance=1e-10){
  assert.equal(actual.length,expected.length);
  for(let i=0;i<expected.length;i++){
    assert.equal(actual[i].length,expected[i].length);
    for(let j=0;j<expected[i].length;j++)approx(actual[i][j],expected[i][j],tolerance);
  }
}

test("Math Lab reduces matrices along dimension 1 and 2",()=>{
  const script=[
    "A=[1 2 3;4 5 6]",
    "s1=sum(A,1)","s2=sum(A,2)",
    "m1=mean(A,1)","m2=mean(A,2)",
    "p1=prod(A,1)","p2=prod(A,2)"
  ].join("\n");
  const r=runMathLabScript(script);
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.s1,[[5,7,9]]);
  assert.deepEqual(r.workspace.s2,[[6],[15]]);
  assert.deepEqual(r.workspace.m1,[[2.5,3.5,4.5]]);
  assert.deepEqual(r.workspace.m2,[[2],[5]]);
  assert.deepEqual(r.workspace.p1,[[4,10,18]]);
  assert.deepEqual(r.workspace.p2,[[6],[120]]);
});

test("Math Lab supports dimension-aware min max and median",()=>{
  const r=runMathLabScript("A=[1 8 3;4 2 6]\na=min(A,1)\nb=max(A,2)\nc=median(A,1)\nd=median(A,2)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a,[[1,2,3]]);
  assert.deepEqual(r.workspace.b,[[8],[6]]);
  assert.deepEqual(r.workspace.c,[[2.5,5,4.5]]);
  assert.deepEqual(r.workspace.d,[[3],[4]]);
});

test("Math Lab supports sample variance and std by dimension",()=>{
  const r=runMathLabScript("A=[1 2 3;4 5 6]\nv1=var(A,1)\nv2=var(A,2)\ns1=std(A,1)\ns2=std(A,2)");
  assert.equal(r.ok,true);
  approxMatrix(r.workspace.v1,[[4.5,4.5,4.5]]);
  approxMatrix(r.workspace.v2,[[1],[1]]);
  approxMatrix(r.workspace.s1,[[Math.sqrt(4.5),Math.sqrt(4.5),Math.sqrt(4.5)]]);
  approxMatrix(r.workspace.s2,[[1],[1]]);
});

test("Math Lab supports logical reductions by dimension",()=>{
  const r=runMathLabScript("A=[0 1;0 0]\na1=any(A,1)\na2=any(A,2)\nb1=all(A,1)\nb2=all(A,2)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a1,[[0,1]]);
  assert.deepEqual(r.workspace.a2,[[1],[0]]);
  assert.deepEqual(r.workspace.b1,[[0,0]]);
  assert.deepEqual(r.workspace.b2,[[0],[0]]);
});

test("Single-argument reductions preserve legacy flatten semantics",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\ns=sum(A)\nm=mean(A)\np=prod(A)\nlo=min(A)\nhi=max(A)\nv=var(A)");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.s,10);
  assert.equal(r.workspace.m,2.5);
  assert.equal(r.workspace.p,24);
  assert.equal(r.workspace.lo,1);
  assert.equal(r.workspace.hi,4);
  approx(r.workspace.v,5/3);
});

test("Dimension reductions validate dimensions and matrix inputs",()=>{
  let r=runMathLabScript("A=[1 2;3 4]\ns=sum(A,3)");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_DIMENSION");
  r=runMathLabScript("s=sum(4,1)");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"MATRIX_REQUIRED");
});
