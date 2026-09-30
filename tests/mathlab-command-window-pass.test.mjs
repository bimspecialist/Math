import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runMathLabScript, describeMathLabValue } from "../src/mathlab/math-lab-engine.js";

test("Math Lab supports MATLAB-style colon vectors with parentheses",()=>{
  const r=runMathLabScript("A = (1:5)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,2,3,4,5]]);
  assert.deepEqual(describeMathLabValue(r.workspace.A),{
    size:"1×5",className:"double",preview:"[1, 2, 3, 4, 5]"
  });
});

test("Math Lab supports stepped and descending colon ranges",()=>{
  let r=runMathLabScript("A = 1:2:9");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,3,5,7,9]]);

  r=runMathLabScript("B = 10:-2:2");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.B,[[10,8,6,4,2]]);

  r=runMathLabScript("C = 5:1");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.C,[[]]);
});

test("Math Lab expands colon ranges inside matrix literals",()=>{
  const r=runMathLabScript("A = [1:5]");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,2,3,4,5]]);
});

test("Math Lab uses MATLAB-style one-based indexing",()=>{
  const r=runMathLabScript("A=(1:5)\nA(3)\nA(2:4)");
  assert.equal(r.ok,true);
  assert.equal(r.outputs[1].value,3);
  assert.deepEqual(r.outputs[2].value,[[2,3,4]]);
});

test("Math Lab supports two-dimensional indexing and colon selectors",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nA(2,1)\nA(:,2)\nA(2,:)");
  assert.equal(r.ok,true);
  assert.equal(r.outputs[1].value,3);
  assert.deepEqual(r.outputs[2].value,[[2],[4]]);
  assert.deepEqual(r.outputs[3].value,[[3,4]]);
});

test("Math Lab linear indexing follows MATLAB column-major order",()=>{
  const r=runMathLabScript("A=[1 2;3 4]\nA(2)\nA(3)");
  assert.equal(r.ok,true);
  assert.equal(r.outputs[1].value,3);
  assert.equal(r.outputs[2].value,2);
});

test("Math Lab validates range and index errors",()=>{
  assert.equal(runMathLabScript("A=1:0:5").error.message,"ZERO_RANGE_STEP");
  assert.equal(runMathLabScript("A=(1:5)\nA(6)").error.message,"INDEX_OUT_OF_RANGE");
});

test("Math Lab length matches the largest array dimension",()=>{
  let r=runMathLabScript("A=(1:5)\nlength(A)");
  assert.equal(r.ok,true);
  assert.equal(r.outputs.at(-1).value,5);

  r=runMathLabScript("A=[1 2 3;4 5 6]\nlength(A)");
  assert.equal(r.outputs.at(-1).value,3);
});

test("Math Lab implements who whos clear and clc workspace commands",()=>{
  const r=runMathLabScript("A=(1:5)\nb=2\nwho\nwhos\nclear b\nclc\nA");
  assert.equal(r.ok,true);
  assert.ok(r.outputs.some(x=>x.kind==="who"&&String(x.value).includes("A")));
  const whos=r.outputs.find(x=>x.kind==="whos");
  assert.ok(whos);
  assert.deepEqual(whos.value.find(x=>x.name==="A"),{
    name:"A",size:"1×5",className:"double",preview:"[1, 2, 3, 4, 5]"
  });
  assert.equal(Object.hasOwn(r.workspace,"b"),false);
  assert.ok(r.events.some(x=>x.type==="clear-output"&&x.line===6));
});

test("Math Lab clear all removes the complete workspace",()=>{
  const r=runMathLabScript("A=1\nb=2\nclear all");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace,{});
});

test("Math Lab UI exposes MATLAB-style workspace metadata and command history",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/A = \(1:5\)/);
  assert.match(index,/id="mathlab-workspace-body"/);
  assert.match(index,/id="mathlab-history"/);
  assert.match(index,/data-i18n="classLabel"/);
  assert.match(index,/A\(:,2\)/);
  assert.match(app,/describeMathLabValue/);
  assert.match(app,/mathLabTranscript/);
  assert.match(app,/mathLabHistory/);
  assert.match(app,/formatMathLabOutputEntry/);
});
