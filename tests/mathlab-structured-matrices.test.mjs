import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("Math Lab toeplitz builds a symmetric real matrix from one vector",()=>{
  const r=runMathLabScript("T=toeplitz([1 2 3])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.T,[[1,2,3],[2,1,2],[3,2,1]]);
});

test("Math Lab toeplitz supports independent first column and row",()=>{
  const r=runMathLabScript("T=toeplitz([1 2 3],[9 4 5 6])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.T,[
    [1,4,5,6],
    [2,1,4,5],
    [3,2,1,4]
  ]);
});

test("Math Lab toeplitz one-input form conjugates the first row for complex vectors",()=>{
  const r=runMathLabScript("z=complex(2,3)\nT=toeplitz([1 z])\nR=real(T)\nI=imag(T)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.R,[[1,2],[2,1]]);
  assert.deepEqual(r.workspace.I,[[0,-3],[3,0]]);
});

test("Math Lab hankel builds constant anti-diagonals",()=>{
  const r=runMathLabScript("H=hankel([1 2 3],[3 4 5 6])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.H,[
    [1,2,3,4],
    [2,3,4,5],
    [3,4,5,6]
  ]);
});

test("Math Lab hankel one-input form pads the last row with zeros",()=>{
  const r=runMathLabScript("H=hankel([1 2 3])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.H,[
    [1,2,3],
    [2,3,0],
    [3,0,0]
  ]);
});

test("Math Lab tril and triu keep requested triangular regions",()=>{
  const r=runMathLabScript("A=[1 2 3;4 5 6;7 8 9]\nL=tril(A)\nU=triu(A)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.L,[[1,0,0],[4,5,0],[7,8,9]]);
  assert.deepEqual(r.workspace.U,[[1,2,3],[0,5,6],[0,0,9]]);
});

test("Math Lab tril and triu support diagonal offsets",()=>{
  const r=runMathLabScript("A=[1 2 3;4 5 6;7 8 9]\nL=tril(A,-1)\nU=triu(A,1)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.L,[[0,0,0],[4,0,0],[7,8,0]]);
  assert.deepEqual(r.workspace.U,[[0,2,3],[0,0,6],[0,0,0]]);
});

test("Math Lab triangular extraction preserves complex entries",()=>{
  const r=runMathLabScript("z=complex(0,2)\nA=[z 1;2 z]\nU=triu(A)\nI=imag(U)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.I,[[2,0],[0,2]]);
});

test("Math Lab structured matrix functions validate vector and offset inputs",()=>{
  let r=runMathLabScript("T=toeplitz([1 2;3 4])");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"VECTOR_REQUIRED");
  r=runMathLabScript("U=triu([1 2;3 4],1.5)");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_DIAGONAL_OFFSET");
});
