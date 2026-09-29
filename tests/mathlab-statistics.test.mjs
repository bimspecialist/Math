import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("Math Lab computes inclusive linear percentiles and quartiles",()=>{
  const r=runMathLabScript("v = [1,2,3,4]\npercentile(v,25)\nprctile(v,90)\nquartile(v,2)\nquartile(v,3)");
  assert.equal(r.ok,true);
  assert.equal(r.outputs[1].value,1.75);
  assert.ok(Math.abs(r.outputs[2].value-3.7)<1e-12);
  assert.equal(r.outputs[3].value,2.5);
  assert.equal(r.outputs[4].value,3.25);
});

test("Math Lab cumulative sum preserves input order",()=>{
  const r=runMathLabScript("v = [1,2,3,4]\ncumsum(v)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.outputs[1].value,[1,3,6,10]);
});

test("Math Lab validates percentile and quartile bounds",()=>{
  const p=runMathLabScript("percentile([1,2,3],101)");
  assert.equal(p.ok,false);
  assert.equal(p.error.message,"INVALID_PERCENTILE");

  const q=runMathLabScript("quartile([1,2,3],5)");
  assert.equal(q.ok,false);
  assert.equal(q.error.message,"INVALID_QUARTILE");
});
