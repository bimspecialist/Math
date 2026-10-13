import test from "node:test";
import assert from "node:assert/strict";
import { evaluateQuantityExpression, evaluateAndConvertQuantity } from "../src/science/quantity-engine.js";

function expectValue(expression, expected, dimension="1"){
  const result=evaluateQuantityExpression(expression);
  assert.equal(result.kind,"quantity",expression+": "+JSON.stringify(result));
  assert.ok(Math.abs(result.siValue-expected)<=1e-12*Math.max(1,Math.abs(expected)),expression+": "+result.siValue+" != "+expected);
  assert.equal(result.dimension,dimension,expression);
}

test("negative sign has lower precedence than exponentiation",()=>{
  expectValue("-2^2",-4);
  expectValue("(-2)^2",4);
  expectValue("-3 m^2",-3,"L^2");
  expectValue("(-3 m)^2",9,"L^2");
});

test("power chains are evaluated right-to-left, matching Scientific Calculator",()=>{
  expectValue("2^3^2",512);
  expectValue("(2^3)^2",64);
  expectValue("2^-2^2",1/16);
  expectValue("2^(-2)^2",16);
});

test("unit exponents and negative exponents keep dimension integrity",()=>{
  expectValue("4 m^-2",4,"L^-2");
  expectValue("-(2 m)^2",-4,"L^2");
  expectValue("2 m^2",2,"L^2");
  expectValue("(-2 m)^2",4,"L^2");
  const derived=evaluateAndConvertQuantity("20 m / 4 s","mph");
  assert.equal(derived.kind,"quantity-conversion");
  assert.ok(Math.abs(derived.value-11.18468146027201)<1e-10);
});

test("dimensioned exponent and noninteger dimensional power remain guarded",()=>{
  assert.deepEqual(evaluateQuantityExpression("2^(3 m)"),{kind:"error",code:"DIMENSIONAL_EXPONENT"});
  assert.deepEqual(evaluateQuantityExpression("m^0.5"),{kind:"error",code:"NONINTEGER_DIMENSION_POWER"});
  assert.deepEqual(evaluateQuantityExpression("0^-1"),{kind:"error",code:"DOMAIN_ERROR"});
});
