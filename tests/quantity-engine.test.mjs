import test from "node:test";
import assert from "node:assert/strict";
import { evaluateQuantityExpression, evaluateAndConvertQuantity } from "../src/science/quantity-engine.js";

const near=(a,b,t=1e-12)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);

test("quantity engine computes compound SI dimensions",()=>{
  const r=evaluateQuantityExpression("20 m / 4 s");
  assert.equal(r.kind,"quantity");near(r.siValue,5);assert.equal(r.dimension,"L T^-1");
});

test("quantity engine converts compound units safely",()=>{
  const r=evaluateAndConvertQuantity("20 m / 4 s","mph");
  assert.equal(r.kind,"quantity-conversion");near(r.value,11.18468146027201,1e-12);
});

test("quantity engine handles force energy pressure and power",()=>{
  near(evaluateAndConvertQuantity("1000 N","kN").value,1);
  near(evaluateAndConvertQuantity("5 kN * 2 m","kJ").value,10);
  near(evaluateAndConvertQuantity("2000 N / (2 m^2)","kPa").value,1);
  near(evaluateAndConvertQuantity("3600000 J / 1 h","kW").value,1);
});

test("quantity engine rejects dimensionally invalid addition",()=>{
  const r=evaluateQuantityExpression("2 m + 3 s");
  assert.equal(r.kind,"error");assert.equal(r.code,"DIMENSION_MISMATCH");
});

test("quantity engine preserves dimensional powers",()=>{
  const r=evaluateQuantityExpression("(3 m)^2");
  assert.equal(r.kind,"quantity");near(r.siValue,9);assert.equal(r.dimension,"L^2");
});
