import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

function approx(actual,expected,tolerance=1e-10){
  assert.ok(Math.abs(actual-expected)<=tolerance,`expected ${actual} ~= ${expected}`);
}

test("Math Lab logspace generates powers of ten",()=>{
  const r=runMathLabScript("x=logspace(0,3,4)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.x,[1,10,100,1000]);
});

test("Math Lab logspace defaults to 50 samples",()=>{
  const r=runMathLabScript("x=logspace(0,1)");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.x.length,50);
  approx(r.workspace.x[0],1);
  approx(r.workspace.x.at(-1),10);
});

test("Math Lab meshgrid returns MATLAB-style X and Y grids",()=>{
  const r=runMathLabScript("x=[1 2 3]\ny=[10 20]\n[X,Y]=meshgrid(x,y)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.X,[[1,2,3],[1,2,3]]);
  assert.deepEqual(r.workspace.Y,[[10,10,10],[20,20,20]]);
});

test("Math Lab meshgrid one-input form uses the same vector for both axes",()=>{
  const r=runMathLabScript("[X,Y]=meshgrid([1 2])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.X,[[1,2],[1,2]]);
  assert.deepEqual(r.workspace.Y,[[1,1],[2,2]]);
});

test("Math Lab meshgrid single-output form returns X",()=>{
  const r=runMathLabScript("X=meshgrid([1 2 3],[4 5])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.X,[[1,2,3],[1,2,3]]);
});

test("Math Lab ndgrid returns column-oriented coordinate grids",()=>{
  const r=runMathLabScript("[X,Y]=ndgrid([1 2 3],[10 20])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.X,[[1,1],[2,2],[3,3]]);
  assert.deepEqual(r.workspace.Y,[[10,20],[10,20],[10,20]]);
});

test("Math Lab grid functions validate output count",()=>{
  const r=runMathLabScript("[X]=meshgrid([1 2])");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_OUTPUT_COUNT");
});

test("Math Lab grid functions protect matrix-size limits",()=>{
  const values="["+Array.from({length:101},(_,i)=>i+1).join(" ")+"]";
  const r=runMathLabScript("[X,Y]=meshgrid("+values+",[1 2])");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_MATRIX_SIZE");
});

test("Math Lab logspace validates sample count",()=>{
  const r=runMathLabScript("x=logspace(0,1,1)");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_SAMPLE_COUNT");
});
