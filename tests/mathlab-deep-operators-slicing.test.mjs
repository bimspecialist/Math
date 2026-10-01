import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("Math Lab supports scalar expansion with matrices",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nA+2\n2-A\nA*3");
  assert.equal(r.ok,true);
  assert.deepEqual(r.outputs[1].value,[[3,4],[5,6]]);
  assert.deepEqual(r.outputs[2].value,[[1,0],[-1,-2]]);
  assert.deepEqual(r.outputs[3].value,[[3,6],[9,12]]);
});

test("Math Lab distinguishes matrix multiplication from element-wise multiplication",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nB=[5 6;7 8]\nA*B\nA.*B");
  assert.equal(r.ok,true);
  assert.deepEqual(r.outputs[2].value,[[19,22],[43,50]]);
  assert.deepEqual(r.outputs[3].value,[[5,12],[21,32]]);
});

test("Math Lab supports element-wise division and power",()=>{
  const r=runMathLabScript("A=[1 2;4 8]\nB=[1 2;2 4]\nA./B\nA.^2\n2.^B");
  assert.equal(r.ok,true);
  assert.deepEqual(r.outputs[2].value,[[1,1],[2,2]]);
  assert.deepEqual(r.outputs[3].value,[[1,4],[16,64]]);
  assert.deepEqual(r.outputs[4].value,[[2,4],[4,16]]);
});

test("Math Lab supports matrix powers including zero and negative one",()=>{
  let r=runMathLabScript("A=[1 2;3 4]\nA^2\nA^0");
  assert.equal(r.ok,true);
  assert.deepEqual(r.outputs[1].value,[[7,10],[15,22]]);
  assert.deepEqual(r.outputs[2].value,[[1,0],[0,1]]);

  r=runMathLabScript("A=[4 7;2 6]\nA^-1");
  assert.equal(r.ok,true);
  assert.ok(Math.abs(r.outputs[1].value[0][0]-0.6)<1e-12);
  assert.ok(Math.abs(r.outputs[1].value[0][1]+0.7)<1e-12);
  assert.ok(Math.abs(r.outputs[1].value[1][0]+0.2)<1e-12);
  assert.ok(Math.abs(r.outputs[1].value[1][1]-0.4)<1e-12);
});

test("Math Lab supports transpose postfix operators",()=>{
  const r=runMathLabScript("A=[1 2 3;4 5 6]\nA'\nA.'");
  assert.equal(r.ok,true);
  assert.deepEqual(r.outputs[1].value,[[1,4],[2,5],[3,6]]);
  assert.deepEqual(r.outputs[2].value,[[1,4],[2,5],[3,6]]);
});

test("Math Lab supports advanced end-based slicing",()=>{
  const r=runMathLabScript("A=[1 2 3;4 5 6;7 8 9]\nA(2:end,2:end)\nA(:,end)\nA(end,:)\nA(end,end)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.outputs[1].value,[[5,6],[8,9]]);
  assert.deepEqual(r.outputs[2].value,[[3],[6],[9]]);
  assert.deepEqual(r.outputs[3].value,[[7,8,9]]);
  assert.equal(r.outputs[4].value,9);
});

test("Math Lab validates incompatible matrix operations",()=>{
  let r=runMathLabScript("A=[1 2 3]\nB=[1 2;3 4]\nA+B");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"MATRIX_DIMENSION_MISMATCH");

  r=runMathLabScript("A=[1 2 3;4 5 6]\nA^2");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"SQUARE_MATRIX_REQUIRED");
});

test("Math Lab supports matrix right division",()=>{
  const r=runMathLabScript("A=[1 0;0 1]\nB=[2 0;0 4]\nA/B");
  assert.equal(r.ok,true);
  assert.deepEqual(r.outputs[2].value,[[0.5,0],[0,0.25]]);
});
