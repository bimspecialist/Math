import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("Math Lab prctile follows MATLAB midpoint percentile semantics",()=>{
  const r=runMathLabScript("a = [1,2,3,4,5]\nprctile(a,25)\nb = [1,2,3,4]\nprctile(b,25)\nprctile(b,90)");
  assert.equal(r.ok,true);
  assert.equal(r.outputs[1].value,1.75);
  assert.equal(r.outputs[3].value,1.5);
  assert.equal(r.outputs[4].value,4);
});

test("Math Lab quantile uses the same midpoint method on a 0 to 1 scale",()=>{
  const r=runMathLabScript("a = [1,2,3,4,5]\nquantile(a,0.25)\nquantile(a,0.75)");
  assert.equal(r.ok,true);
  assert.equal(r.outputs[1].value,1.75);
  assert.equal(r.outputs[2].value,4.25);
});

test("Math Lab validates percentile and quantile ranges",()=>{
  const p=runMathLabScript("prctile([1,2,3],101)");
  assert.equal(p.ok,false);
  assert.equal(p.error.message,"INVALID_PERCENTILE");
  const q=runMathLabScript("quantile([1,2,3],1.1)");
  assert.equal(q.ok,false);
  assert.equal(q.error.message,"INVALID_QUANTILE");
});
