import test from "node:test";
import assert from "node:assert/strict";
import { getProfessionalLibrary, getProfessionalFormula } from "../src/knowledge/professional-libraries.js";
import { evaluateProfessionalFormula } from "../src/knowledge/formula-workbench.js";
import { professionalFormulaExplanation } from "../src/knowledge/formula-explanations.js";

const calc=(id,values)=>evaluateProfessionalFormula(getProfessionalFormula("hydraulics",id),values);

test("Hydraulics university library is comprehensive and topic-tagged",()=>{
  const lib=getProfessionalLibrary("hydraulics");
  assert.ok(lib);
  assert.ok(lib.formulas.length>=45,lib.formulas.length);
  for(const topic of ["Fluid properties","Hydrostatics","Continuity & energy","Pipe flow","Pumps & power","Open-channel geometry","Open-channel flow","Hydraulic jump","Flow measurement","Transients"]){
    assert.ok(lib.formulas.some(x=>x.topicEn===topic),topic);
  }
});

test("Continuity and Bernoulli support standard university calculations",()=>{
  assert.equal(calc("pipe-area",{D:0.2}).ok,true);
  assert.ok(Math.abs(calc("pipe-area",{D:0.2}).value-Math.PI*0.01)<1e-12);
  assert.equal(calc("continuity-discharge",{A:0.05,Vel:2}).value,0.1);
  assert.equal(calc("continuity-velocity",{Q:0.1,A:0.05}).value,2);
  assert.ok(Math.abs(calc("velocity-head",{Vel:2,g:9.81}).value-4/19.62)<1e-12);
});

test("Pipe-flow formulas calculate Darcy losses and Reynolds number correctly",()=>{
  assert.equal(calc("reynolds-kinematic",{Vel:2,D:0.1,nu:1e-6}).value,200000);
  assert.equal(calc("darcy-laminar-f",{Re:1000}).value,0.064);
  const hf=calc("darcy-weisbach",{f:0.02,L:100,D:0.2,Vel:2,g:9.81});
  assert.equal(hf.ok,true);
  assert.ok(Math.abs(hf.value-(0.02*500*4/19.62))<1e-12);
});

test("Hydrostatics and buoyancy use explicit fluid properties",()=>{
  assert.equal(calc("hydrostatic-pressure",{rho:1000,g:9.81,h:5}).value,49050);
  assert.equal(calc("buoyancy",{rho:1000,g:9.81,Vdisp:0.5}).value,4905);
});

test("Manning, Froude and critical-depth formulas are available",()=>{
  const q=calc("manning-discharge",{n:0.015,A:2,R:0.5,S:0.001});
  assert.equal(q.ok,true);
  const fr=calc("froude-number",{Vel:3,g:9.81,Dh:1});
  assert.ok(Math.abs(fr.value-3/Math.sqrt(9.81))<1e-12);
  const yc=calc("critical-depth-rect",{q:2,g:9.81});
  assert.ok(Math.abs(yc.value-Math.pow(4/9.81,1/3))<1e-12);
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

test("Every Hydraulics formula has bilingual guidance",()=>{
  const lib=getProfessionalLibrary("hydraulics");
  for(const f of lib.formulas){
    assert.ok(professionalFormulaExplanation("hydraulics",f.id,"en"),f.id+" en");
    assert.ok(professionalFormulaExplanation("hydraulics",f.id,"ar"),f.id+" ar");
  }
});
