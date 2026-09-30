import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("Math Lab supports indexed scalar assignment",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nA(2,1)=9\nA");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,2],[9,4]]);
});

test("Math Lab supports slice assignment with scalar expansion",()=>{
  const r=runMathLabScript("A=[1 2 3;4 5 6;7 8 9]\nA(:,2)=0\nA(2:end,3)=5");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,0,3],[4,0,5],[7,0,5]]);
});

test("Math Lab supports matrix slice assignment with shape checking",()=>{
  let r=runMathLabScript("A=zeros(2,2)\nA(:,1:2)=[1 2;3 4]");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,2],[3,4]]);

  r=runMathLabScript("A=zeros(2,2)\nA(:,1:2)=[1 2]");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INDEX_ASSIGNMENT_SHAPE_MISMATCH");
});

test("Math Lab supports linear indexed assignment in column-major order",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nA(2)=8\nA(3)=9");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,9],[8,4]]);
});

test("Math Lab supports multiple statements per line and semicolon suppression",()=>{
  const r=runMathLabScript("a=1; b=2; c=a+b\nc");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.a,1);
  assert.equal(r.workspace.b,2);
  assert.equal(r.workspace.c,3);
  assert.equal(r.outputs.length,2);
  assert.equal(r.outputs[0].name,"c");
  assert.equal(r.outputs[1].value,3);
});

test("Math Lab supports inline percent comments",()=>{
  const r=runMathLabScript("a=5; % keep a hidden\nb=a+2 % visible result");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.a,5);
  assert.equal(r.workspace.b,7);
  assert.equal(r.outputs.length,1);
});

test("Math Lab supports user functions with local workspace scope",()=>{
  const script=`function y = squarePlusOne(x)
y = x.^2 + 1;
end
A=[1 2 3]
B=squarePlusOne(A)`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,2,3]]);
  assert.deepEqual(r.workspace.B,[[2,5,10]]);
  assert.equal(Object.hasOwn(r.workspace,"x"),false);
  assert.equal(Object.hasOwn(r.workspace,"y"),false);
});

test("Math Lab user functions accept multiple arguments",()=>{
  const script=`function y = blend(a,b)
y = a.*2 + b;
end
A=[1 2]
B=[10 20]
C=blend(A,B)`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.C,[[12,24]]);
});

test("Math Lab validates function definitions and outputs",()=>{
  let r=runMathLabScript("function y = f(x)\ny=x+1");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"FUNCTION_END_REQUIRED");

  r=runMathLabScript("function y = f(x)\nz=x+1;\nend\na=f(2)");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"FUNCTION_OUTPUT_NOT_ASSIGNED");
});

test("Math Lab rejects indexed assignment to undefined variables",()=>{
  const r=runMathLabScript("A(1)=2");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"UNDEFINED_VARIABLE");
});
