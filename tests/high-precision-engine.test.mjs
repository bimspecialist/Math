import test from "node:test";
import assert from "node:assert/strict";
import { evaluateExactExpression } from "../src/science/high-precision-engine.js";

test("exact engine preserves huge integer arithmetic beyond IEEE-754",()=>{
  const r=evaluateExactExpression("9007199254740993 + 9007199254740993");
  assert.equal(r.kind,"exact");assert.equal(r.fraction,"18014398509481986");
});

test("exact engine preserves decimal fractions exactly",()=>{
  const r=evaluateExactExpression("0.1 + 0.2");
  assert.equal(r.fraction,"3/10");assert.equal(r.decimal,"0.3");
});

test("exact engine handles long rational expansions",()=>{
  const r=evaluateExactExpression("1/7",{digits:60});
  assert.equal(r.fraction,"1/7");
  assert.match(r.decimal,/^0\.142857142857142857142857/);
});

test("exact engine supports large integer powers without floating overflow",()=>{
  const r=evaluateExactExpression("2^200");
  assert.equal(r.fraction,"1606938044258990275541962092341162602522202993782792835301376");
});
