import test from "node:test";
import assert from "node:assert/strict";
import { solveAdvancedInput } from "../src/advanced/advanced-solver.js";

test("advanced solver evaluates a typed numeric expression",()=>{
  const r=solveAdvancedInput("2^3+4");
  assert.equal(r.kind,"value");
  assert.equal(r.numeric,12);
});

test("advanced solver solves a one-variable equation",()=>{
  const r=solveAdvancedInput("x^2-4=0");
  assert.equal(r.kind,"solution");
  assert.equal(r.variable,"x");
  assert.ok(Math.abs(Math.abs(r.value)-2)<1e-8);
});

test("advanced solver rejects underdetermined multi-variable equations clearly",()=>{
  const r=solveAdvancedInput("x^3+y^2+5=0");
  assert.deepEqual(r,{kind:"error",code:"MULTIPLE_VARIABLES",variables:["x","y"]});
});

test("advanced solver accepts calculator multiplication and division glyphs",()=>{
  const r=solveAdvancedInput("6×7÷2");
  assert.equal(r.kind,"value");
  assert.equal(r.numeric,21);
});
