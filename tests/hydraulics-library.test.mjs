import test from "node:test";
import assert from "node:assert/strict";
import { getProfessionalLibrary, getProfessionalFormula } from "../src/knowledge/professional-libraries.js";
import { evaluateProfessionalFormula } from "../src/knowledge/formula-workbench.js";
import { professionalFormulaExplanation } from "../src/knowledge/formula-explanations.js";
import { readFileSync } from "node:fs";

const calc=(id,values)=>evaluateProfessionalFormula(getProfessionalFormula("hydraulics",id),values);

test("Hydraulics university library is comprehensive and topic-tagged",()=>{
  const lib=getProfessionalLibrary("hydraulics");
  assert.ok(lib);
  assert.ok(lib.formulas.length>=64,lib.formulas.length);
  for(const topic of ["Fluid properties","Hydrostatics","Continuity & energy","Pipe flow","Pumps & power","Open-channel geometry","Open-channel flow","Hydraulic jump","Flow measurement","Transients"]){
    assert.ok(lib.formulas.some(x=>x.topicEn===topic),topic);
  }
});

test("Fluid properties include viscosity dynamic pressure and capillarity",()=>{
  assert.equal(calc("newton-viscosity",{mu:0.001,gradV:100}).value,0.1);
  assert.equal(calc("dynamic-pressure",{rho:1000,Vel:2}).value,2000);
  const h=calc("capillary-rise",{sigma:0.072,theta:0,rho:1000,g:9.81,d:0.001});
  assert.equal(h.ok,true);
  assert.ok(Math.abs(h.value-(4*0.072/(1000*9.81*0.001)))<1e-12);
});

test("Continuity and Bernoulli support standard university calculations",()=>{
  assert.equal(calc("pipe-area",{D:0.2}).ok,true);
  assert.ok(Math.abs(calc("pipe-area",{D:0.2}).value-Math.PI*0.01)<1e-12);
  assert.equal(calc("continuity-discharge",{A:0.05,Vel:2}).value,0.1);
  assert.equal(calc("continuity-velocity",{Q:0.1,A:0.05}).value,2);
  assert.equal(calc("continuity-two-section",{A1:0.1,V1:2,A2:0.05}).value,4);
  assert.equal(calc("momentum-force-1d",{rho:1000,Q:0.1,V1:2,V2:4}).value,200);
  assert.ok(Math.abs(calc("velocity-head",{Vel:2,g:9.81}).value-4/19.62)<1e-12);
});

test("Pipe-flow formulas calculate Darcy losses and Reynolds number correctly",()=>{
  assert.equal(calc("reynolds-kinematic",{Vel:2,D:0.1,nu:1e-6}).value,200000);
  assert.equal(calc("darcy-laminar-f",{Re:1000}).value,0.064);
  const hf=calc("darcy-weisbach",{f:0.02,L:100,D:0.2,Vel:2,g:9.81});
  assert.equal(hf.ok,true);
  assert.ok(Math.abs(hf.value-(0.02*500*4/19.62))<1e-12);
  assert.equal(calc("hydraulic-gradient",{hL:5,L:100}).value,0.05);
  assert.equal(calc("equivalent-length-fitting",{K:2,D:0.2,f:0.02}).value,20);
});

test("Hydrostatics and buoyancy use explicit fluid properties",()=>{
  assert.equal(calc("hydrostatic-pressure",{rho:1000,g:9.81,h:5}).value,49050);
  assert.equal(calc("buoyancy",{rho:1000,g:9.81,Vdisp:0.5}).value,4905);
});

test("Pump and turbine relations preserve efficiency conventions",()=>{
  assert.equal(calc("pump-efficiency",{Ph:8000,Pin:10000}).value,80);
  const p=calc("turbine-output-power",{eta:0.9,rho:1000,g:9.81,Q:0.1,H:20});
  assert.equal(p.ok,true);
  assert.ok(Math.abs(p.value-17658)<1e-9);
});

test("Manning, Froude and critical-depth formulas are available",()=>{
  const q=calc("manning-discharge",{n:0.015,A:2,R:0.5,S:0.001});
  assert.equal(q.ok,true);
  const fr=calc("froude-number",{Vel:3,g:9.81,Dh:1});
  assert.ok(Math.abs(fr.value-3/Math.sqrt(9.81))<1e-12);
  const yc=calc("critical-depth-rect",{q:2,g:9.81});
  assert.ok(Math.abs(yc.value-Math.pow(4/9.81,1/3))<1e-12);
  assert.ok(calc("wide-rect-normal-depth",{n:0.015,Q:5,b:4,S:0.001}).value>0);
  assert.ok(calc("specific-force-rect",{y:1,q:2,g:9.81}).value>0);
});

test("Hydraulic jump equations enforce depth ordering",()=>{
  const y2=calc("jump-sequent-depth",{y1:0.5,Fr1:3});
  assert.equal(y2.ok,true);
  assert.ok(y2.value>0.5);
  assert.equal(calc("jump-energy-loss",{y1:1,y2:0.5}).code,"JUMP_DEPTH_ORDER");
});

test("Flow measurement formulas cover orifice, weir, Pitot and Venturi",()=>{
  for(const id of ["orifice-discharge","torricelli","rectangular-weir","v-notch-weir","pitot-velocity","venturi-discharge"]){
    assert.ok(getProfessionalFormula("hydraulics",id),id);
  }
  assert.equal(calc("venturi-discharge",{Cd:0.98,A1:0.1,A2:0.2,g:9.81,dh:1}).code,"VENTURI_AREA_ORDER");
});

test("Pump input power enforces efficiency as a decimal between zero and one",()=>{
  const r=calc("pump-input-power",{rho:1000,g:9.81,Q:0.05,H:20,eta:0.8});
  assert.equal(r.ok,true);
  assert.ok(Math.abs(r.value-12262.5)<1e-9);
  assert.equal(calc("pump-input-power",{rho:1000,g:9.81,Q:0.05,H:20,eta:1.2}).code,"VALUE_ABOVE_MAXIMUM");
});

test("Colebrook is explicitly reference-only instead of pretending to solve an implicit equation",()=>{
  const f=getProfessionalFormula("hydraulics","colebrook-white");
  assert.equal(f.calcExpression,null);
  assert.equal(evaluateProfessionalFormula(f,{}).code,"REFERENCE_ONLY");
});

test("Tank drainage validates head ordering",()=>{
  const r=calc("tank-drain-time",{Atank:10,h1:4,h2:1,Cd:0.62,Ao:0.02,g:9.81});
  assert.equal(r.ok,true);
  assert.ok(r.value>0);
  assert.equal(calc("tank-drain-time",{Atank:10,h1:1,h2:4,Cd:0.62,Ao:0.02,g:9.81}).code,"TANK_HEAD_ORDER");
});

test("Hydraulics UI exposes navigation and topic filtering",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/data-knowledge-library="hydraulics"/);
  assert.match(index,/id="knowledge-topic"/);
  assert.match(app,/activeKnowledgeTopic/);
  assert.match(app,/formula\.topicEn/);
});

test("Every Hydraulics formula has bilingual guidance",()=>{
  const lib=getProfessionalLibrary("hydraulics");
  for(const f of lib.formulas){
    assert.ok(professionalFormulaExplanation("hydraulics",f.id,"en"),f.id+" en");
    assert.ok(professionalFormulaExplanation("hydraulics",f.id,"ar"),f.id+" ar");
  }
});


test("Every calculable Hydraulics formula executes with a valid smoke-test dataset",()=>{
  const lib=getProfessionalLibrary("hydraulics");
  for(const formula of lib.formulas){
    if(!formula.calcExpression)continue;
    const values={};
    for(const variable of formula.variables){
      let value=variable.defaultValue!==""?Number(variable.defaultValue):1;
      if(variable.exclusiveMin!==undefined&&value<=Number(variable.exclusiveMin))value=Number(variable.exclusiveMin)+1;
      if(variable.min!==undefined&&value<Number(variable.min))value=Number(variable.min);
      if(variable.max!==undefined&&value>Number(variable.max))value=Number(variable.max);
      if(variable.nonZero&&value===0)value=1;
      values[variable.id]=value;
    }
    for(const rule of formula.rules??[]){
      if(rule.kind==="gt"){values[rule.left]=2;values[rule.right]=1}
      else if(rule.kind==="gte"){values[rule.left]=2;values[rule.right]=1}
      else if(rule.kind==="lt"){values[rule.left]=1;values[rule.right]=2}
      else if(rule.kind==="lte"){values[rule.left]=1;values[rule.right]=2}
    }
    const result=evaluateProfessionalFormula(formula,values);
    assert.equal(result.ok,true,`${formula.id}: ${result.code??"unknown"}`);
    assert.ok(Number.isFinite(result.value),formula.id+" finite result");
  }
});
