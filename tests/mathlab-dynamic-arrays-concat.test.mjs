import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("Math Lab concatenates matrices horizontally and vertically",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nB=[5;6]\nH=[A B]\nV=[A; A]");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.H,[[1,2,5],[3,4,6]]);
  assert.deepEqual(r.workspace.V,[[1,2],[3,4],[1,2],[3,4]]);
});

test("Math Lab concatenates ranges and nested matrix expressions",()=>{
  const r=runMathLabScript("A=[1:3 4:6]\nB=[[1;2] [3;4]]");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,2,3,4,5,6]]);
  assert.deepEqual(r.workspace.B,[[1,3],[2,4]]);
});

test("Math Lab rejects incompatible concatenation dimensions",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nB=[5 6 7]\nC=[A B]");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"CONCAT_DIMENSION_MISMATCH");
});

test("Math Lab grows row vectors with end+1 assignment",()=>{
  const r=runMathLabScript("A=[1 2 3]\nA(end+1)=4\nA(end+2)=6");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,2,3,4,0,6]]);
});

test("Math Lab grows column vectors with end+1 assignment",()=>{
  const r=runMathLabScript("A=[1;2]\nA(end+1)=3");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1],[2],[3]]);
});

test("Math Lab grows 2D matrices and zero-fills gaps",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nA(3,4)=9");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,2,0,0],[3,4,0,0],[0,0,0,9]]);
});

test("Math Lab linear growth preserves existing row count for matrices",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nA(end+1)=5");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,2,5],[3,4,0]]);
});

test("Math Lab deletes elements from row and column vectors",()=>{
  let r=runMathLabScript("A=[1 2 3 4]\nA(2)=[]");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,3,4]]);

  r=runMathLabScript("A=[1;2;3;4]\nA(3)=[]");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1],[2],[4]]);
});

test("Math Lab deletes full rows and columns",()=>{
  let r=runMathLabScript("A=[1 2 3;4 5 6;7 8 9]\nA(2,:)=[]");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,2,3],[7,8,9]]);

  r=runMathLabScript("A=[1 2 3;4 5 6;7 8 9]\nA(:,2)=[]");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,3],[4,6],[7,9]]);
});

test("Math Lab rejects ambiguous deletion from a true 2D matrix",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nA(2)=[]");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"LINEAR_DELETE_REQUIRES_VECTOR");
});


test("Math Lab can create arrays directly from indexed assignment",()=>{
  let r=runMathLabScript("A(3)=5");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[0,0,5]]);

  r=runMathLabScript("B(2,3)=7");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.B,[[0,0,0],[0,0,7]]);
});

test("Undefined colon indexed assignment remains rejected",()=>{
  const r=runMathLabScript("A(:)=1");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"UNDEFINED_VARIABLE");
});


test("Math Lab UI documents dynamic arrays and concatenation",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-i18n="dynamicArrays"/);
  assert.match(index,/mathLabDynamicArrayCommands/);
  assert.match(index,/A\(end\+1\)/);
  assert.match(strings,/ml_CONCAT_DIMENSION_MISMATCH/);
  assert.match(strings,/ml_LINEAR_DELETE_REQUIRES_VECTOR/);
});
