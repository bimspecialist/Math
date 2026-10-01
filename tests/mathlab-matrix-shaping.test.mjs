import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("Math Lab repmat repeats matrix blocks",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nB=repmat(A,2,3)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.B,[
    [1,2,1,2,1,2],
    [3,4,3,4,3,4],
    [1,2,1,2,1,2],
    [3,4,3,4,3,4]
  ]);
});

test("Math Lab fliplr and flipud preserve values and shape",()=>{
  const r=runMathLabScript("A=[1 2 3;4 5 6]\nL=fliplr(A)\nU=flipud(A)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.L,[[3,2,1],[6,5,4]]);
  assert.deepEqual(r.workspace.U,[[4,5,6],[1,2,3]]);
});

test("Math Lab rot90 supports positive negative and repeated turns",()=>{
  const r=runMathLabScript("A=[1 2 3;4 5 6]\na=rot90(A)\nb=rot90(A,-1)\nc=rot90(A,2)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.a,[[3,6],[2,5],[1,4]]);
  assert.deepEqual(r.workspace.b,[[4,1],[5,2],[6,3]]);
  assert.deepEqual(r.workspace.c,[[6,5,4],[3,2,1]]);
});

test("Math Lab kron computes Kronecker products",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nB=[0 5;6 7]\nK=kron(A,B)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.K,[
    [0,5,0,10],
    [6,7,12,14],
    [0,15,0,20],
    [18,21,24,28]
  ]);
});

test("Math Lab blkdiag assembles heterogeneous blocks",()=>{
  const r=runMathLabScript("B=blkdiag([1 2;3 4],5,[6;7])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.B,[
    [1,2,0,0],
    [3,4,0,0],
    [0,0,5,0],
    [0,0,0,6],
    [0,0,0,7]
  ]);
});

test("Math Lab matrix shaping utilities preserve complex values",()=>{
  const r=runMathLabScript("z=complex(0,1)\nA=[z 2]\nR=repmat(A,2,1)\nF=fliplr(A)\nK=kron([1 2],[z])\nri=imag(R)\nfi=imag(F)\nki=imag(K)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.ri,[[1,0],[1,0]]);
  assert.deepEqual(r.workspace.fi,[[0,1]]);
  assert.deepEqual(r.workspace.ki,[[1,2]]);
});

test("Math Lab rot90 validates integer turn counts",()=>{
  const r=runMathLabScript("A=rot90([1 2;3 4],1.5)");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_ROTATION_COUNT");
});

test("Math Lab repmat protects matrix size limits",()=>{
  const r=runMathLabScript("A=repmat([1 2],1,51)");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_MATRIX_SIZE");
});

test("Math Lab blkdiag requires at least one block",()=>{
  const r=runMathLabScript("A=blkdiag()");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_ARGUMENT_COUNT");
});
