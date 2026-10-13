import test from "node:test";
import assert from "node:assert/strict";
import { evaluateExpression } from "../src/calculator/math-engine.js";

// Independent 65–80-digit combinatorial references calculated using
// Python's exact integer math.comb and Decimal (not this JS implementation).
const calculate=expression=>evaluateExpression(expression,{angleMode:"RAD",ans:"0"});
function near(actual,expected,relativeTolerance=5e-10){
  assert.ok(Number.isFinite(actual),`expected finite probability, got ${actual}`);
  assert.ok(actual>=0&&actual<=1,`out-of-range probability: ${actual}`);
  assert.ok(Math.abs(actual-expected)<=relativeTolerance*Math.abs(expected),`${actual} != ${expected}`);
}

test("large binomial central PDF remains finite rather than Infinity times zero",()=>{
  const r=calculate("binompdf(500,1000,0.5)");
  assert.equal(r.kind,"value");
  near(r.numeric,0.02522501817836080190684168876210245);
});

test("the binomial CDF at the exact center keeps the discrete half-mass",()=>{
  const p=0.02522501817836080190684168876210245;
  const r=calculate("binomcdf(500,1000,0.5)");
  assert.equal(r.kind,"value");
  near(r.numeric,(1+p)/2);
  const below=calculate("binomcdf(499,1000,0.5)");
  assert.equal(below.kind,"value");
  near(below.numeric,(1-p)/2);
  near(r.numeric-below.numeric,p);
});

test("small lower tails remain positive and accurate without 1-CDF cancellation",()=>{
  const r=calculate("binomcdf(70,1000,0.1)");
  assert.equal(r.kind,"value");
  near(r.numeric,0.0005744958408379692588112876422583122,1e-8);
  const atMean=calculate("binompdf(100,1000,0.1)");
  assert.equal(atMean.kind,"value");
  near(atMean.numeric,0.042016790861085438383464852751722,1e-8);
});

test("larger classroom and research-sized experiments do not overflow combinatorics",()=>{
  const r=calculate("binompdf(5000,10000,0.5)");
  assert.equal(r.kind,"value");
  near(r.numeric,0.0079786461393821537604401495222799765,1e-8);
});

test("boundary probabilities and support remain mathematically correct",()=>{
  for(const [expression,expected] of [
    ["binompdf(0,0,0)",1],
    ["binompdf(0,0,1)",1],
    ["binompdf(0,1000,0)",1],
    ["binompdf(1000,1000,1)",1],
    ["binomcdf(0,1000,0)",1],
    ["binomcdf(999,1000,1)",0],
    ["binomcdf(1000,1000,1)",1],
    ["binomcdf(1500,1000,0.4)",1],
    ["binomcdf(0,1000,0.5)",9.332636185032188789900895447238172e-302]
  ]){
    const r=calculate(expression);
    assert.equal(r.kind,"value",expression);
    if(expected===0||expected===1)assert.equal(r.numeric,expected,expression);
    else near(r.numeric,expected,2e-9);
  }
});

test("invalid distribution parameters still raise explicit domain errors",()=>{
  for(const expression of [
    "binompdf(3,2,0.5)",
    "binompdf(1,10,-0.2)",
    "binompdf(1,10,1.2)",
    "binomcdf(-1,10,0.5)",
    "binomcdf(2.5,10,0.5)",
    "binompdf(3,3.2,0.5)"
  ]){
    assert.deepEqual(calculate(expression),{kind:"error",code:"DOMAIN_ERROR"},expression);
  }
});

test("extremely large binomial experiments retain centered PMF precision",()=>{
  // Independent 80-digit Stirling series reference, with error below 1e-16
  // relative at n>=1e10; exact finite combinatorial PMFs must not drift.
  const samples=[
    ["binompdf(5000000000,10000000000,0.5)",7.978845607829182418600698248970485e-6],
    ["binompdf(500000000000,1000000000000,0.5)",7.978845608026658847396914284636863e-7],
    ["binompdf(200000000000,1000000000000,0.2)",9.973557010031453517306761782945152e-7]
  ];
  for(const [expression,expected] of samples){
    const r=calculate(expression);
    assert.equal(r.kind,"value",expression);
    near(r.numeric,expected,5e-10);
  }
});
