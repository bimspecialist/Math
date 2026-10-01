import test from "node:test";
import assert from "node:assert/strict";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";

test("Math Lab evaluates scalar comparisons and logical operators",()=>{
  const r=runMathLabScript("a=3>2\nb=3<=2\nc=(3>2)&&(2~=4)\nd=(1==0)||(5>=5)\ne=~(2<1)");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.a,1);
  assert.equal(r.workspace.b,0);
  assert.equal(r.workspace.c,1);
  assert.equal(r.workspace.d,1);
  assert.equal(r.workspace.e,1);
});

test("Math Lab supports if elseif else branches",()=>{
  let r=runMathLabScript("x=7;\nif x<0\ny=-1;\nelseif x<5\ny=0;\nelse\ny=1;\nend");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.y,1);

  r=runMathLabScript("x=3;\nif x<0\ny=-1;\nelseif x<5\ny=0;\nelse\ny=1;\nend");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.y,0);
});

test("Math Lab supports nested conditional blocks",()=>{
  const r=runMathLabScript("x=4; y=0;\nif x>0\nif x<5\ny=10;\nelse\ny=20;\nend\nend");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.y,10);
});

test("Math Lab supports for loops over MATLAB-style ranges",()=>{
  const r=runMathLabScript("s=0;\nfor i=1:5\ns=s+i;\nend");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.s,15);
  assert.equal(r.workspace.i,5);
});

test("Math Lab supports descending for ranges",()=>{
  const r=runMathLabScript("s=0;\nfor i=5:-2:1\ns=s+i;\nend");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.s,9);
});

test("Math Lab supports while loops",()=>{
  const r=runMathLabScript("x=1;\nwhile x<16\nx=x*2;\nend");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.x,16);
});

test("Math Lab supports break and continue inside loops",()=>{
  const script=`s=0;
for i=1:10
if i==3
continue
end
if i==6
break
end
s=s+i;
end`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,true);
  assert.equal(r.workspace.s,12);
  assert.equal(r.workspace.i,6);
});

test("Math Lab rejects break and continue outside loops",()=>{
  let r=runMathLabScript("break");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"BREAK_OUTSIDE_LOOP");
  r=runMathLabScript("continue");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"CONTINUE_OUTSIDE_LOOP");
});

test("Math Lab user functions can contain control flow",()=>{
  const script=`function y = signClass(x)
if x>0
y=1;
elseif x<0
y=-1;
else
y=0;
end
end
a=signClass(4)
b=signClass(-2)
c=signClass(0)`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,true);
  assert.equal(r.workspace.a,1);
  assert.equal(r.workspace.b,-1);
  assert.equal(r.workspace.c,0);
});

test("Math Lab user functions support loops and return",()=>{
  const script=`function y = firstAbove(limit)
y=0;
for i=1:10
if i>limit
y=i;
return
end
end
end
answer=firstAbove(4)`;
  const r=runMathLabScript(script);
  assert.equal(r.ok,true);
  assert.equal(r.workspace.answer,5);
});

test("Math Lab requires matching end for control blocks",()=>{
  const r=runMathLabScript("x=1;\nif x>0\ny=2;");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"BLOCK_END_REQUIRED");
});
