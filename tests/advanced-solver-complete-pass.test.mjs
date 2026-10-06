import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { solveAdvancedInput } from "../src/advanced/advanced-solver.js";
import { formatAdvancedResult } from "../src/advanced/advanced-result-format.js";

test("Advanced Solver applies RAD consistently to direct expressions and nsolve",()=>{
  const direct=solveAdvancedInput("sin(pi/2)",{angleMode:"RAD"});
  assert.equal(direct.kind,"value");
  assert.ok(Math.abs(direct.numeric-1)<1e-12);

  const root=solveAdvancedInput("nsolve(cos(x)=x,x,0.7)",{angleMode:"RAD"});
  assert.equal(root.kind,"numeric-root");
  assert.equal(root.angleMode,"RAD");
  assert.ok(Math.abs(root.value-0.7390851332)<1e-8);
});

test("Advanced Solver applies DEG consistently to expressions roots and limits",()=>{
  const direct=solveAdvancedInput("sin(30)",{angleMode:"DEG"});
  assert.equal(direct.kind,"value");
  assert.ok(Math.abs(direct.numeric-0.5)<1e-12);

  const root=solveAdvancedInput("nsolve(sin(x)=0.5,x,25,35)",{angleMode:"DEG"});
  assert.equal(root.kind,"numeric-root");
  assert.equal(root.angleMode,"DEG");
  assert.ok(Math.abs(root.value-30)<1e-7);

  const limit=solveAdvancedInput("limit(sin(x)/x,x,0)",{angleMode:"DEG"});
  assert.equal(limit.kind,"limit");
  assert.equal(limit.angleMode,"DEG");
  assert.ok(Math.abs(limit.value-Math.PI/180)<1e-6);
});

test("Advanced Solver rejects unsupported angle modes",()=>{
  assert.deepEqual(solveAdvancedInput("1+1",{angleMode:"GRAD"}),{kind:"error",code:"INVALID_ANGLE_MODE"});
});

test("Advanced Solver nsolve falls back to a bracket when Newton stalls",()=>{
  const r=solveAdvancedInput("nsolve(x^3-1=0,x,0)",{angleMode:"RAD"});
  assert.equal(r.kind,"numeric-root");
  assert.equal(r.method,"hybrid");
  assert.ok(Math.abs(r.value-1)<1e-10);
  assert.ok(Array.isArray(r.bracket));
  assert.ok(Number.isFinite(r.iterations));
});

test("Advanced Solver reports convergence diagnostics",()=>{
  const r=solveAdvancedInput("nsolve(x^2-2=0,x,1,2)",{angleMode:"RAD"});
  const text=formatAdvancedResult(r,"en");
  assert.match(text,/Bisection/);
  assert.match(text,/Iterations:/);
  assert.match(text,/Angle mode: RAD/);
});

test("Advanced Solver UI exposes one angle mode shared by all solve paths",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/id="advanced-angle-mode"/);
  assert.match(index,/id="advanced-angle-hint"/);
  assert.match(index,/id="advanced-result-meta"/);
  assert.match(app,/solveAdvancedInput\(advancedInput\?\.value\?\?"",\{angleMode\}\)/);
  assert.match(app,/advancedAngleMode\?\.addEventListener\("change"/);
});


test("Advanced Solver automatically solves cubic equations including complex roots",()=>{
  const r=solveAdvancedInput("x^3-1=0",{angleMode:"RAD"});
  assert.equal(r.kind,"solution-set");
  assert.equal(r.degree,3);
  assert.equal(r.method,"durand-kerner");
  assert.equal(r.solutions.length,3);
  assert.ok(r.solutions.some(x=>typeof x==="number"&&Math.abs(x-1)<1e-9));
  const complex=r.solutions.filter(x=>typeof x==="string");
  assert.equal(complex.length,2);
  assert.ok(complex.every(x=>x.includes("i")));
});

test("Advanced Solver automatically solves quartics with real roots",()=>{
  const r=solveAdvancedInput("x^4-5*x^2+4=0",{angleMode:"RAD"});
  assert.equal(r.kind,"solution-set");
  assert.equal(r.degree,4);
  const roots=r.solutions.filter(x=>typeof x==="number").sort((a,b)=>a-b);
  assert.equal(roots.length,4);
  for(const [actual,expected] of roots.map((x,i)=>[x,[-2,-1,1,2][i]]))assert.ok(Math.abs(actual-expected)<1e-8);
});


test("Advanced Solver analyzes cubic expressions without requiring =0",()=>{
  const r=solveAdvancedInput("x^3-1",{angleMode:"RAD"});
  assert.equal(r.kind,"expression-analysis");
  assert.equal(r.degree,3);
  assert.equal(r.method,"durand-kerner");
  assert.equal(r.roots.length,3);
  assert.ok(r.roots.some(x=>typeof x==="number"&&Math.abs(x-1)<1e-9));
});

test("Advanced Solver analyzes quartic expressions consistently with equation solving",()=>{
  const r=solveAdvancedInput("x^4-5*x^2+4",{angleMode:"RAD"});
  assert.equal(r.kind,"expression-analysis");
  assert.equal(r.degree,4);
  const roots=r.roots.filter(x=>typeof x==="number").sort((a,b)=>a-b);
  assert.equal(roots.length,4);
  for(const [actual,expected] of roots.map((x,i)=>[x,[-2,-1,1,2][i]]))assert.ok(Math.abs(actual-expected)<1e-8);
});
