import test from "node:test";
import assert from "node:assert/strict";
import { solveAdvancedInput } from "../src/advanced/advanced-solver.js";
import { calculateRamp, calculateRampFromSlope } from "../src/construction/ramp-calculator.js";

const nearRelative=(actual,expected,tolerance=1e-10)=>{
  assert.ok(Number.isFinite(actual),`non-finite result: ${actual}`);
  assert.ok(Math.abs(actual-expected)<=Math.abs(expected)*tolerance,`${actual} != ${expected}`);
};

test("quadratic solver retains small nonzero roots instead of rounding them to zero",()=>{
  const result=solveAdvancedInput("x^2-100000000*x+1=0");
  assert.equal(result.kind,"solution-set");
  assert.equal(result.solutions.length,2);
  const [small,large]=result.solutions;
  assert.ok(typeof small==="number"&&small>0,`small root lost: ${small}`);
  nearRelative(small,1e-8,1e-7);
  nearRelative(large,100000000,1e-14);
  nearRelative(small*large,1,1e-7);
});

test("quadratic solver keeps close but distinct real roots distinct",()=>{
  const result=solveAdvancedInput("x^2-2*x+0.9999999999=0");
  assert.equal(result.kind,"solution-set");
  assert.equal(result.solutions.length,2);
  const [small,large]=result.solutions;
  assert.ok(small<1&&large>1);
  assert.ok(Math.abs((large-small)-2e-5)<1e-9);
});

test("quadratic normal cases and genuine repeated roots keep existing meaning",()=>{
  const real=solveAdvancedInput("x^2-4=0");
  assert.deepEqual(real.solutions,[-2,2]);
  const repeated=solveAdvancedInput("x^2+2*x+1=0");
  assert.deepEqual(repeated.solutions,[-1]);
  const complex=solveAdvancedInput("x^2+1=0");
  assert.deepEqual(complex.solutions,["-i","i"]);
});

test("ramp solver derives finite run and rise from valid very large dimensions",()=>{
  const run=calculateRamp({rise:3e200,length:5e200});
  const rise=calculateRamp({run:4e200,length:5e200});
  nearRelative(run.run,4e200);
  nearRelative(rise.rise,3e200);
  nearRelative(run.gradePercent,75);
  nearRelative(rise.ratioRun,4/3);
});

test("near-equal hypotenuse and side do not lose precision through squared subtraction",()=>{
  const length=1e12,rise=length-1;
  const expected=Math.sqrt((length-rise)*(length+rise));
  const result=calculateRamp({rise,length});
  nearRelative(result.run,expected,2e-12);
  assert.equal(result.derivedField,"run");
});

test("ramp inputs must be positive measurements, not coerced booleans",()=>{
  assert.throws(()=>calculateRamp({rise:true,run:4}),/INVALID_RAMP_VALUE/);
  assert.throws(()=>calculateRamp({rise:1,run:false,length:2}),/INVALID_RAMP_VALUE/);
  const valid=calculateRamp({rise:"3",run:"4"});
  assert.equal(valid.length,5);
  assert.equal(calculateRampFromSlope({rise:1,slopeType:"ratio",slopeValue:12}).run,12);
});
