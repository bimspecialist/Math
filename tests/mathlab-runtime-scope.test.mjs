import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("persistent variables survive repeated calls in one run",()=>{
  const script=`function y = counter()
persistent n
if isempty(n)
n=0;
end
n=n+1;
y=n;
end
a=counter()
b=counter()`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,true);
  assert.equal(r.workspace.a,1);
  assert.equal(r.workspace.b,2);
});

test("persistent variables survive separate command-window runs when runtime state is reused",()=>{
  const fn=`function y = counter()
persistent n
if isempty(n)
n=0;
end
n=n+1;
y=n;
end
a=counter()`;
  const r1=runMathLabScript(fn);
  assert.equal(r1.ok,true);
  assert.equal(r1.workspace.a,1);

  const r2=runMathLabScript(fn,{}, {runtimeState:r1.runtimeState});
  assert.equal(r2.ok,true);
  assert.equal(r2.workspace.a,2);
});

test("global variables are shared between base workspace and user functions",()=>{
  const script=`global g
g=10;
function bump()
global g
g=g+5;
end
bump()
x=g`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,true);
  assert.equal(r.workspace.x,15);
  assert.equal(r.runtimeState.globals.g,15);
});

test("clear functions resets persistent storage",()=>{
  const fn=`function y = counter()
persistent n
if isempty(n)
n=0;
end
n=n+1;
y=n;
end
a=counter()`;
  const r1=runMathLabScript(fn);
  const cleared=runMathLabScript("clear functions",{}, {runtimeState:r1.runtimeState});
  const r2=runMathLabScript(fn,{}, {runtimeState:cleared.runtimeState});
  assert.equal(r2.workspace.a,1);
});

test("clear all resets global and persistent runtime state",()=>{
  const script=`global g
g=9;
function y = counter()
persistent n
if isempty(n)
n=0;
end
n=n+1;
y=n;
end
a=counter()`;
  const r1=runMathLabScript(script);
  const cleared=runMathLabScript("clear all",{}, {runtimeState:r1.runtimeState});
  assert.deepEqual(cleared.runtimeState.globals,{});
  assert.deepEqual(cleared.runtimeState.persistents,{});
});

test("persistent declarations are rejected outside functions",()=>{
  const r=runMathLabScript("persistent n");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"PERSISTENT_OUTSIDE_FUNCTION");
});
