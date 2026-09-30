import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getProfessionalLibrary, getProfessionalFormula } from "../src/knowledge/professional-libraries.js";
import { evaluateProfessionalFormula } from "../src/knowledge/formula-workbench.js";
import { professionalFormulaExplanation } from "../src/knowledge/formula-explanations.js";

const calc=(id,values)=>evaluateProfessionalFormula(getProfessionalFormula("environmental",id),values);

test("Environmental Engineering library spans the standard undergraduate topic set",()=>{
  const lib=getProfessionalLibrary("environmental");
  assert.ok(lib);
  assert.ok(lib.formulas.length>=62,lib.formulas.length);
  for(const topic of ["Mass & concentration","Water chemistry","Reaction kinetics","BOD & oxygen","Water treatment","Wastewater treatment","Adsorption","Groundwater","Air pollution","Noise","Solid waste","Environmental risk","Population & flow"]){
    assert.ok(lib.formulas.some(x=>x.topicEn===topic),topic);
  }
});

test("Environmental mass balance and removal formulas calculate correctly",()=>{
  assert.equal(calc("mass-loading",{Q:2,C:3}).value,6);
  assert.equal(calc("mixed-concentration",{Q1:2,C1:10,Q2:1,C2:4}).value,8);
  assert.equal(calc("removal-efficiency",{Cin:100,Cout:20}).value,80);
  assert.equal(calc("mixed-concentration",{Q1:0,C1:10,Q2:0,C2:4}).code,"ZERO_TOTAL_FLOW");
});

test("Water chemistry formulas cover pH alkalinity and hardness",()=>{
  assert.ok(Math.abs(calc("ph-from-h",{H:1e-7}).value-7)<1e-12);
  assert.ok(Math.abs(calc("h-from-ph",{pH:7}).value-1e-7)<1e-18);
  assert.equal(calc("alkalinity-caco3",{meq:2}).value,100);
  assert.equal(calc("hardness-caco3",{C:40,EW:20}).value,100);
});

test("Environmental reaction kinetics cover first-order zero-order CSTR and PFR",()=>{
  assert.ok(Math.abs(calc("first-order-decay",{C0:100,k:0.1,t:10}).value-100*Math.exp(-1))<1e-12);
  assert.ok(Math.abs(calc("first-order-half-life",{k:0.1}).value-Math.log(2)/0.1)<1e-12);
  assert.equal(calc("zero-order-decay",{C0:10,k:1,t:5}).value,5);
  assert.equal(calc("zero-order-decay",{C0:2,k:1,t:5}).code,"NEGATIVE_CONCENTRATION");
  assert.equal(calc("cstr-first-order",{C0:100,k:1,theta:1}).value,50);
  assert.ok(Math.abs(calc("pfr-first-order",{C0:100,k:1,theta:1}).value-100/Math.E)<1e-12);
});

test("BOD and dissolved oxygen relations enforce their domains",()=>{
  assert.ok(calc("bod-exerted",{L0:200,k:0.2,t:5}).value>0);
  assert.equal(calc("oxygen-deficit",{DOsat:9,DO:7}).value,2);
  assert.equal(calc("oxygen-deficit",{DOsat:8,DO:9}).code,"DO_ABOVE_SATURATION");
  assert.equal(calc("streeter-phelps-deficit",{k1:0.2,k2:0.2,L0:100,D0:1,t:2}).code,"EQUAL_RATE_CONSTANTS");
});

test("Water and wastewater treatment formulas include settling disinfection solids and Monod growth",()=>{
  assert.equal(calc("detention-time",{V:1000,Q:100}).value,10);
  assert.equal(calc("surface-overflow-rate",{Q:500,A:100}).value,5);
  assert.ok(calc("stokes-settling",{g:9.81,rhoP:2650,rho:1000,d:0.0001,mu:0.001}).value>0);
  assert.equal(calc("chlorine-demand",{Dose:4,Residual:1}).value,3);
  assert.equal(calc("ct-disinfection",{C:1.5,t:30}).value,45);
  assert.equal(calc("fm-ratio",{Q:100,S0:0.3,V:500,X:3}).value,0.02);
  assert.equal(calc("sludge-volume-index",{SV30:300,MLSS:3000}).value,100);
  assert.equal(calc("monod-growth",{muMax:1,S:20,Ks:20}).value,0.5);
  assert.equal(calc("return-sludge-ratio",{Qr:50,Q:100}).value,0.5);
});

test("Groundwater equations cover Darcy seepage and Thiem forms",()=>{
  assert.ok(Math.abs(calc("darcy-groundwater",{K:1e-4,i:0.01,A:100}).value-0.0001)<1e-15);
  assert.ok(Math.abs(calc("seepage-velocity",{K:1e-4,i:0.01,ne:0.25}).value-0.000004)<1e-15);
  assert.equal(calc("confined-thiem",{T:0.01,h1:10,h2:9,r1:10,r2:100}).ok,true);
  assert.equal(calc("confined-thiem",{T:0.01,h1:10,h2:9,r1:100,r2:10}).code,"RADIUS_ORDER");
});

test("Air pollution noise solid waste and risk formulas are represented",()=>{
  assert.equal(calc("ppm-mg-m3-25c",{ppm:10,MW:44}).value,440/24.45);
  assert.equal(calc("ventilation-ach",{Q:1,V:1000}).value,3.6);
  assert.equal(calc("equal-noise-sources",{L:70,N:10}).value,80);
  assert.equal(calc("recycling-rate",{Mr:30,Mg:100}).value,30);
  assert.equal(calc("hazard-quotient",{CDI:0.002,RfD:0.001}).value,2);
  assert.equal(calc("cancer-risk",{LADD:0.001,SF:0.5}).value,0.0005);
});

test("Environmental navigation and topic filtering are exposed in the UI",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/data-knowledge-library="environmental"/);
  assert.match(index,/navEnvironmentalLibrary/);
  assert.match(index,/id="knowledge-topic"/);
  assert.match(app,/activeKnowledgeTopic/);
});

test("Every Environmental Engineering formula has bilingual guidance",()=>{
  const lib=getProfessionalLibrary("environmental");
  for(const formula of lib.formulas){
    assert.ok(professionalFormulaExplanation("environmental",formula.id,"en"),formula.id+" en");
    assert.ok(professionalFormulaExplanation("environmental",formula.id,"ar"),formula.id+" ar");
  }
});

test("Every Environmental Engineering calculator executes with a valid smoke-test dataset",()=>{
  const lib=getProfessionalLibrary("environmental");
  for(const formula of lib.formulas){
    if(!formula.calcExpression)continue;
    const values={};
    for(const variable of formula.variables){
      let value=variable.defaultValue!==""?Number(variable.defaultValue):1;
      if(variable.exclusiveMin!==undefined&&value<=Number(variable.exclusiveMin))value=Number(variable.exclusiveMin)+1;
      if(variable.min!==undefined&&value<Number(variable.min))value=Number(variable.min);
      if(variable.max!==undefined&&value>Number(variable.max))value=Number(variable.max);
      if(variable.integer)value=Math.max(1,Math.round(value));
      if(variable.nonZero&&value===0)value=1;
      values[variable.id]=value;
    }
    for(const rule of formula.rules??[]){
      if(rule.kind==="gt"){values[rule.left]=2;values[rule.right]=1}
      else if(rule.kind==="gte"){values[rule.left]=2;values[rule.right]=1}
      else if(rule.kind==="lt"){values[rule.left]=1;values[rule.right]=2}
      else if(rule.kind==="lte"){values[rule.left]=1;values[rule.right]=2}
      else if(rule.kind==="neq"){values[rule.left]=2;values[rule.right]=1}
      else if(rule.kind==="gtSum"){values[rule.left]=1;values[rule.right]=1}
      else if(rule.kind==="gteExpr"){
        values.C0=10;values.k=1;values.t=1;
      }
    }
    const result=evaluateProfessionalFormula(formula,values);
    assert.equal(result.ok,true,`${formula.id}: ${result.code??"unknown"}`);
    assert.ok(Number.isFinite(result.value),formula.id+" finite result");
  }
});
