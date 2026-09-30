import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getProfessionalLibrary, getProfessionalFormula } from "../src/knowledge/professional-libraries.js";
import { evaluateProfessionalFormula } from "../src/knowledge/formula-workbench.js";
import { professionalFormulaExplanation } from "../src/knowledge/formula-explanations.js";

const calc=(id,values)=>evaluateProfessionalFormula(getProfessionalFormula("pmp",id),values);

test("PMP Library includes expanded EVM and PERT toolkit",()=>{
  const pmp=getProfessionalLibrary("pmp");
  for(const id of ["cpi","spi","cv","sv","eac-cpi","eac-cpi-spi","eac-remaining","etc","vac","percent-complete","percent-spent","tcpi","tcpi-eac","pert","pert-stddev","pert-variance"]){
    assert.ok(pmp.formulas.some(x=>x.id===id),id);
  }
});

test("Core EVM indicators calculate correctly",()=>{
  let r=calc("cpi",{EV:80,AC:100});
  assert.equal(r.ok,true); assert.equal(r.value,0.8);

  r=calc("spi",{EV:80,PV:100});
  assert.equal(r.ok,true); assert.equal(r.value,0.8);

  r=calc("cv",{EV:80,AC:100});
  assert.equal(r.value,-20);

  r=calc("sv",{EV:80,PV:100});
  assert.equal(r.value,-20);
});

test("PMP denominator constraints reject undefined indices",()=>{
  assert.equal(calc("cpi",{EV:10,AC:0}).code,"VALUE_BELOW_MINIMUM");
  assert.equal(calc("spi",{EV:10,PV:0}).code,"VALUE_BELOW_MINIMUM");
  assert.equal(calc("eac-cpi",{BAC:1000,CPI:0}).code,"VALUE_BELOW_MINIMUM");
  assert.equal(calc("percent-complete",{EV:100,BAC:0}).code,"VALUE_BELOW_MINIMUM");
  assert.equal(calc("percent-spent",{AC:100,BAC:0}).code,"VALUE_BELOW_MINIMUM");
});

test("EAC methods preserve their distinct forecasting assumptions",()=>{
  let r=calc("eac-cpi",{BAC:1000,CPI:0.8});
  assert.equal(r.ok,true); assert.equal(r.value,1250);

  r=calc("eac-remaining",{AC:400,BAC:1000,EV:500});
  assert.equal(r.ok,true); assert.equal(r.value,900);

  r=calc("eac-cpi-spi",{AC:400,BAC:1000,EV:500,CPI:0.8,SPI:0.9});
  assert.equal(r.ok,true);
  assert.ok(Math.abs(r.value-(400+500/0.72))<1e-10);
});

test("ETC and VAC remain arithmetically consistent",()=>{
  const etc=calc("etc",{EAC:1200,AC:450});
  const vac=calc("vac",{BAC:1000,EAC:1200});
  assert.equal(etc.ok,true); assert.equal(etc.value,750);
  assert.equal(vac.ok,true); assert.equal(vac.value,-200);
  assert.equal(calc("etc",{EAC:400,AC:450}).code,"EAC_BELOW_AC");
});

test("TCPI validates whether the selected target still has remaining cost capacity",()=>{
  let r=calc("tcpi",{BAC:1000,EV:600,AC:500});
  assert.equal(r.ok,true); assert.equal(r.value,0.8);

  r=calc("tcpi-eac",{BAC:1000,EV:600,EAC:1200,AC:500});
  assert.equal(r.ok,true);
  assert.ok(Math.abs(r.value-400/700)<1e-12);

  assert.equal(calc("tcpi",{BAC:1000,EV:900,AC:1000}).code,"TCPI_TARGET_EXHAUSTED");
  assert.equal(calc("tcpi-eac",{BAC:1000,EV:900,EAC:1000,AC:1000}).code,"TCPI_TARGET_EXHAUSTED");
});

test("Earned-value and spending percentages use BAC consistently",()=>{
  assert.equal(calc("percent-complete",{EV:450,BAC:1000}).value,45);
  assert.equal(calc("percent-spent",{AC:500,BAC:1000}).value,50);
});

test("PERT expected duration standard deviation and variance are consistent",()=>{
  const expected=calc("pert",{O:4,M:7,P:10});
  const sd=calc("pert-stddev",{O:4,P:10});
  const variance=calc("pert-variance",{O:4,P:10});
  assert.equal(expected.ok,true); assert.equal(expected.value,7);
  assert.equal(sd.value,1);
  assert.equal(variance.value,1);
});

test("PERT rejects logically misordered three-point estimates",()=>{
  assert.equal(calc("pert",{O:8,M:6,P:10}).code,"PERT_ESTIMATE_ORDER");
  assert.equal(calc("pert",{O:4,M:12,P:10}).code,"PERT_ESTIMATE_ORDER");
  assert.equal(calc("pert-stddev",{O:10,P:4}).code,"PERT_ESTIMATE_ORDER");
});

test("Every PMP formula has bilingual explanatory guidance",()=>{
  const pmp=getProfessionalLibrary("pmp");
  for(const formula of pmp.formulas){
    assert.ok(professionalFormulaExplanation("pmp",formula.id,"en"),formula.id+" en");
    assert.ok(professionalFormulaExplanation("pmp",formula.id,"ar"),formula.id+" ar");
  }
});

test("PMP UI maps project-control validation errors",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(app,/PERT_ESTIMATE_ORDER:"pertEstimateOrder"/);
  assert.match(app,/TCPI_TARGET_EXHAUSTED:"tcpiTargetExhausted"/);
  assert.match(app,/EAC_BELOW_AC:"eacBelowActualCost"/);
  assert.match(strings,/pertEstimateOrder/);
  assert.match(strings,/tcpiTargetExhausted/);
  assert.match(strings,/eacBelowActualCost/);
});
