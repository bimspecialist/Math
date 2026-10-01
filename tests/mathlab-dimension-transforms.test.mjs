import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("Math Lab cumsum supports dimensions",()=>{
  const r=runMathLabScript("A=[1 2 3;4 5 6]\na=cumsum(A,1)\nb=cumsum(A,2)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a,[[1,2,3],[5,7,9]]);
  assert.deepEqual(r.workspace.b,[[1,3,6],[4,9,15]]);
});

test("Math Lab cumprod supports dimensions",()=>{
  const r=runMathLabScript("A=[1 2 3;4 5 6]\na=cumprod(A,1)\nb=cumprod(A,2)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a,[[1,2,3],[4,10,18]]);
  assert.deepEqual(r.workspace.b,[[1,2,6],[4,20,120]]);
});

test("Math Lab diff supports order and dimension",()=>{
  const r=runMathLabScript("A=[1 4 9;2 8 18]\na=diff(A,1,1)\nb=diff(A,1,2)\nc=diff([1 4 9 16],2)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a,[[1,4,9]]);
  assert.deepEqual(r.workspace.b,[[3,5],[6,10]]);
  assert.deepEqual(r.workspace.c,[[2,2]]);
});

test("Math Lab diff with zero order is identity along dimension",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\na=diff(A,0,1)\nb=diff(A,0,2)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a,[[1,2],[3,4]]);
  assert.deepEqual(r.workspace.b,[[1,2],[3,4]]);
});

test("Math Lab sort supports rows and columns by dimension",()=>{
  const r=runMathLabScript("A=[3 1 2;6 4 5]\na=sort(A,1)\nb=sort(A,2)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a,[[3,1,2],[6,4,5]]);
  assert.deepEqual(r.workspace.b,[[1,2,3],[4,5,6]]);
});

test("Math Lab sort dimension 1 sorts each column independently",()=>{
  const r=runMathLabScript("A=[9 2;1 8;5 4]\na=sort(A,1)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a,[[1,2],[5,4],[9,8]]);
});

test("Math Lab legacy one-argument transform behavior remains unchanged",()=>{
  const r=runMathLabScript("a=cumsum([1 2 3])\nb=cumprod([1 2 3])\nc=diff([1 4 9])\nd=sort([3 1 2])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a,[[1,3,6]]);
  assert.deepEqual(r.workspace.b,[[1,2,6]]);
  assert.deepEqual(r.workspace.c,[[3,5]]);
  assert.deepEqual(r.workspace.d,[[1,2,3]]);
});

test("Math Lab dimension transforms validate dimensions and diff order",()=>{
  let r=runMathLabScript("a=cumsum([1 2;3 4],3)");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_DIMENSION");
  r=runMathLabScript("a=diff([1 2 3],-1)");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_DIFFERENCE_ORDER");
});
