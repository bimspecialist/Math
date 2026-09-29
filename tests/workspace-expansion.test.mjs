import test from "node:test";
import assert from "node:assert/strict";
import { FORMULAS, filterFormulas, FORMULA_CATEGORIES } from "../src/formulas/formula-library.js";
import { runMathLabScript } from "../src/mathlab/math-lab-engine.js";
import { readFileSync } from "node:fs";

test("formula library spans the core requested mathematical categories",()=>{
  for(const id of ["algebra","geometry","trigonometry","calculus","statistics","sequences","complex","linear-algebra"])
    assert.ok(FORMULA_CATEGORIES.some(x=>x.id===id),id);
  assert.ok(FORMULAS.length>=30);
});

test("formula library filters by category and free text",()=>{
  const trig=filterFormulas({category:"trigonometry",query:"sin"});
  assert.ok(trig.length>0);
  assert.ok(trig.every(x=>x.category==="trigonometry"));
  const pyth=filterFormulas({category:"all",query:"Pythagorean"});
  assert.ok(pyth.some(x=>/a²/.test(x.formula)||/c²/.test(x.formula)));
});

test("Math Lab evaluates assignments and reuses workspace variables",()=>{
  const r=runMathLabScript("a = 5\nb = a^2 + 3\nb");
  assert.equal(r.ok,true);
  assert.equal(r.workspace.a,5);
  assert.equal(r.workspace.b,28);
  assert.equal(r.outputs.at(-1).value,28);
});

test("Math Lab parses matrices and computes determinant and transpose",()=>{
  const r=runMathLabScript("A = [1,2;3,4]\ndet(A)\ntranspose(A)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.A,[[1,2],[3,4]]);
  assert.equal(r.outputs[1].value,-2);
  assert.deepEqual(r.outputs[2].value,[[1,3],[2,4]]);
});

test("application shell exposes sidebar, formulas and Math Lab pages",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/id="tool-sidebar"/);
  assert.match(index,/data-tool-target="formulas"/);
  assert.match(index,/id="formulas-section"/);
  assert.match(index,/id="mathlab-section"/);
  assert.match(index,/id="formula-search"/);
  assert.match(index,/id="formula-category"/);
  assert.match(index,/id="mathlab-run"/);
  assert.match(app,/renderFormulaLibrary/);
  assert.match(app,/runMathLabScript/);
});


test("unit converter handles core engineering categories",async()=>{
  const {convertUnit, CONVERTER_CATEGORIES}=await import("../src/converters/unit-converter.js");
  assert.equal(convertUnit("length",1,"km","m"),1000);
  assert.equal(convertUnit("temperature",0,"C","F"),32);
  assert.ok(Math.abs(convertUnit("angle",180,"deg","rad")-Math.PI)<1e-12);
  assert.equal(convertUnit("data",1,"MB","B"),1000000);
  for(const id of ["volume","length","mass","temperature","energy","area","speed","time","power","data","pressure","angle"])
    assert.ok(CONVERTER_CATEGORIES[id],id);
});

test("sidebar exposes converter categories and shared converter page",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(index,/id="converter-section"/);
  assert.match(index,/data-converter-category="length"/);
  assert.match(index,/data-converter-category="temperature"/);
  assert.match(index,/id="converter-input"/);
  assert.match(index,/id="converter-result"/);
});

test("language toggle no longer depends on removed top-tab markup",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.doesNotMatch(app,/data-tab-target/);
});


test("graphing engine samples expressions in mathematical RAD mode",async()=>{
  const {sampleGraphExpression}=await import("../src/graphing/graph-engine.js");
  const r=sampleGraphExpression("x^2",{minX:-2,maxX:2,points:5});
  assert.equal(r.ok,true);
  assert.deepEqual(r.samples.map(p=>p.y),[4,1,0,1,4]);
  const s=sampleGraphExpression("sin(x)",{minX:0,maxX:Math.PI/2,points:2});
  assert.ok(Math.abs(s.samples[1].y-1)<1e-10);
});

test("graphing engine marks domain gaps instead of crashing",async()=>{
  const {sampleGraphExpression}=await import("../src/graphing/graph-engine.js");
  const r=sampleGraphExpression("1/x",{minX:-1,maxX:1,points:3});
  assert.equal(r.ok,true);
  assert.equal(r.samples[1].y,null);
});

test("programmer engine converts bases and performs bitwise operations",async()=>{
  const {parseInteger,formatInteger,bitwise}=await import("../src/programmer/programmer-engine.js");
  assert.equal(parseInteger("FF",16),255n);
  assert.equal(formatInteger(255n,2),"11111111");
  assert.equal(bitwise("and",0b1100n,0b1010n),0b1000n);
  assert.equal(bitwise("xor",0b1100n,0b1010n),0b0110n);
  assert.equal(bitwise("shl",3n,2n),12n);
});

test("application shell exposes Graphing and Programmer tools",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/data-tool-target="graphing"/);
  assert.match(index,/id="graphing-section"/);
  assert.match(index,/id="graph-expression"/);
  assert.match(index,/data-tool-target="programmer"/);
  assert.match(index,/id="programmer-section"/);
  assert.match(index,/id="programmer-input"/);
  assert.match(app,/sampleGraphExpression/);
  assert.match(app,/parseInteger/);
});


test("date calculator computes day differences and date offsets without DST drift",async()=>{
  const {daysBetween,addDays}=await import("../src/date/date-calculator.js");
  assert.equal(daysBetween("2026-01-01","2026-01-31"),30);
  assert.equal(addDays("2026-01-31",1),"2026-02-01");
  assert.equal(addDays("2024-02-28",1),"2024-02-29");
});

test("application shell exposes date calculation tool",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/data-tool-target="date"/);
  assert.match(index,/id="date-section"/);
  assert.match(index,/id="date-start"/);
  assert.match(index,/id="date-end"/);
  assert.match(app,/daysBetween/);
  assert.match(app,/addDays/);
});

test("English is the default site language and Arabic is the alternate locale",async()=>{
  const {readFileSync}=await import("node:fs");
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(index,/<html[^>]*lang="en"[^>]*dir="ltr"/);
  assert.match(index,/id="lang-toggle"[^>]*>AR<\/button>/);
});

test("localization dictionary has complete English and Arabic terminology for every UI key",async()=>{
  const {UI_STRINGS}=await import("../src/i18n/ui-strings.js");
  assert.ok(UI_STRINGS.en&&UI_STRINGS.ar);
  const enKeys=Object.keys(UI_STRINGS.en).sort(),arKeys=Object.keys(UI_STRINGS.ar).sort();
  assert.deepEqual(arKeys,enKeys);
  assert.ok(enKeys.length>=55);
  for(const key of enKeys){
    assert.ok(String(UI_STRINGS.en[key]).trim(),"empty English "+key);
    assert.ok(String(UI_STRINGS.ar[key]).trim(),"empty Arabic "+key);
  }
  assert.equal(UI_STRINGS.en.navScientific,"Scientific");
  assert.equal(UI_STRINGS.ar.navScientific,"علمي");
  assert.equal(UI_STRINGS.en.navGraphing,"Graphing");
  assert.equal(UI_STRINGS.ar.navGraphing,"الرسم البياني");
  assert.equal(UI_STRINGS.en.navProgrammer,"Programmer");
  assert.equal(UI_STRINGS.ar.navProgrammer,"مبرمج");
  assert.equal(UI_STRINGS.en.navDateCalculation,"Date calculation");
  assert.equal(UI_STRINGS.ar.navDateCalculation,"حساب التاريخ");
});

test("site markup uses localization hooks for headings navigation controls and tool descriptions",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  for(const key of ["pageTitle","navScientific","navAdvancedSolver","navFormulaLibrary","navMathLab","navGraphing","navProgrammer","navDateCalculation","converterLength","converterTemperature","advancedTitle","formulaTitle","mathLabTitle","graphingTitle","programmerTitle","dateTitle","converterTitle"]){
    assert.match(index,new RegExp('data-i18n="'+key+'"'),key);
  }
});

test("language application updates html direction and rerenders localized dynamic content",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(app,/applyLocale/);
  assert.match(app,/document\.documentElement\.lang=locale/);
  assert.match(app,/document\.documentElement\.dir=locale==="ar"\?"rtl":"ltr"/);
  assert.match(app,/renderFormulaLibrary\(\)/);
});

test("site no longer hardcodes workspace content to RTL for English",()=>{
  const css=readFileSync(new URL("../styles/calculator.css",import.meta.url),"utf8");
  assert.match(css,/\.workspace-content\{[^}]*direction:ltr/);
  assert.match(css,/html\[dir="rtl"\] \.workspace-content\{direction:rtl\}/);
});

test("every formula has reviewed English and Arabic titles and descriptions",()=>{
  for(const formula of FORMULAS){
    assert.ok(formula.titleEn?.trim(),"missing English title "+formula.id);
    assert.ok(formula.titleAr?.trim(),"missing Arabic title "+formula.id);
    assert.ok(formula.descriptionEn?.trim(),"missing English description "+formula.id);
    assert.ok(formula.descriptionAr?.trim(),"missing Arabic description "+formula.id);
  }
});

test("English-first source markup contains no hardcoded Arabic UI text",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.doesNotMatch(index,/[\u0600-\u06FF]/);
});

test("locale switching refreshes category-specific converter terminology",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  const block=app.match(/function applyLocale\(nextLocale\)\{[\s\S]*?\n\}/)?.[0]??"";
  assert.match(block,/selectConverterCategory\(activeConverterCategory\)/);
});

test("Advanced Solver result is reformatted when the language changes",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(app,/lastAdvancedResult/);
  assert.match(app,/formatAdvancedResult\(lastAdvancedResult,locale\)/);
});

test("Math Lab computes matrix inverse multiplication and trace",()=>{
  const r=runMathLabScript("A = [1,2;3,4]\nB = inv(A)\nmatmul(A,B)\ntrace(A)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.B,[[-2,1],[1.5,-0.5]]);
  const product=r.outputs[2].value;
  assert.ok(Math.abs(product[0][0]-1)<1e-10);
  assert.ok(Math.abs(product[0][1])<1e-10);
  assert.ok(Math.abs(product[1][0])<1e-10);
  assert.ok(Math.abs(product[1][1]-1)<1e-10);
  assert.equal(r.outputs[3].value,5);
});

test("Math Lab creates identity and zero matrices",()=>{
  const r=runMathLabScript("I = eye(3)\nZ = zeros(2,3)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.I,[[1,0,0],[0,1,0],[0,0,1]]);
  assert.deepEqual(r.workspace.Z,[[0,0,0],[0,0,0]]);
});

test("Math Lab rejects singular inverse and incompatible matrix multiplication",()=>{
  const singular=runMathLabScript("A = [1,2;2,4]\ninv(A)");
  assert.equal(singular.ok,false);
  assert.equal(singular.error.message,"SINGULAR_MATRIX");
  const mismatch=runMathLabScript("A = [1,2]\nB = [1,2]\nmatmul(A,B)");
  assert.equal(mismatch.ok,false);
  assert.equal(mismatch.error.message,"MATRIX_DIMENSION_MISMATCH");
});

test("Math Lab UI exposes an advanced matrix example",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(index,/data-mathlab-example="A = \[1,2;3,4\].*inv\(A\).*matmul\(A,B\)/s);
});

test("Math Lab solves linear systems from matrix coefficients",()=>{
  const r=runMathLabScript("A = [2,1;1,-1]\nb = [5;1]\nx = solve(A,b)\nx");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.x,[[2],[1]]);
  assert.deepEqual(r.outputs.at(-1).value,[[2],[1]]);
});

test("Math Lab reports singular linear systems instead of returning unstable values",()=>{
  const r=runMathLabScript("A = [1,2;2,4]\nb = [3;6]\nsolve(A,b)");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"SINGULAR_MATRIX");
});

test("graphing engine samples multiple functions independently",async()=>{
  const {sampleGraphExpressions}=await import("../src/graphing/graph-engine.js");
  const r=sampleGraphExpressions("sin(x)\ncos(x)",{minX:0,maxX:Math.PI/2,points:3});
  assert.equal(r.ok,true);
  assert.equal(r.series.length,2);
  assert.equal(r.series[0].expression,"sin(x)");
  assert.equal(r.series[1].expression,"cos(x)");
  assert.ok(Math.abs(r.series[0].samples.at(-1).y-1)<1e-10);
  assert.ok(Math.abs(r.series[1].samples[0].y-1)<1e-10);
});

test("graphing engine skips blank lines and limits the number of plotted functions",async()=>{
  const {sampleGraphExpressions}=await import("../src/graphing/graph-engine.js");
  const source=["x","","x^2","x^3","sin(x)","cos(x)","tan(x)","x+1"].join("\n");
  const r=sampleGraphExpressions(source,{minX:-1,maxX:1,points:5});
  assert.equal(r.ok,true);
  assert.equal(r.series.length,6);
});

test("Math Lab computes eigenvalues of a real 2x2 matrix",()=>{
  const r=runMathLabScript("A = [2,1;1,2]\neig(A)");
  assert.equal(r.ok,true);
  assert.deepEqual(r.outputs[1].value,[1,3]);
});

test("Math Lab computes eigenvectors for distinct real 2x2 eigenvalues",()=>{
  const r=runMathLabScript("A = [2,1;1,2]\neigvec(A)");
  assert.equal(r.ok,true);
  const v=r.outputs[1].value;
  assert.equal(v.length,2);
  assert.ok(v.every(x=>Array.isArray(x.vector)&&x.vector.length===2));
  for(const pair of v){
    const [x,y]=pair.vector,lambda=pair.value;
    assert.ok(Math.abs(2*x+y-lambda*x)<1e-8);
    assert.ok(Math.abs(x+2*y-lambda*y)<1e-8);
  }
});

test("graphing UI supports multiple expressions",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(index,/id="graph-expression"[^>]*textarea|<textarea[^>]*id="graph-expression"/);
  assert.match(index,/data-i18n="graphingMultiHint"/);
});

test("Math Lab provides MATLAB-style constructors and vector utilities",()=>{
  const r=runMathLabScript("O = ones(2,3)\nv = linspace(0,1,5)\ndiag([1,2;3,4])\nnorm([3,4])");
  assert.equal(r.ok,true);
  assert.deepEqual(r.workspace.O,[[1,1,1],[1,1,1]]);
  assert.deepEqual(r.workspace.v,[0,0.25,0.5,0.75,1]);
  assert.deepEqual(r.outputs[2].value,[1,4]);
  assert.equal(r.outputs[3].value,5);
});

test("Math Lab validates linspace count and matrix constructor sizes",()=>{
  const r=runMathLabScript("linspace(0,1,1)");
  assert.equal(r.ok,false);
  assert.equal(r.error.message,"INVALID_SAMPLE_COUNT");
});

test("Math Lab UI exposes a numerical sampling example",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(index,/data-mathlab-example="v = linspace\(0,1,5\).*norm\(\[3,4\]\)"/s);
  assert.match(index,/data-i18n="numericalTools"/);
});


test("Knowledge includes accounting engineering and PMP professional libraries",async()=>{
  const {PROFESSIONAL_LIBRARIES,getProfessionalLibrary}=await import("../src/knowledge/professional-libraries.js");
  for(const id of ["accounting","civil","pmp"]){
    const library=getProfessionalLibrary(id);
    assert.ok(library,id);
    assert.ok(library.formulas.length>=8,id+" formula count");
    assert.ok(library.formulas.every(x=>x.variables.length>0&&x.calcExpression),id+" calculators");
  }
  assert.equal(PROFESSIONAL_LIBRARIES.length,3);
});

test("professional formula workbench substitutes and calculates values safely",async()=>{
  const {getProfessionalFormula}=await import("../src/knowledge/professional-libraries.js");
  const {evaluateProfessionalFormula,substituteFormula}=await import("../src/knowledge/formula-workbench.js");
  const cpi=getProfessionalFormula("pmp","cpi");
  const result=evaluateProfessionalFormula(cpi,{EV:"120",AC:"100"});
  assert.equal(result.ok,true);
  assert.equal(result.value,1.2);
  assert.match(substituteFormula(cpi.formulaEn,{EV:120,AC:100}),/\(120\).*\(100\)/);
});

test("all general formula cards expose the interactive formula workbench",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/data-knowledge-library="accounting"/);
  assert.match(index,/data-knowledge-library="civil"/);
  assert.match(index,/data-knowledge-library="pmp"/);
  assert.match(index,/id="formula-detail-section"/);
  assert.match(app,/data-general-formula-id/);
  assert.match(app,/openReferenceFormula/);
  assert.match(app,/openProfessionalFormula/);
});


test("every professional formula has a bilingual explanation",async()=>{
  const {PROFESSIONAL_LIBRARIES}=await import("../src/knowledge/professional-libraries.js");
  const {professionalFormulaExplanation}=await import("../src/knowledge/formula-explanations.js");
  for(const library of PROFESSIONAL_LIBRARIES){
    for(const formula of library.formulas){
      assert.ok(professionalFormulaExplanation(library.id,formula.id,"en").trim(),library.id+"/"+formula.id+" en");
      assert.ok(professionalFormulaExplanation(library.id,formula.id,"ar").trim(),library.id+"/"+formula.id+" ar");
    }
  }
});

test("every general reference formula exposes an explanation in both locales",async()=>{
  const {FORMULAS}=await import("../src/formulas/formula-library.js");
  const {referenceFormulaExplanation}=await import("../src/knowledge/formula-explanations.js");
  for(const formula of FORMULAS){
    assert.ok(referenceFormulaExplanation(formula,"en").trim(),formula.id+" en");
    assert.ok(referenceFormulaExplanation(formula,"ar").trim(),formula.id+" ar");
  }
});

test("formula calculator UI renders explanation and variable guide",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/id="formula-detail-explanation"/);
  assert.match(index,/id="formula-variable-guide"/);
  assert.match(index,/data-i18n="formulaExplanationTitle"/);
  assert.match(app,/professionalFormulaExplanation/);
  assert.match(app,/referenceFormulaExplanation/);
});
