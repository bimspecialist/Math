import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

function approx(actual,expected,tolerance=1e-7){
  assert.ok(Math.abs(actual-expected)<=tolerance,`expected ${actual} ~= ${expected}`);
}
function asComplex(value){return typeof value==="number"?{re:value,im:0}:value}

test("Math Lab roots solves cubic polynomials",()=>{
  const r=runMathLabScript("r=roots([1 -6 11 -6])");
  assert.equal(r.ok,true);
  const roots=r.workspace.r[0].map(asComplex);
  assert.equal(roots.length,3);
  approx(roots[0].re,1); approx(roots[1].re,2); approx(roots[2].re,3);
  roots.forEach(z=>approx(z.im,0,1e-7));
});

test("Math Lab roots solves quartics with complex roots",()=>{
  const r=runMathLabScript("r=roots([1 0 0 0 1])");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.r[0].length,4);
  for(const root of r.workspace.r[0]){
    const z=asComplex(root);
    approx(Math.hypot(z.re,z.im),1,1e-6);
    const angle=4*Math.atan2(z.im,z.re);
    approx(Math.cos(angle),-1,1e-5);
  }
});

test("Math Lab convolution supports real signals",()=>{
  const r=runMathLabScript("y=conv([1 2 3],[1 1])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.y,[[1,3,5,3]]);
});

test("Math Lab convolution supports complex signals",()=>{
  const r=runMathLabScript("z=complex(0,1)\ny=conv([1 z],[1 -1])\nr=real(y)\ni=imag(y)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.r,[[1,-1,0]]);
  assert.deepEqual(r.workspace.i,[[0,1,-1]]);
});

test("Math Lab fftshift and ifftshift round-trip odd and even vectors",()=>{
  let r=runMathLabScript("x=[1 2 3 4]\ny=ifftshift(fftshift(x))");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.y,[[1,2,3,4]]);
  r=runMathLabScript("x=[1 2 3 4 5]\ny=ifftshift(fftshift(x))");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.y,[[1,2,3,4,5]]);
});

test("Math Lab moving mean uses shrinking endpoints",()=>{
  const r=runMathLabScript("y=movmean([1 2 3 4 5],3)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.y,[[1.5,2,3,4,4.5]]);
});

test("Math Lab autocorrelation produces expected symmetric real result",()=>{
  const r=runMathLabScript("r=xcorr([1 2])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.r,[[2,5,2]]);
});

test("Math Lab polynomial degree guard prevents runaway solves",()=>{
  const coefficients="["+Array.from({length:22},(_,i)=>i===0?1:0).join(" ")+"]";
  const r=runMathLabScript("r=roots("+coefficients+")");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"POLYNOMIAL_DEGREE_TOO_LARGE");
});
