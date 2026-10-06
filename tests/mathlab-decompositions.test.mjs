import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

function approx(actual,expected,tolerance=1e-8){
  assert.ok(Math.abs(actual-expected)<=tolerance,`expected ${actual} ~= ${expected}`);
}
function approxMatrix(actual,expected,tolerance=1e-8){
  assert.equal(actual.length,expected.length);
  for(let i=0;i<expected.length;i++){
    assert.equal(actual[i].length,expected[i].length);
    for(let j=0;j<expected[i].length;j++)approx(actual[i][j],expected[i][j],tolerance);
  }
}

test("Math Lab LU two-output form reconstructs A directly",()=>{
  const r=runMathLabScript("A=[0 2;1 3]\n[L,U]=lu(A)\nB=L*U");
  assert.equal(r.ok,true);
  approxMatrix(r.workspace.B,[[0,2],[1,3]]);
});

test("Math Lab LU three-output form satisfies P*A=L*U",()=>{
  const r=runMathLabScript("A=[0 2;1 3]\n[L,U,P]=lu(A)\nX=P*A\nY=L*U");
  assert.equal(r.ok,true);
  approxMatrix(r.workspace.X,r.workspace.Y);
  assert.deepEqual(r.workspace.P,[[0,1],[1,0]]);
});

test("Math Lab QR decomposes rectangular full-rank matrices",()=>{
  const r=runMathLabScript("A=[1 1;1 -1;1 1]\n[Q,R]=qr(A)\nB=Q*R\nI=Q'*Q");
  assert.equal(r.ok,true);
  approxMatrix(r.workspace.B,[[1,1],[1,-1],[1,1]],1e-8);
  approxMatrix(r.workspace.I,[[1,0],[0,1]],1e-8);
});

test("Math Lab Cholesky returns upper factor R where R'*R=A",()=>{
  const r=runMathLabScript("A=[4 2;2 3]\nR=chol(A)\nB=R'*R");
  assert.equal(r.ok,true);
  approxMatrix(r.workspace.B,[[4,2],[2,3]],1e-8);
});

test("Math Lab rref computes reduced row echelon form",()=>{
  const r=runMathLabScript("R=rref([1 2 1;2 4 0;3 6 3])");
  assert.equal(r.ok,true);
  approxMatrix(r.workspace.R,[[1,2,0],[0,0,1],[0,0,0]],1e-8);
});

test("Math Lab rejects Cholesky for non-positive-definite matrices",()=>{
  const r=runMathLabScript("R=chol([1 2;2 1])");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"POSITIVE_DEFINITE_REQUIRED");
});

test("Math Lab rejects rank-deficient thin QR",()=>{
  const r=runMathLabScript("[Q,R]=qr([1 2;2 4;3 6])");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"RANK_DEFICIENT_MATRIX");
});

test("Math Lab decomposition built-ins validate output counts",()=>{
  let r=runMathLabScript("L=lu([1 0;0 1])");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"MULTIPLE_OUTPUTS_REQUIRED");
  r=runMathLabScript("[Q]=qr([1 0;0 1])");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_OUTPUT_COUNT");
});

test("Math Lab decomposition functions reject complex matrices explicitly",()=>{
  const r=runMathLabScript("z=complex(0,1)\nR=chol([2 z;z 2])");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"REAL_MATRIX_REQUIRED");
});


test("Math Lab SVD reconstructs rectangular matrices and preserves orthogonality",()=>{
  const r=runMathLabScript("A=[3 1;1 3;1 1]\n[U,S,V]=svd(A)\nB=U*S*V'\nIU=U'*U\nIV=V'*V\nk=cond(A)");
  assert.equal(r.ok,true);
  approxMatrix(r.workspace.B,[[3,1],[1,3],[1,1]],1e-7);
  approxMatrix(r.workspace.IU,[[1,0],[0,1]],1e-7);
  approxMatrix(r.workspace.IV,[[1,0],[0,1]],1e-7);
  assert.ok(Number.isFinite(r.workspace.k)&&r.workspace.k>=1);
});

test("Math Lab condition number flags singular matrices",()=>{
  const r=runMathLabScript("k=cond([1 2;2 4])");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.k,Infinity);
});

test("Math Lab SVD validates output count",()=>{
  const r=runMathLabScript("[U,S]=svd([1 0;0 1])");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_OUTPUT_COUNT");
});
