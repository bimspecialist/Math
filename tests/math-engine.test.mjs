import test from "node:test";
import assert from "node:assert/strict";
import { evaluateExpression } from "../src/calculator/math-engine.js";
import { formatExactDecimal } from "../src/calculator/result-format.js";
const evalv = (s, angleMode="DEG", ans="0") => evaluateExpression(s,{angleMode,ans});
test("operator precedence is deterministic", () => { assert.equal(evalv("2+3*4").numeric, 14); });
test("degree and radian trig differ and sin 30deg is 0.5", () => {
  assert.ok(Math.abs(evalv("sin(30)","DEG").numeric - 0.5) < 1e-12);
  assert.notEqual(evalv("sin(1)","DEG").numeric, evalv("sin(1)","RAD").numeric);
});
test("factorial and nCr nPr work", () => {
  assert.equal(evalv("5!").numeric, 120); assert.equal(evalv("nCr(5,2)").numeric, 10); assert.equal(evalv("nPr(5,2)").numeric, 20);
});
test("roots work", () => { assert.equal(evalv("sqrt(81)").numeric, 9); assert.equal(evalv("root(3,27)").numeric, 3); });
test("division by zero and domain errors are explicit", () => {
  assert.deepEqual(evalv("1/0"), {kind:"error",code:"DIVISION_BY_ZERO"});
  assert.deepEqual(evalv("sqrt(-1)"), {kind:"error",code:"DOMAIN_ERROR"});
});
test("Ans is a calculation context value", () => { assert.equal(evalv("Ans+2","DEG","5").numeric, 7); });
test("rational-only arithmetic preserves exact result", () => {
  const r = evalv("1/2+1/3"); assert.equal(r.exact, "5/6");
  assert.equal(formatExactDecimal(r,"EXACT"), "5/6"); assert.equal(formatExactDecimal(r,"DECIMAL"), String(5/6));
});

test("SHIFT log and ln engine functions are evaluable", () => {
  assert.equal(evalv("pow10(2)").numeric, 100);
  assert.ok(Math.abs(evalv("exp(1)").numeric - Math.E) < 1e-12);
});


test("lecture-style implicit multiplication is accepted", () => {
  assert.ok(Math.abs(evalv("2π").numeric - 2*Math.PI) < 1e-12);
  assert.equal(evalv("3(4+5)").numeric, 27);
  assert.equal(evalv("(2+3)(4+5)").numeric, 45);
  assert.ok(Math.abs(evalv("2sin(30)","DEG").numeric - 1) < 1e-12);
});

test("calculator accepts common percent and superscript notation", () => {
  assert.equal(evalv("50%").numeric, 0.5);
  assert.equal(evalv("200*10%").numeric, 20);
  assert.equal(evalv("5²").numeric, 25);
  assert.equal(evalv("2³").numeric, 8);
});

test("unary minus follows calculator power precedence", () => {
  assert.equal(evalv("-2^2").numeric, -4);
  assert.equal(evalv("(-2)^2").numeric, 4);
});
