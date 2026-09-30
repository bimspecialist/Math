import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getProfessionalLibrary, getProfessionalFormula } from "../src/knowledge/professional-libraries.js";
import { evaluateProfessionalFormula } from "../src/knowledge/formula-workbench.js";
import { professionalFormulaExplanation } from "../src/knowledge/formula-explanations.js";

const calc=(id,values)=>evaluateProfessionalFormula(getProfessionalFormula("design-construction",id),values);

test("Design and Construction library spans core undergraduate topics",()=>{
  const lib=getProfessionalLibrary("design-construction");
  assert.ok(lib);
  assert.ok(lib.formulas.length>=76,lib.formulas.length);
  for(const topic of ["Site & earthwork","Concrete & formwork","Reinforcement","Masonry & finishes","Preliminary loads","Stairs & ramps","Estimating & productivity","Equipment","Scheduling","Survey & layout","Building metrics"]){
    assert.ok(lib.formulas.some(x=>x.topicEn===topic),topic);
  }
});

test("Earthwork and quantity formulas calculate correctly",()=>{
  assert.equal(calc("excavation-volume",{L:10,W:5,D:2}).value,100);
  assert.equal(calc("average-end-area",{L:20,A1:10,A2:14}).value,240);
  assert.equal(calc("loose-volume-swell",{Vbank:100,s:0.2}).value,120);
  assert.equal(calc("compacted-volume-shrinkage",{Vbank:100,sh:0.1}).value,90);
  assert.equal(calc("backfill-volume",{Vexc:100,Vstructure:30}).value,70);
  assert.equal(calc("backfill-volume",{Vexc:20,Vstructure:30}).code,"STRUCTURE_EXCEEDS_EXCAVATION");
});

test("Concrete formwork and reinforcement formulas calculate correctly",()=>{
  assert.equal(calc("slab-concrete-volume",{L:10,W:5,t:0.2}).value,10);
  assert.equal(calc("beam-formwork-three-sides",{b:0.3,h:0.6,L:5}).value,7.5);
  assert.ok(Math.abs(calc("dc-rebar-area",{d:16}).value-Math.PI*64)<1e-10);
  assert.ok(calc("dc-rebar-unit-mass",{d:16}).value>1.5);
  assert.equal(calc("reinforcement-ratio",{As:1000,b:300,d:500}).value,1000/(300*500)*100);
});

test("Masonry and finishes enforce geometric consistency",()=>{
  assert.equal(calc("net-wall-area",{L:5,H:3,Aopen:3}).value,12);
  assert.equal(calc("net-wall-area",{L:2,H:2,Aopen:5}).code,"OPENINGS_EXCEED_WALL");
  assert.equal(calc("plaster-area-two-faces",{Anet:12}).value,24);
  assert.equal(calc("paint-volume",{A:100,coats:2,coverage:10}).value,20);
});

test("Preliminary load and stair formulas provide standard screening calculations",()=>{
  assert.ok(Math.abs(calc("slab-dead-load",{gamma:24,t:0.2}).value-4.8)<1e-12);
  assert.ok(Math.abs(calc("wall-line-load",{gamma:18,t:0.2,H:3}).value-10.8)<1e-12);
  assert.equal(calc("simple-udl-moment",{w:10,L:4}).value,20);
  assert.equal(calc("cantilever-udl-moment",{w:10,L:4}).value,80);
  assert.equal(calc("ramp-slope-percent",{Rise:1,Run:20}).value,5);
  assert.equal(calc("stair-slope-length",{Rise:3,Run:4}).value,5);
});

test("Estimating productivity equipment and scheduling formulas calculate correctly",()=>{
  assert.equal(calc("direct-cost",{Materials:100,Labor:50,Equipment:25,Subcontract:25}).value,200);
  assert.equal(calc("unit-cost",{TotalCost:1000,Q:100}).value,10);
  assert.equal(calc("labor-productivity",{Q:80,LH:40}).value,2);
  assert.equal(calc("crew-duration",{Q:100,Crew:5,Pperson:4}).value,5);
  assert.equal(calc("equipment-cycle-time",{Tload:5,Thaul:15,Tdump:3,Treturn:12}).value,35);
  assert.equal(calc("activity-duration",{Q:500,DailyProduction:100}).value,5);
  assert.equal(calc("total-float",{LS:10,ES:7}).value,3);
});

test("Surveying and building metrics formulas include validation",()=>{
  assert.equal(calc("rectangle-diagonal",{L:3,W:4}).value,5);
  assert.equal(calc("height-of-instrument",{RLbm:100,BS:1.5}).value,101.5);
  assert.equal(calc("reduced-level",{HI:101.5,FS:2}).value,99.5);
  assert.equal(calc("site-coverage",{Footprint:400,SiteArea:1000}).value,40);
  assert.equal(calc("site-coverage",{Footprint:1200,SiteArea:1000}).code,"FOOTPRINT_EXCEEDS_SITE");
  assert.equal(calc("net-to-gross",{NFA:900,GFA:1000}).value,90);
});

test("Code-dependent design items remain reference-only",()=>{
  for(const id of ["development-length-reference","load-combinations-reference","stair-code-reference"]){
    const formula=getProfessionalFormula("design-construction",id);
    assert.equal(formula.calcExpression,null,id);
    assert.equal(evaluateProfessionalFormula(formula,{}).code,"REFERENCE_ONLY",id);
  }
});

test("Design and Construction UI exposes navigation and topic filtering",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(index,/data-knowledge-library="design-construction"/);
  assert.match(index,/navDesignConstructionLibrary/);
  assert.match(index,/id="knowledge-topic"/);
});

test("Every Design and Construction formula has bilingual guidance",()=>{
  const lib=getProfessionalLibrary("design-construction");
  for(const formula of lib.formulas){
    assert.ok(professionalFormulaExplanation("design-construction",formula.id,"en"),formula.id+" en");
    assert.ok(professionalFormulaExplanation("design-construction",formula.id,"ar"),formula.id+" ar");
  }
});

test("Every calculable Design and Construction formula executes with valid smoke-test values",()=>{
  const lib=getProfessionalLibrary("design-construction");
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
      else if(rule.kind==="gteExpr"){
        if(formula.id==="net-wall-area"){values.L=2;values.H=2;values.Aopen=1}
      }
    }
    const result=evaluateProfessionalFormula(formula,values);
    assert.equal(result.ok,true,`${formula.id}: ${result.code??"unknown"}`);
    assert.ok(Number.isFinite(result.value),formula.id+" finite result");
  }
});
