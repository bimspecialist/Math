import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getProfessionalLibrary, getProfessionalFormula } from "../src/knowledge/professional-libraries.js";
import { evaluateProfessionalFormula } from "../src/knowledge/formula-workbench.js";
import { professionalFormulaExplanation } from "../src/knowledge/formula-explanations.js";

const calc=(id,values)=>evaluateProfessionalFormula(getProfessionalFormula("advanced-engineering-math",id),values);

test("Advanced Engineering Mathematics spans the standard advanced undergraduate topics",()=>{
  const lib=getProfessionalLibrary("advanced-engineering-math");
  assert.ok(lib);
  assert.ok(lib.formulas.length>=115,lib.formulas.length);
  for(const topic of ["Complex numbers","Linear algebra","Ordinary differential equations","Laplace transforms","Fourier methods","Vector calculus","Series","Numerical methods","Partial differential equations","Probability & statistics","Vibrations","Transforms & special equations"]){
    assert.ok(lib.formulas.some(x=>x.topicEn===topic),topic);
  }
});

test("Complex-number and linear-algebra calculators return expected values",()=>{
  assert.equal(calc("complex-magnitude",{x:3,y:4}).value,5);
  assert.ok(Math.abs(calc("polar-real",{r:2,theta:60}).value-1)<1e-12);
  assert.ok(Math.abs(calc("polar-imag",{r:2,theta:30}).value-1)<1e-12);
  assert.equal(calc("det-2x2",{a:1,b:2,c:3,d:4}).value,-2);
  assert.equal(calc("det-3x3",{a:1,b:0,c:0,d:0,e:2,f:0,g:0,h:0,i:3}).value,6);
  assert.equal(calc("vector-magnitude-3d",{x:2,y:3,z:6}).value,7);
  assert.equal(calc("dot-product-3d",{ax:1,ay:2,az:3,bx:4,by:5,bz:6}).value,32);
});

test("2x2 eigenvalue and Cramer formulas validate real-domain assumptions",()=>{
  assert.equal(calc("eigenvalue-2x2-plus",{tr:5,det:6}).value,3);
  assert.equal(calc("eigenvalue-2x2-minus",{tr:5,det:6}).value,2);
  assert.equal(calc("eigenvalue-2x2-plus",{tr:0,det:1}).code,"COMPLEX_EIGENVALUES");
  assert.equal(calc("cramer-x-2x2",{a:2,b:1,c:1,d:2,e:5,f:4}).value,2);
  assert.equal(calc("cramer-y-2x2",{a:2,b:1,c:1,d:2,e:5,f:4}).value,1);
});

test("ODE and Laplace calculators cover common engineering forms",()=>{
  assert.ok(Math.abs(calc("exp-growth-decay",{y0:2,k:0.5,t:2}).value-2*Math.E)<1e-12);
  assert.ok(Math.abs(calc("newton-cooling",{Ta:20,T0:100,k:0.1,t:10}).value-(20+80/Math.E))<1e-12);
  assert.equal(calc("characteristic-root-plus",{a:1,b:-3,c:2}).value,2);
  assert.equal(calc("characteristic-root-minus",{a:1,b:-3,c:2}).value,1);
  assert.equal(calc("characteristic-root-plus",{a:1,b:0,c:1}).code,"COMPLEX_ROOTS");
  assert.equal(calc("laplace-one",{s:2}).value,0.5);
  assert.equal(calc("laplace-t2",{s:2}).value,0.25);
  assert.equal(calc("laplace-exp",{s:3,a:1}).value,0.5);
  assert.equal(calc("laplace-exp",{s:1,a:1}).code,"LAPLACE_POLE");
});

test("Fourier vector-calculus and series formulas are internally consistent",()=>{
  assert.ok(Math.abs(calc("angular-frequency-period",{T:2}).value-Math.PI)<1e-12);
  assert.equal(calc("harmonic-frequency",{n:3,f1:50}).value,150);
  assert.equal(calc("gradient-magnitude",{fx:2,fy:3,fz:6}).value,7);
  assert.equal(calc("directional-derivative",{fx:1,fy:2,fz:3,ux:1,uy:0,uz:0}).value,1);
  assert.equal(calc("divergence",{dFxdx:1,dFydy:2,dFzdz:3}).value,6);
  assert.equal(calc("arithmetic-sum",{n:5,a1:1,d:1}).value,15);
  assert.equal(calc("geometric-finite",{a:1,r:2,n:4}).value,15);
  assert.equal(calc("geometric-infinite",{a:1,r:0.5}).value,2);
  assert.equal(calc("binomial-coefficient",{n:5,k:2}).value,10);
});

test("Numerical methods implement standard one-step formulas",()=>{
  assert.equal(calc("bisection-midpoint",{xl:2,xu:4}).value,3);
  assert.equal(calc("newton-raphson-step",{x:2,fx:2,dfx:4}).value,1.5);
  assert.equal(calc("secant-step",{x0:1,x1:2,f0:-1,f1:2}).value,4/3);
  assert.equal(calc("euler-step",{y:1,h:0.1,f:2}).value,1.2);
  assert.equal(calc("heun-step",{y:1,h:0.1,f1:2,f2:3}).value,1.25);
  assert.equal(calc("rk4-step",{y:1,k1:1,k2:2,k3:2,k4:3}).value,3);
  assert.equal(calc("trapezoid-single",{h:2,f0:1,f1:3}).value,4);
  assert.equal(calc("simpson-one-third",{h:1,f0:1,f1:4,f2:1}).value,6);
  assert.equal(calc("central-first-derivative",{fp:4,fm:0,h:2}).value,1);
});

test("PDE finite-difference formulas enforce common stability bounds",()=>{
  assert.equal(calc("heat-fourier-number",{alpha:1,dt:0.1,dx:1}).value,0.1);
  assert.equal(calc("heat-explicit-node",{r:0.25,uL:0,uC:4,uR:0}).value,2);
  assert.equal(calc("heat-explicit-node",{r:0.6,uL:0,uC:4,uR:0}).code,"VALUE_ABOVE_MAXIMUM");
  assert.equal(calc("wave-courant",{c:2,dt:0.25,dx:1}).value,0.5);
  assert.equal(calc("laplace-five-point",{uN:1,uS:3,uE:5,uW:7}).value,4);
  assert.equal(calc("pde-discriminant",{A:1,B:0,C:1}).value,-4);
});

test("Probability reliability and vibration formulas calculate correctly",()=>{
  assert.equal(calc("z-score",{x:12,mu:10,sigma:2}).value,1);
  assert.equal(calc("standard-error-mean",{sigma:10,n:25}).value,2);
  assert.equal(calc("binomial-probability",{n:4,k:2,p:0.5}).value,0.375);
  assert.ok(Math.abs(calc("poisson-probability",{lambda:2,k:2}).value-(2*Math.exp(-2)))<1e-12);
  assert.equal(calc("series-reliability-2",{R1:0.9,R2:0.8}).value,0.72);
  assert.equal(calc("parallel-reliability-2",{R1:0.9,R2:0.8}).value,0.98);
  assert.equal(calc("natural-angular-frequency",{k:400,m:4}).value,10);
  assert.equal(calc("damping-ratio",{c:4,k:100,m:1}).value,0.2);
  assert.equal(calc("frequency-ratio",{omega:5,wn:10}).value,0.5);
});

test("Reference-only advanced topics remain references instead of fake calculators",()=>{
  for(const id of ["complex-argument","de-moivre-reference","matrix-inverse-reference","separable-ode-reference","fourier-series-reference","green-theorem-reference","taylor-general-reference","pde-classification-reference","variance-reference","sdof-equation-reference","z-transform-reference","bessel-equation-reference"]){
    const formula=getProfessionalFormula("advanced-engineering-math",id);
    assert.ok(formula,id);
    assert.equal(formula.calcExpression,null,id);
    assert.equal(evaluateProfessionalFormula(formula,{}).code,"REFERENCE_ONLY",id);
  }
});

test("Advanced Engineering Mathematics UI exposes navigation and topic filtering",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(index,/data-knowledge-library="advanced-engineering-math"/);
  assert.match(index,/navAdvancedEngineeringMath/);
  assert.match(index,/id="knowledge-topic"/);
});

test("Every Advanced Engineering Mathematics item has bilingual guidance",()=>{
  const lib=getProfessionalLibrary("advanced-engineering-math");
  for(const formula of lib.formulas){
    assert.ok(professionalFormulaExplanation("advanced-engineering-math",formula.id,"en"),formula.id+" en");
    assert.ok(professionalFormulaExplanation("advanced-engineering-math",formula.id,"ar"),formula.id+" ar");
  }
});

test("Every calculable Advanced Engineering Mathematics formula executes with valid smoke-test values",()=>{
  const lib=getProfessionalLibrary("advanced-engineering-math");
  for(const formula of lib.formulas){
    if(!formula.calcExpression)continue;
    const values={};
    for(const variable of formula.variables){
      let value=variable.defaultValue!==""?Number(variable.defaultValue):1;
      if(variable.exclusiveMin!==undefined&&value<=Number(variable.exclusiveMin))value=Number(variable.exclusiveMin)+1;
      if(variable.min!==undefined&&value<Number(variable.min))value=Number(variable.min);
      if(variable.max!==undefined&&value>Number(variable.max))value=Number(variable.max);
      if(variable.absLessThan!==undefined)value=Math.min(0.5,Number(variable.absLessThan)/2);
      if(variable.notEqual!==undefined&&value===Number(variable.notEqual))value=Number(variable.notEqual)+1;
      if(variable.integer)value=Math.max(1,Math.round(value));
      if(variable.nonZero&&value===0)value=1;
      values[variable.id]=value;
    }
    if(["eigenvalue-2x2-plus","eigenvalue-2x2-minus"].includes(formula.id)){values.tr=3;values.det=1}
    if(["characteristic-root-plus","characteristic-root-minus"].includes(formula.id)){values.a=1;values.b=3;values.c=1}
    if(["cramer-x-2x2","cramer-y-2x2"].includes(formula.id)){values.a=2;values.b=1;values.c=1;values.d=2;values.e=1;values.f=1}
    if(formula.id==="dynamic-magnification-undamped")values.r=0.5;
    for(const rule of formula.rules??[]){
      if(rule.kind==="gt"){values[rule.left]=2;values[rule.right]=1}
      else if(rule.kind==="gte"){values[rule.left]=2;values[rule.right]=1}
      else if(rule.kind==="lt"){values[rule.left]=1;values[rule.right]=2}
      else if(rule.kind==="lte"){values[rule.left]=1;values[rule.right]=2}
      else if(rule.kind==="neq"){values[rule.left]=2;values[rule.right]=1}
    }
    const result=evaluateProfessionalFormula(formula,values);
    assert.equal(result.ok,true,`${formula.id}: ${result.code??"unknown"}`);
    assert.ok(Number.isFinite(result.value),formula.id+" finite result");
  }
});
