import test from "node:test";
import assert from "node:assert/strict";
import { evaluateComplexExpression, formatComplex } from "../src/calculator/complex-engine.js";

const z=s=>evaluateComplexExpression(s);
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);

test("complex arithmetic supports rectangular notation and i",()=>{
  let r=z("2+3i");
  assert.equal(r.kind,"complex");near(r.re,2);near(r.im,3);
  r=z("(2+3i)*(4-5i)");
  near(r.re,23);near(r.im,2);
  r=z("(1+i)/(1-i)");
  near(r.re,0);near(r.im,1);
});

test("complex powers roots and exponentials work",()=>{
  let r=z("i^2");near(r.re,-1);near(r.im,0);
  r=z("sqrt(-1)");near(r.re,0);near(r.im,1);
  r=z("exp(i*pi)");near(r.re,-1,1e-12);near(r.im,0,1e-12);
});

test("complex utility functions expose magnitude argument conjugate and parts",()=>{
  assert.equal(z("abs(3+4i)").display,"5");
  near(z("arg(i)").re,Math.PI/2);
  assert.equal(z("conj(2+3i)").display,"2-3i");
  assert.equal(z("re(2+3i)").display,"2");
  assert.equal(z("im(2+3i)").display,"3");
});

test("complex trig and hyperbolic functions are numerically consistent",()=>{
  const s=z("sin(i)");
  near(s.re,0,1e-12);near(s.im,Math.sinh(1),1e-12);
  const c=z("cos(i)");
  near(c.re,Math.cosh(1),1e-12);near(c.im,0,1e-12);
});

test("complex Ans is reusable",()=>{
  const r=evaluateComplexExpression("Ans^2",{ansRe:1,ansIm:1});
  near(r.re,0);near(r.im,2);
});

test("complex formatting remains readable",()=>{
  assert.equal(formatComplex({re:0,im:1}),"i");
  assert.equal(formatComplex({re:0,im:-1}),"-i");
  assert.equal(formatComplex({re:2,im:-3}),"2-3i");
});

test("complex failures are explicit",()=>{
  assert.equal(z("1/0").code,"DIVISION_BY_ZERO");
  assert.equal(z("unknown(1)").code,"UNSUPPORTED_OPERATION");
});
