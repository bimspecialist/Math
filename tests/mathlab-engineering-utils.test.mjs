import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

function approx(actual,expected,tolerance=1e-9){
  assert.ok(Math.abs(actual-expected)<=tolerance,`expected ${actual} ~= ${expected}`);
}

test("Math Lab differentiates and integrates polynomial coefficients",()=>{
  const r=runMathLabScript("p=[3 0 -2 5]\nd=polyder(p)\ni=polyint(d,7)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.d,[[9,0,-2]]);
  assert.deepEqual(r.workspace.i,[[3,0,-2,7]]);
});

test("Math Lab deconv returns quotient for single output",()=>{
  const r=runMathLabScript("q=deconv([1 -3 2],[1 -1])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.q,[[1,-2]]);
});

test("Math Lab deconv supports MATLAB-style quotient and remainder outputs",()=>{
  const r=runMathLabScript("[q,r]=deconv([1 0 -1 2],[1 -1])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.q,[[1,1,0]]);
  assert.deepEqual(r.workspace.r,[[2]]);
});

test("Math Lab deconv supports complex coefficients",()=>{
  const r=runMathLabScript("z=complex(0,1)\n[q,r]=deconv([1 z -1],[1 z])\nqr=real(q)\nqi=imag(q)");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.q[0].length,2);
  assert.equal(r.workspace.r[0].length,1);
  assert.deepEqual(r.workspace.qr,[[1,0]]);
  assert.deepEqual(r.workspace.qi,[[0,0]]);
});

test("Math Lab computes RMS for real and complex data",()=>{
  let r=runMathLabScript("a=rms([3 4])");
  assert.equal(r.ok,true);
  approx(r.workspace.a,Math.sqrt(12.5));
  r=runMathLabScript("z=complex(0,2)\na=rms([z 0])");
  assert.equal(r.ok,true);
  approx(r.workspace.a,Math.sqrt(2));
});

test("Math Lab detrend removes an affine trend",()=>{
  const r=runMathLabScript("y=detrend([3 5 7 9])");
  assert.equal(r.ok,true);
  r.workspace.y[0].forEach(v=>approx(v,0,1e-12));
});

test("Math Lab detrend preserves deviations around the fitted trend",()=>{
  const r=runMathLabScript("y=detrend([0 2 1 6])");
  assert.equal(r.ok,true);
  approx(r.workspace.y[0].reduce((a,b)=>a+b,0),0,1e-12);
});

test("Math Lab deconv validates leading divisor coefficient",()=>{
  const r=runMathLabScript("q=deconv([1 2 3],[0 1])");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_DIVISOR");
});

test("Math Lab rejects more than two built-in deconv outputs",()=>{
  const r=runMathLabScript("[q,r,x]=deconv([1 2],[1 1])");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"TOO_MANY_OUTPUTS");
});
