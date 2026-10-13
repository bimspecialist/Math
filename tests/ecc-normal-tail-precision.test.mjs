import test from "node:test";
import assert from "node:assert/strict";
import { evaluateExpression } from "../src/calculator/math-engine.js";

const value=expression=>{
  const r=evaluateExpression(expression,{angleMode:"RAD",ans:"0"});
  assert.equal(r.kind,"value",`${expression}: ${JSON.stringify(r)}`);
  return r.numeric;
};
const rel=(actual,expected,tolerance=5e-12)=>{
  assert.ok(Number.isFinite(actual)&&actual>0,`expected positive finite tail, got ${actual}`);
  assert.ok(Math.abs(actual/expected-1)<=tolerance,`${actual} != ${expected}`);
};

test("normal CDF preserves representable probabilities below 1e-15",()=>{
  for(const [x,expected] of [
    [-5,2.8665157187919458e-7],
    [-8,6.2209605742718194e-16],
    [-9,1.1285884059538422e-19],
    [-10,7.6198530241605928e-24],
    [-12,1.7764821120776790e-33]
  ])rel(value(`normalcdf(${x})`),expected,8e-11);
});

test("complementary error function does not subtract from rounded erf(large)",()=>{
  for(const [x,expected] of [
    [5,1.5374597944280349e-12],
    [8,1.1224297172982928e-29],
    [10,2.0884875837625448e-45]
  ])rel(value(`erfc(${x})`),expected,1e-10);
});

test("erf and normal CDF keep near-origin and moderate inputs precise",()=>{
  const cases=[
    ["erf(0.1)",0.1124629160182849],
    ["erf(1)",0.8427007929497149],
    ["erf(2)",0.9953222650189527],
    ["normalcdf(-2)",0.02275013194817921],
    ["normalcdf(2)",0.9772498680518208]
  ];
  for(const [expr,expected] of cases){
    const actual=value(expr);
    assert.ok(Math.abs(actual-expected)<=1e-12,`${expr}: ${actual} != ${expected}`);
  }
  assert.equal(value("normalcdf(0)"),0.5);
  assert.equal(value("erfc(0)"),1);
});

test("error function parity and erfc negative branch are consistent",()=>{
  const e=value("erf(2)");
  assert.ok(Math.abs(value("erf(-2)")+e)<1e-14);
  assert.ok(Math.abs(value("erfc(-2)")-(1+e))<1e-14);
  assert.ok(Math.abs(value("erfc(2)")-(1-e))<1e-14);
});
