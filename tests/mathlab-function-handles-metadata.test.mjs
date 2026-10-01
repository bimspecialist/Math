import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript, describeMathLabValue } from "../src/mathlab/math-lab-engine.js";

test("Math Lab supports anonymous function handles",()=>{
  const r=runMathLabScript("a=3;\nf=@(x) x.^2+a;\ny=f([1 2 3])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.y,[[4,7,12]]);
  assert.equal(describeMathLabValue(r.workspace.f).className,"function_handle");
});

test("Anonymous handles capture creation workspace",()=>{
  const r=runMathLabScript("a=2;\nf=@(x) x+a;\na=10;\ny=f(3)");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.y,5);
});

test("Anonymous handles can take multiple arguments",()=>{
  const r=runMathLabScript("f=@(x,y) x.*y+1;\nz=f([1 2],[3 4])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.z,[[4,9]]);
});

test("User functions expose nargin and nargout",()=>{
  const script=`function [a,b] = meta(x,y)
a=nargin;
b=nargout;
end
[p,q]=meta(10,20)`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,true);
  assert.equal(r.workspace.p,2);
  assert.equal(r.workspace.q,2);
});

test("Single-output request sets nargout to one",()=>{
  const script=`function [a,b] = meta(x)
a=nargout;
b=99;
end
p=meta(10)`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,true);
  assert.equal(r.workspace.p,1);
});

test("Math Lab supports no-output functions",()=>{
  const script=`function show(x)
y=x+1;
end
show(5)
a=2`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,true);
  assert.equal(r.workspace.a,2);
});

test("No-output functions cannot be used as values",()=>{
  const script=`function show(x)
y=x+1;
end
a=show(5)`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"FUNCTION_HAS_NO_OUTPUT");
});
