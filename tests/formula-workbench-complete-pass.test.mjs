import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FORMULAS, filterFormulas } from "../src/formulas/formula-library.js";
import { evaluateFormulaDefinition, evaluateProfessionalFormula, inferReferenceVariables } from "../src/knowledge/formula-workbench.js";
import { getProfessionalFormula } from "../src/knowledge/professional-libraries.js";

const byId=id=>FORMULAS.find(x=>x.id===id);

test("Formula Library marks supported reference formulas as calculable",()=>{
  for(const id of ["slope","percent","pyth","tri-area","rect-area","circle-area","circle-circ","sphere-vol","sphere-area","cyl-vol","cone-vol","zscore","arith-n","arith-sum","geo-n","geo-sum","geo-inf"]){
    const formula=byId(id);
    assert.ok(formula?.calculator?.calcExpression,id);
    assert.ok(formula.calculator.variables.length>0,id);
  }
  assert.equal(byId("der-chain").calculator,null);
  assert.equal(byId("matmul").calculator,null);
});

test("Supported reference calculators return mathematically correct results",()=>{
  let r=evaluateFormulaDefinition(byId("circle-area").calculator,{r:2});
  assert.equal(r.ok,true);
  assert.ok(Math.abs(r.value-4*Math.PI)<1e-12);

  r=evaluateFormulaDefinition(byId("pyth").calculator,{a:3,b:4});
  assert.equal(r.ok,true);
  assert.equal(r.value,5);

  r=evaluateFormulaDefinition(byId("percent").calculator,{part:25,whole:200});
  assert.equal(r.ok,true);
  assert.equal(r.value,12.5);
  assert.equal(r.unit,"%");

  r=evaluateFormulaDefinition(byId("zscore").calculator,{x:85,mu:70,sigma:5});
  assert.equal(r.ok,true);
  assert.equal(r.value,3);
});

test("Formula calculators enforce domain constraints instead of producing misleading values",()=>{
  assert.equal(evaluateFormulaDefinition(byId("percent").calculator,{part:5,whole:0}).code,"DIVISION_BY_ZERO");
  assert.equal(evaluateFormulaDefinition(byId("zscore").calculator,{x:5,mu:2,sigma:0}).code,"VALUE_BELOW_MINIMUM");
  assert.equal(evaluateFormulaDefinition(byId("geo-inf").calculator,{a1:10,r:1}).code,"OUTSIDE_FORMULA_DOMAIN");
  assert.equal(evaluateFormulaDefinition(byId("geo-sum").calculator,{a1:10,r:1,n:5}).code,"INVALID_VALUE");
  assert.equal(evaluateFormulaDefinition(byId("arith-n").calculator,{a1:1,n:2.5,d:3}).code,"INTEGER_REQUIRED");
});

test("Professional formulas preserve domain validation before evaluation",()=>{
  const currentRatio=getProfessionalFormula("accounting","current-ratio");
  const r=evaluateProfessionalFormula(currentRatio,{CurrentAssets:100,CurrentLiabilities:0});
  assert.equal(r.ok,false);
  assert.equal(r.code,"VALUE_BELOW_MINIMUM");
});

test("Reference-only formulas still infer substitution variables without claiming calculation support",()=>{
  const chain=byId("der-chain");
  const vars=inferReferenceVariables(chain.formula);
  assert.ok(vars.length>0);
  assert.equal(chain.calculator,null);
});

test("Formula search remains bilingual and capability metadata does not break filtering",()=>{
  assert.ok(filterFormulas({query:"circle"}).some(x=>x.id==="circle-area"));
  assert.ok(filterFormulas({query:"مساحة الدائرة"}).some(x=>x.id==="circle-area"));
  assert.ok(filterFormulas({category:"geometry",query:""}).every(x=>x.category==="geometry"));
});

test("Formula UI distinguishes calculable and reference-only workflows",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/id="formula-detail-capability"/);
  assert.match(app,/calculableFormula/);
  assert.match(app,/referenceOnlyFormula/);
  assert.match(app,/evaluateFormulaDefinition/);
  assert.match(app,/viewReference/);
  assert.match(app,/formulaConsistentUnits/);
});
