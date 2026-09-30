import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("Math Lab supports MATLAB-style semicolon suppression while preserving workspace state",()=>{
  const r=runMathLabScript("a = 5;\nb = a^2 + 3;\nb");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.a,5);
  assert.equal(r.workspace.b,28);
  assert.equal(r.outputs.length,1);
  assert.equal(r.outputs[0].value,28);
});

test("Math Lab maintains ans for unassigned expressions, including suppressed expressions",()=>{
  const r=runMathLabScript("2 + 3;\nans * 4\nans");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.ans,20);
  assert.equal(r.outputs.length,2);
  assert.equal(r.outputs[0].value,20);
  assert.equal(r.outputs[1].value,20);
});

test("Math Lab supports nested function calls",()=>{
  const r=runMathLabScript("mean(linspace(1,9,5))\nnorm(cross([1,0,0],[0,1,0]))");
  assert.equal(r.ok,true);
  assert.equal(r.outputs[0].value,5);
  assert.equal(r.outputs[1].value,1);
});

test("Math Lab accepts MATLAB-style whitespace matrix rows as well as comma syntax",()=>{
  const r=runMathLabScript("A = [1 2; 3 4]\ndet(A)\ntranspose(A)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,2],[3,4]]);
  assert.equal(r.outputs[1].value,-2);
  assert.deepEqual(r.outputs[2].value,[[1,3],[2,4]]);
});

test("Math Lab reports unknown function calls without recursive failure",()=>{
  const r=runMathLabScript("notAFunction(2)");
  assert.equal(r.ok,false);
  assert.ok(r.error.message);
  assert.equal(r.error.line,1);
});
