import test from "node:test";
import assert from "node:assert/strict";
import { PROFESSIONAL_LIBRARIES } from "../src/knowledge/professional-libraries.js";
import { FORMULAS, FORMULA_CATEGORIES } from "../src/formulas/formula-library.js";
import { UI_STRINGS } from "../src/i18n/ui-strings.js";

const RESERVED=new Set([
  "sin","cos","tan","asin","acos","atan","sinh","cosh","tanh","asinh","acosh","atanh",
  "sqrt","cbrt","root","abs","sign","floor","ceil","round","trunc","int","frac",
  "log","ln","exp","pow10","mod","rem","gcd","lcm","ncr","npr","min","max","mean","avg",
  "sum","prod","std","stdev","stdp","hypot","atan2","deg","rad","grad","dms","rand","randint",
  "gamma","lgamma","erf","erfc","normalpdf","normalcdf","binompdf","binomcdf","poissonpdf","poissoncdf",
  "pi","e","ans","c0","hplanck","hbar","qe","kb","na","gasr","grav","g0","me","mp","eps0","mu0","sigma_sb","atm","au","ly","tau","phi","epsmach","eps"
]);

test("English and Arabic UI dictionaries expose the same resource keys",()=>{
  const en=Object.keys(UI_STRINGS.en).sort();
  const ar=Object.keys(UI_STRINGS.ar).sort();
  assert.deepEqual(ar,en);
  for(const key of en){
    assert.ok(String(UI_STRINGS.en[key]).trim(),`empty English UI string: ${key}`);
    assert.ok(String(UI_STRINGS.ar[key]).trim(),`empty Arabic UI string: ${key}`);
  }
});

test("professional libraries have unique stable identities and bilingual metadata",()=>{
  const libraryIds=new Set();
  for(const library of PROFESSIONAL_LIBRARIES){
    assert.match(library.id,/^[a-z0-9-]+$/);
    assert.ok(!libraryIds.has(library.id),`duplicate library id: ${library.id}`);
    libraryIds.add(library.id);
    assert.ok(library.labelEn?.trim(),`missing English label: ${library.id}`);
    assert.ok(library.labelAr?.trim(),`missing Arabic label: ${library.id}`);
    assert.ok(library.descriptionEn?.trim(),`missing English description: ${library.id}`);
    assert.ok(library.descriptionAr?.trim(),`missing Arabic description: ${library.id}`);
  }
});

test("professional formulas have valid variables constraints and calculation symbols",()=>{
  for(const library of PROFESSIONAL_LIBRARIES){
    const ids=new Set();
    for(const formula of library.formulas){
      assert.match(formula.id,/^[a-z0-9-]+$/,`${library.id}/${formula.id}`);
      assert.ok(!ids.has(formula.id),`duplicate formula id in ${library.id}: ${formula.id}`);
      ids.add(formula.id);
      assert.ok(formula.titleEn?.trim(),`missing English title: ${library.id}/${formula.id}`);
      assert.ok(formula.titleAr?.trim(),`missing Arabic title: ${library.id}/${formula.id}`);
      assert.ok(formula.formulaEn?.trim(),`missing English formula: ${library.id}/${formula.id}`);
      assert.ok(formula.formulaAr?.trim(),`missing Arabic formula: ${library.id}/${formula.id}`);

      const variables=formula.variables??[];
      const variableIds=new Set();
      for(const variable of variables){
        assert.match(variable.id,/^[A-Za-z][A-Za-z0-9_]*$/,`invalid variable id: ${library.id}/${formula.id}/${variable.id}`);
        assert.ok(!variableIds.has(variable.id),`duplicate variable: ${library.id}/${formula.id}/${variable.id}`);
        variableIds.add(variable.id);
        assert.ok(variable.labelEn?.trim(),`missing English variable label: ${library.id}/${formula.id}/${variable.id}`);
        assert.ok(variable.labelAr?.trim(),`missing Arabic variable label: ${library.id}/${formula.id}/${variable.id}`);
        if(variable.min!==undefined&&variable.max!==undefined)assert.ok(Number(variable.min)<=Number(variable.max),`min > max: ${library.id}/${formula.id}/${variable.id}`);
        if(variable.exclusiveMin!==undefined&&variable.max!==undefined)assert.ok(Number(variable.exclusiveMin)<Number(variable.max),`exclusiveMin >= max: ${library.id}/${formula.id}/${variable.id}`);
      }

      if(formula.calcExpression){
        const tokens=[...String(formula.calcExpression).matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)].map(m=>m[0]);
        for(const token of tokens){
          const lower=token.toLowerCase();
          assert.ok(variableIds.has(token)||RESERVED.has(lower),`undeclared symbol ${token} in ${library.id}/${formula.id}`);
        }
      }
    }
  }
});

test("reference formula library has valid categories unique ids and bilingual copy",()=>{
  const categories=new Set(FORMULA_CATEGORIES.map(x=>x.id));
  const ids=new Set();
  for(const formula of FORMULAS){
    assert.ok(categories.has(formula.category),`unknown category: ${formula.id}/${formula.category}`);
    assert.ok(!ids.has(formula.id),`duplicate reference formula id: ${formula.id}`);
    ids.add(formula.id);
    assert.ok(formula.titleEn?.trim(),`missing English title: ${formula.id}`);
    assert.ok(formula.titleAr?.trim(),`missing Arabic title: ${formula.id}`);
    assert.ok(formula.descriptionEn?.trim(),`missing English description: ${formula.id}`);
    assert.ok(formula.descriptionAr?.trim(),`missing Arabic description: ${formula.id}`);
    const variables=formula.calculator?.variables??[];
    const variableIds=new Set();
    for(const variable of variables){
      assert.ok(!variableIds.has(variable.id),`duplicate reference variable: ${formula.id}/${variable.id}`);
      variableIds.add(variable.id);
      assert.ok(variable.labelEn?.trim(),`missing English reference variable label: ${formula.id}/${variable.id}`);
      assert.ok(variable.labelAr?.trim(),`missing Arabic reference variable label: ${formula.id}/${variable.id}`);
    }
  }
});
