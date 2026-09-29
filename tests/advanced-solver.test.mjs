import test from "node:test";
import assert from "node:assert/strict";
import { solveAdvancedInput } from "../src/advanced/advanced-solver.js";

test("advanced solver evaluates a typed numeric expression",()=>{
  const r=solveAdvancedInput("2^3+4");
  assert.equal(r.kind,"value");
  assert.equal(r.numeric,12);
});

test("advanced solver returns all roots of a one-variable quadratic",()=>{
  const r=solveAdvancedInput("x^2-4=0");
  assert.equal(r.kind,"solution-set");
  assert.equal(r.variable,"x");
  assert.deepEqual(r.solutions,[-2,2]);
});

test("advanced solver returns a parametric answer for one linear equation with several unknowns",()=>{
  const r=solveAdvancedInput("x+y=5");
  assert.equal(r.kind,"parametric-system");
  assert.deepEqual(r.variables,["x","y"]);
  assert.equal(r.freeVariables.length,1);
  assert.match(r.expressions.x,/5/);
});

test("advanced solver accepts calculator multiplication and division glyphs",()=>{
  const r=solveAdvancedInput("6×7÷2");
  assert.equal(r.kind,"value");
  assert.equal(r.numeric,21);
});


test("Advanced Solver UI exposes solve action and result region",async()=>{
  const {readFileSync}=await import("node:fs");
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/id="advanced-solve"/);
  assert.match(index,/id="advanced-result"/);
  assert.match(app,/solveAdvancedInput/);
  assert.match(app,/advanced-solve/);
});


test("advanced solver recognizes arbitrary single-letter variables such as A",()=>{
  const r=solveAdvancedInput("A*5=5*2^2");
  assert.equal(r.kind,"solution-set");
  assert.equal(r.variable,"A");
  assert.deepEqual(r.solutions,[4]);
});

test("advanced solver analyzes a polynomial expression even without an equals sign",()=>{
  const r=solveAdvancedInput("X^2+4");
  assert.equal(r.kind,"expression-analysis");
  assert.equal(r.variable,"X");
  assert.equal(r.degree,2);
  assert.deepEqual(r.roots,["-2i","2i"]);
});

test("advanced solver solves a square linear system with multiple unknowns",()=>{
  const r=solveAdvancedInput("x+y=5\nx-y=1");
  assert.equal(r.kind,"system-solution");
  assert.deepEqual(r.values,{x:3,y:2});
});

test("advanced solver reports an inconsistent linear system",()=>{
  const r=solveAdvancedInput("x+y=1\nx+y=2");
  assert.deepEqual(r,{kind:"error",code:"NO_SOLUTION",variables:["x","y"]});
});


test("advanced result formatter presents all roots and system values",async()=>{
  const {formatAdvancedResult}=await import("../src/advanced/advanced-result-format.js");
  assert.equal(formatAdvancedResult({kind:"solution-set",variable:"x",solutions:[-2,2]}),"x = -2, 2");
  assert.equal(formatAdvancedResult({kind:"system-solution",values:{x:3,y:2}}),"x = 3\ny = 2");
});

test("advanced result formatter presents parametric and expression analysis results",async()=>{
  const {formatAdvancedResult}=await import("../src/advanced/advanced-result-format.js");
  assert.match(formatAdvancedResult({kind:"parametric-system",freeVariables:["y"],expressions:{x:"5 - y",y:"y"}}),/x = 5 - y/);
  assert.match(formatAdvancedResult({kind:"expression-analysis",expression:"X^2+4",variable:"X",degree:2,roots:["-2i","2i"]}),/Roots: -2i, 2i/);
});


test("advanced solver finds multiple real solutions of a two-variable nonlinear system",()=>{
  const r=solveAdvancedInput("x^2+y^2=25\nx-y=1");
  assert.equal(r.kind,"system-solution-set");
  assert.equal(r.solutions.length,2);
  const pts=r.solutions.map(p=>[Number(p.x.toFixed(6)),Number(p.y.toFixed(6))]).sort((a,b)=>a[0]-b[0]);
  assert.deepEqual(pts,[[-3,-4],[4,3]]);
});

test("advanced solver verifies nonlinear system roots against every equation",()=>{
  const r=solveAdvancedInput("x^2+y^2=25\nx-y=1");
  for(const p of r.solutions){
    assert.ok(Math.abs(p.x*p.x+p.y*p.y-25)<1e-7);
    assert.ok(Math.abs(p.x-p.y-1)<1e-7);
  }
});


test("advanced result formatter presents nonlinear system solution sets",async()=>{
  const {formatAdvancedResult}=await import("../src/advanced/advanced-result-format.js");
  const text=formatAdvancedResult({kind:"system-solution-set",solutions:[{x:-3,y:-4},{x:4,y:3}]});
  assert.match(text,/x = -3, y = -4/);
  assert.match(text,/x = 4, y = 3/);
});


test("Advanced Solver UI advertises multi-equation input and provides working examples",async()=>{
  const {readFileSync}=await import("node:fs");
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/data-advanced-example="A\*5=5\*2\^2"/);
  assert.match(index,/data-advanced-example="x\+y=5&#10;x-y=1"/);
  assert.match(app,/data-advanced-example/);
});
