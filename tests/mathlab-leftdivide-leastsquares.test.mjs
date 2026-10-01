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

test("Math Lab left divide solves square systems",()=>{
  const r=runMathLabScript("A=[2 1;1 3]\nb=[1;2]\nx=A\\b\ncheck=A*x");
  assert.equal(r.ok,true);
  approxMatrix(r.workspace.x,[[0.2],[0.6]]);
  approxMatrix(r.workspace.check,[[1],[2]]);
});

test("Math Lab left divide solves overdetermined least squares",()=>{
  const r=runMathLabScript("A=[1 0;1 1;1 2]\nb=[1;2;2]\nx=A\\b\ny=A*x\nr=b-y");
  assert.equal(r.ok,true);
  approx(r.workspace.x[0][0],7/6,1e-8);
  approx(r.workspace.x[1][0],0.5,1e-8);
  const residual=r.workspace.r;
  const AtR=runMathLabScript("A=[1 0;1 1;1 2]\nr=["+residual.map(row=>row[0]).join(";")+"]\nz=A'*r");
  assert.equal(AtR.ok,true);
  approxMatrix(AtR.workspace.z,[[0],[0]],1e-8);
});

test("Math Lab lstsq matches left division on tall systems",()=>{
  const r=runMathLabScript("A=[1 0;1 1;1 2]\nb=[1;2;2]\nx=A\\b\ny=lstsq(A,b)");
  assert.equal(r.ok,true);
  approxMatrix(r.workspace.x,r.workspace.y,1e-10);
});

test("Math Lab pseudoinverse satisfies A*pinv(A)*A=A for tall matrices",()=>{
  const r=runMathLabScript("A=[1 0;1 1;1 2]\nP=pinv(A)\nB=A*P*A");
  assert.equal(r.ok,true);
  approxMatrix(r.workspace.B,[[1,0],[1,1],[1,2]],1e-8);
});

test("Math Lab pseudoinverse supports wide full-row-rank matrices",()=>{
  const r=runMathLabScript("A=[1 0 1;0 1 1]\nP=pinv(A)\nB=A*P*A");
  assert.equal(r.ok,true);
  approxMatrix(r.workspace.B,[[1,0,1],[0,1,1]],1e-8);
});

test("Math Lab underdetermined left divide returns a minimum-norm solution",()=>{
  const r=runMathLabScript("A=[1 0 1;0 1 1]\nb=[1;1]\nx=A\\b\ny=A*x");
  assert.equal(r.ok,true);
  approxMatrix(r.workspace.y,[[1],[1]],1e-8);
  approxMatrix(r.workspace.x,[[1/3],[1/3],[2/3]],1e-8);
});

test("Math Lab scalar left division follows MATLAB b/a semantics",()=>{
  const r=runMathLabScript("x=2\\8");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.x,4);
});

test("Math Lab least squares rejects rank-deficient tall systems",()=>{
  const r=runMathLabScript("A=[1 2;2 4;3 6]\nb=[1;2;3]\nx=A\\b");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"RANK_DEFICIENT_MATRIX");
});

test("Math Lab pseudoinverse currently rejects complex matrices explicitly",()=>{
  const r=runMathLabScript("z=complex(0,1)\nP=pinv([1 z;0 1])");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"REAL_MATRIX_REQUIRED");
});
