import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript, describeMathLabValue } from "../src/mathlab/math-lab-engine.js";

function approx(actual,expected,tolerance=1e-9){
  assert.ok(Math.abs(actual-expected)<=tolerance,`expected ${actual} ~= ${expected}`);
}

test("Math Lab creates and inspects complex scalars",()=>{
  const r=runMathLabScript("z=complex(3,4)\na=abs(z)\np=angle(z)\nr=real(z)\ni=imag(z)\nc=conj(z)");
  assert.equal(r.ok,true);
  approx(r.workspace.a,5);
  approx(r.workspace.r,3);
  approx(r.workspace.i,4);
  approx(r.workspace.p,Math.atan2(4,3));
  assert.equal(r.workspace.c.__mathlabComplex,true);
  assert.equal(r.workspace.c.re,3);
  assert.equal(r.workspace.c.im,-4);
});

test("Math Lab supports scalar complex arithmetic",()=>{
  const r=runMathLabScript("z=complex(1,2)\nw=complex(3,-1)\na=z+w\nb=z*w\nc=z/w\nd=sqrt(-1)");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.a.__mathlabComplex,true);
  approx(r.workspace.a.re,4); approx(r.workspace.a.im,1);
  approx(r.workspace.b.re,5); approx(r.workspace.b.im,5);
  approx(r.workspace.c.re,0.1); approx(r.workspace.c.im,0.7);
  assert.equal(r.workspace.d.__mathlabComplex,true);
  approx(r.workspace.d.re,0,1e-12); approx(r.workspace.d.im,1,1e-12);
});

test("Math Lab supports complex values inside arrays",()=>{
  const r=runMathLabScript("z=complex(0,1)\nA=[1 z]\nB=A.*A\nR=real(B)\nI=imag(B)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.R,[[1,-1]]);
  assert.deepEqual(r.workspace.I,[[0,0]]);
});

test("Math Lab FFT and IFFT round-trip real signals",()=>{
  const r=runMathLabScript("x=[1 2 3 4]\nX=fft(x)\ny=ifft(X)\nr=real(y)\ni=imag(y)");
  assert.equal(r.ok,true);
  const rr=r.workspace.r[0],ii=r.workspace.i[0];
  [1,2,3,4].forEach((v,i)=>approx(rr[i],v,1e-9));
  ii.forEach(v=>approx(v,0,1e-9));
});

test("Math Lab FFT produces expected spectrum for an impulse",()=>{
  const r=runMathLabScript("X=fft([1 0 0 0])\nr=real(X)\ni=imag(X)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.r,[[1,1,1,1]]);
  r.workspace.i[0].forEach(v=>approx(v,0,1e-12));
});

test("Math Lab complex exp log sin cos are internally consistent",()=>{
  const r=runMathLabScript("z=complex(0.5,-0.25)\nw=exp(log(z))\ns=sin(z)\nc=cos(z)");
  assert.equal(r.ok,true);
  approx(r.workspace.w.re,0.5,1e-9);
  approx(r.workspace.w.im,-0.25,1e-9);
  assert.equal(r.workspace.s.__mathlabComplex,true);
  assert.equal(r.workspace.c.__mathlabComplex,true);
});

test("Math Lab workspace metadata identifies complex values",()=>{
  const r=runMathLabScript("z=complex(2,-3)\nA=[z 1]");
  assert.equal(r.ok,true);
  const z=describeMathLabValue(r.workspace.z);
  const A=describeMathLabValue(r.workspace.A);
  assert.equal(z.className,"complex");
  assert.equal(A.className,"complex");
  assert.match(z.preview,/2-3i/);
});
