import test from "node:test";
import assert from "node:assert/strict";
import { evaluateExpression } from "../src/calculator/math-engine.js";
import { evaluateComplexExpression } from "../src/calculator/complex-engine.js";

const real=(s,mode="RAD")=>evaluateExpression(s,{angleMode:mode,ans:"0"});
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);

test("scientific accuracy: trigonometric identities remain stable",()=>{
  for(const x of [-3,-1.5,-0.25,0,0.2,1,2.5,6]){
    const r=real(`sin(${x})^2+cos(${x})^2`);
    assert.equal(r.kind,"value");
    near(r.numeric,1,1e-12);
  }
});

test("scientific accuracy: exp and ln round-trip across scales",()=>{
  for(const x of [1e-9,1e-3,0.1,1,10,1e3,1e9]){
    const r=real(`exp(ln(${x}))`);
    assert.equal(r.kind,"value");
    near(r.numeric,x,2e-12);
  }
});

test("scientific accuracy: gamma matches factorial on positive integers",()=>{
  let fact=1;
  for(let n=1;n<=10;n++){
    if(n>1)fact*=n-1;
    near(real(`gamma(${n})`).numeric,fact,2e-11);
  }
});

test("scientific accuracy: normal CDF symmetry and PDF normalization anchors",()=>{
  near(real("normalcdf(0)").numeric,0.5,1e-7);
  for(const x of [0.1,0.5,1,2,3]){
    const p=real(`normalcdf(${x})`).numeric;
    const q=real(`normalcdf(-${x})`).numeric;
    near(p+q,1,2e-7);
  }
  near(real("normalpdf(0)").numeric,1/Math.sqrt(2*Math.PI),1e-12);
});

test("scientific accuracy: binomial probability mass sums to one",()=>{
  let total=0;
  for(let k=0;k<=12;k++)total+=real(`binompdf(${k},12,0.37)`).numeric;
  near(total,1,1e-12);
});

test("scientific accuracy: Poisson probability mass captures expected total",()=>{
  let total=0;
  for(let k=0;k<=40;k++)total+=real(`poissonpdf(${k},4.2)`).numeric;
  near(total,1,1e-10);
});

test("scientific accuracy: numerical calculus matches analytic references",()=>{
  near(real("deriv(exp(X),1)").numeric,Math.E,2e-7);
  near(real("deriv(sin(X),0)").numeric,1,2e-8);
  near(real("integral(exp(-X^2),-3,3)").numeric,1.772414696519042,2e-9);
  near(real("integral(1/(1+X^2),0,1)").numeric,Math.PI/4,2e-10);
});

test("scientific accuracy: complex Euler identity and conjugation laws",()=>{
  let z=evaluateComplexExpression("exp(i*pi)+1");
  assert.equal(z.kind,"complex");
  near(z.re,0,1e-12);near(z.im,0,1e-12);
  z=evaluateComplexExpression("conj((2+3i)*(4-i))");
  const w=evaluateComplexExpression("conj(2+3i)*conj(4-i)");
  near(z.re,w.re,1e-12);near(z.im,w.im,1e-12);
});

test("scientific accuracy: physical constants preserve published exact anchors",()=>{
  assert.equal(real("c0").numeric,299792458);
  assert.equal(real("qe").numeric,1.602176634e-19);
  assert.equal(real("kb").numeric,1.380649e-23);
  assert.equal(real("na").numeric,6.02214076e23);
  assert.equal(real("g0").numeric,9.80665);
});
