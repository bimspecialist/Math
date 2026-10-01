import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("Math Lab applies unary math functions element-wise",()=>{
  const r=runMathLabScript("A=[-1 4;9 16]\nB=abs(A)\nC=sqrt(B)\nS=sin([0 pi/2])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.B,[[1,4],[9,16]]);
  assert.deepEqual(r.workspace.C,[[1,2],[3,4]]);
  assert.ok(Math.abs(r.workspace.S[0][0])<1e-12);
  assert.ok(Math.abs(r.workspace.S[0][1]-1)<1e-12);
});

test("Math Lab supports any all find and mod",()=>{
  const r=runMathLabScript("A=[0 2;0 3]\na=any(A)\nb=all(A)\nidx=find(A)\nM=mod([5 6;7 8],3)");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.a,1);
  assert.equal(r.workspace.b,0);
  assert.deepEqual(r.workspace.idx,[[3,4]]);
  assert.deepEqual(r.workspace.M,[[2,0],[1,2]]);
});

test("Math Lab supports multiple output user functions",()=>{
  const script=`function [s,p] = sumprod(a,b)
s=a+b;
p=a.*b;
end
[x,y]=sumprod([1 2],[3 4])`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.x,[[4,6]]);
  assert.deepEqual(r.workspace.y,[[3,8]]);
});

test("Single assignment from multi-output function receives first output",()=>{
  const script=`function [s,p] = sumprod(a,b)
s=a+b;
p=a.*b;
end
x=sumprod(2,3)`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,true);
  assert.equal(r.workspace.x,5);
});

test("Math Lab validates multi-output assignment arity",()=>{
  const script=`function [s,p] = sumprod(a,b)
s=a+b;
p=a*b;
end
[x,y,z]=sumprod(2,3)`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"TOO_MANY_OUTPUTS");
});


test("Math Lab UI exposes array math and multi-output function examples",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(index,/data-i18n="multiOutputFunctions"/);
  assert.match(index,/data-i18n="arrayMath"/);
  assert.match(index,/mathLabArrayMathCommands/);
  assert.match(index,/mathLabFunctionCommands/);
  assert.match(strings,/ml_TOO_MANY_OUTPUTS/);
});


test("Math Lab supports element-wise logical comparisons",()=>{
  const r=runMathLabScript("A=[0 2;3 0]\nB=A>1\nC=A~=0\nD=B&C\nE=B|[1 0;0 0]\nF=~B\nidx=find(A>0)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.B,[[0,1],[1,0]]);
  assert.deepEqual(r.workspace.C,[[0,1],[1,0]]);
  assert.deepEqual(r.workspace.D,[[0,1],[1,0]]);
  assert.deepEqual(r.workspace.E,[[1,1],[1,0]]);
  assert.deepEqual(r.workspace.F,[[1,0],[0,1]]);
  assert.deepEqual(r.workspace.idx,[[2,3]]);
});

test("Scalar short-circuit operators still require scalar conditions",()=>{
  const r=runMathLabScript("A=[1 0]\nx=A&&1");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"SCALAR_LOGICAL_REQUIRED");
});
