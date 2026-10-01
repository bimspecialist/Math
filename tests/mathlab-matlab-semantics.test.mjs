import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("reshape follows MATLAB column-major semantics",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nB=reshape(A,1,4)\nC=reshape([1 2 3 4],2,2)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.B,[[1,3,2,4]]);
  assert.deepEqual(r.workspace.C,[[1,3],[2,4]]);
});

test("diag creates a matrix from vectors and extracts matrix diagonals",()=>{
  let r=runMathLabScript("D=diag([1 2 3])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.D,[[1,0,0],[0,2,0],[0,0,3]]);

  r=runMathLabScript("d=diag([1 2;3 4])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.d,[[1],[4]]);
});

test("zeros ones and eye support MATLAB-style one and two dimensions",()=>{
  const r=runMathLabScript("Z=zeros(2)\nO=ones(2,3)\nI=eye(2,3)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.Z,[[0,0],[0,0]]);
  assert.deepEqual(r.workspace.O,[[1,1,1],[1,1,1]]);
  assert.deepEqual(r.workspace.I,[[1,0,0],[0,1,0]]);
});

test("feval invokes anonymous function handles",()=>{
  const r=runMathLabScript("f=@(x,y) x+y;\nz=feval(f,2,5)");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.z,7);
});

test("arrayfun maps anonymous handles over arrays",()=>{
  const r=runMathLabScript("f=@(x) x^2+1;\nB=arrayfun(f,[1 2;3 4])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.B,[[2,5],[10,17]]);
});

test("higher-order functions reject non-handles",()=>{
  const r=runMathLabScript("arrayfun(2,[1 2])");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"FUNCTION_HANDLE_REQUIRED");
});
