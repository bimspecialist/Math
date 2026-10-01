import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("Math Lab supports switch case otherwise",()=>{
  let r=runMathLabScript("x=2;\nswitch x\ncase 1\ny=10;\ncase 2\ny=20;\notherwise\ny=30;\nend");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.y,20);

  r=runMathLabScript("x=9;\nswitch x\ncase [1 2 3]\ny=1;\notherwise\ny=0;\nend");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.y,0);
});

test("Math Lab switch supports membership-style numeric case vectors",()=>{
  const r=runMathLabScript("x=2;\nswitch x\ncase [1 2 3]\ny=7;\notherwise\ny=0;\nend");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.y,7);
});

test("Math Lab supports try catch recovery",()=>{
  const r=runMathLabScript("x=0;\ntry\ny=sqrt(-1);\ncatch\ny=99;\nend\nz=y+1");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.y,99);
  assert.equal(r.workspace.z,100);
});

test("Math Lab exposes catch metadata when requested",()=>{
  const r=runMathLabScript("try\ny=sqrt(-1);\ncatch ME\ny=5;\nend");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.y,5);
  assert.equal(r.workspace.ME.message,"DOMAIN_ERROR");
});

test("uncaught try errors still propagate",()=>{
  const r=runMathLabScript("try\ny=sqrt(-1);\nend");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"DOMAIN_ERROR");
});
