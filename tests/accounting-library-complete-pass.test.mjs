import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getProfessionalLibrary, getProfessionalFormula } from "../src/knowledge/professional-libraries.js";
import { evaluateProfessionalFormula } from "../src/knowledge/formula-workbench.js";
import { professionalFormulaExplanation } from "../src/knowledge/formula-explanations.js";

test("Accounting Library includes the expanded core analysis set",()=>{
  const accounting=getProfessionalLibrary("accounting");
  assert.ok(accounting);
  for(const id of ["gross-profit","gross-margin","operating-margin","net-margin","current-ratio","working-capital","quick-ratio","debt-equity","roa","asset-turnover","roe","contribution-margin-unit","break-even","inventory-turnover"]){
    assert.ok(accounting.formulas.some(x=>x.id===id),id);
  }
});

test("Accounting profitability formulas calculate correctly",()=>{
  let r=evaluateProfessionalFormula(getProfessionalFormula("accounting","gross-margin"),{Revenue:1000,COGS:600});
  assert.equal(r.ok,true);
  assert.equal(r.value,40);
  assert.equal(r.unit,"%");

  r=evaluateProfessionalFormula(getProfessionalFormula("accounting","operating-margin"),{OperatingIncome:-50,Revenue:1000});
  assert.equal(r.ok,true);
  assert.equal(r.value,-5);

  r=evaluateProfessionalFormula(getProfessionalFormula("accounting","asset-turnover"),{Revenue:1500,AverageAssets:1000});
  assert.equal(r.ok,true);
  assert.equal(r.value,1.5);
});

test("Accounting liquidity formulas reject undefined denominators",()=>{
  for(const [id,values] of [
    ["current-ratio",{CurrentAssets:100,CurrentLiabilities:0}],
    ["quick-ratio",{Cash:10,Receivables:20,MarketableSecurities:5,CurrentLiabilities:0}],
    ["inventory-turnover",{COGS:500,AverageInventory:0}],
    ["roa",{NetIncome:50,AverageAssets:0}],
    ["roe",{NetIncome:50,AverageEquity:0}],
    ["debt-equity",{TotalDebt:100,Equity:0}]
  ]){
    const r=evaluateProfessionalFormula(getProfessionalFormula("accounting",id),values);
    assert.equal(r.ok,false,id);
    assert.ok(["VALUE_BELOW_MINIMUM","DIVISION_BY_ZERO"].includes(r.code),id+":"+r.code);
  }
});

test("Break-even enforces a positive contribution margin",()=>{
  const formula=getProfessionalFormula("accounting","break-even");
  let r=evaluateProfessionalFormula(formula,{FixedCosts:12000,PricePerUnit:50,VariableCostPerUnit:30});
  assert.equal(r.ok,true);
  assert.equal(r.value,600);

  r=evaluateProfessionalFormula(formula,{FixedCosts:12000,PricePerUnit:30,VariableCostPerUnit:30});
  assert.equal(r.ok,false);
  assert.equal(r.code,"NONPOSITIVE_CONTRIBUTION_MARGIN");

  r=evaluateProfessionalFormula(formula,{FixedCosts:12000,PricePerUnit:25,VariableCostPerUnit:30});
  assert.equal(r.ok,false);
  assert.equal(r.code,"NONPOSITIVE_CONTRIBUTION_MARGIN");
});

test("Contribution margin and working capital preserve diagnostic negative results",()=>{
  let r=evaluateProfessionalFormula(getProfessionalFormula("accounting","contribution-margin-unit"),{PricePerUnit:20,VariableCostPerUnit:25});
  assert.equal(r.ok,true);
  assert.equal(r.value,-5);

  r=evaluateProfessionalFormula(getProfessionalFormula("accounting","working-capital"),{CurrentAssets:80,CurrentLiabilities:100});
  assert.equal(r.ok,true);
  assert.equal(r.value,-20);
});

test("Accounting explanations exist in both languages for every formula",()=>{
  const accounting=getProfessionalLibrary("accounting");
  for(const formula of accounting.formulas){
    const en=professionalFormulaExplanation("accounting",formula.id,"en");
    const ar=professionalFormulaExplanation("accounting",formula.id,"ar");
    assert.ok(en&&en!==formula.titleEn,formula.id+" en");
    assert.ok(ar&&ar!==formula.titleAr,formula.id+" ar");
  }
});

test("Accounting calculator UI maps domain errors and numeric constraints",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  assert.match(app,/NONPOSITIVE_CONTRIBUTION_MARGIN:"nonpositiveContributionMargin"/);
  assert.match(app,/variable\.integer\?"1":"any"/);
  assert.match(app,/exclusiveMin/);
  assert.match(strings,/nonpositiveContributionMargin/);
});
