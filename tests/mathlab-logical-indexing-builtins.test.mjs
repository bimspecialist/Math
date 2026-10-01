import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("Math Lab supports logical indexing for reads",()=>{
  const r=runMathLabScript("A=[1 4;2 5]\nB=A(A>2)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.B,[[4,5]]);
});

test("Math Lab supports logical indexed assignment",()=>{
  const r=runMathLabScript("A=[1 4;2 5]\nA(A>2)=0");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,0],[2,0]]);
});

test("Math Lab validates logical mask size",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nB=[1 0 1]\nA(B>0)");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"LOGICAL_INDEX_SIZE_MISMATCH");
});

test("Math Lab provides cumulative and ordering helpers",()=>{
  const r=runMathLabScript("A=[3 1 2 1]\np=prod(A)\ns=cumsum(A)\ncp=cumprod(A)\nd=diff(A)\no=sort(A)\nu=unique(A)");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.p,6);
  assert.deepEqual(r.workspace.s,[[3,4,6,7]]);
  assert.deepEqual(r.workspace.cp,[[3,3,6,6]]);
  assert.deepEqual(r.workspace.d,[[-2,1,-1]]);
  assert.deepEqual(r.workspace.o,[[1,1,2,3]]);
  assert.deepEqual(r.workspace.u,[[1,2,3]]);
});

test("Math Lab provides rounding sign and remainder helpers",()=>{
  const r=runMathLabScript("A=[-1.7 -0.2 1.2 1.8]\nr=round(A)\nf=floor(A)\nc=ceil(A)\nx=fix(A)\ns=sign(A)\nm=mod([-5 5],3)\nq=rem([-5 5],3)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.r,[[-2,0,1,2]]);
  assert.deepEqual(r.workspace.f,[[-2,-1,1,1]]);
  assert.deepEqual(r.workspace.c,[[-1,0,2,2]]);
  assert.deepEqual(r.workspace.x,[[-1,0,1,1]]);
  assert.deepEqual(r.workspace.s,[[-1,-1,1,1]]);
  assert.deepEqual(r.workspace.m,[[1,2]]);
  assert.deepEqual(r.workspace.q,[[-2,2]]);
});

test("Math Lab size supports dimension queries",()=>{
  const r=runMathLabScript("A=[1 2 3;4 5 6]\ns=size(A)\nr=size(A,1)\nc=size(A,2)\nd=size(A,3)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.s,[2,3]);
  assert.equal(r.workspace.r,2);
  assert.equal(r.workspace.c,3);
  assert.equal(r.workspace.d,1);
});
