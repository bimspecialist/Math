import test from "node:test";
import assert from "node:assert/strict";
import { evaluateExpression } from "../src/calculator/math-engine.js";
import { CalculatorController } from "../src/calculator/calculator-controller.js";
import { renderCalculatorMarkup } from "../src/calculator/render-calculator.js";

test("Scientific Calculator never labels unsafe integers as exact",()=>{
  const literal=evaluateExpression("9007199254740993");
  assert.equal(literal.kind,"value");
  assert.equal(literal.exact,undefined);

  const overflow=evaluateExpression("9007199254740991+1");
  assert.equal(overflow.kind,"value");
  assert.equal(overflow.exact,undefined);

  const factorial=evaluateExpression("50!");
  assert.equal(factorial.kind,"value");
  assert.equal(factorial.exact,undefined);
});

test("Scientific Calculator preserves exact fractions while values remain safe",()=>{
  assert.equal(evaluateExpression("1/2+1/3").exact,"5/6");
  assert.equal(evaluateExpression("12.5/5").exact,"5/2");
  assert.equal(evaluateExpression("nCr(20,2)").exact,"190");
});

test("Scientific Calculator rejects tangent singularities instead of huge floating artifacts",()=>{
  assert.deepEqual(evaluateExpression("tan(90)",{angleMode:"DEG"}),{kind:"error",code:"DOMAIN_ERROR"});
  assert.deepEqual(evaluateExpression("tan(pi/2)",{angleMode:"RAD"}),{kind:"error",code:"DOMAIN_ERROR"});
  const finite=evaluateExpression("tan(45)",{angleMode:"DEG"});
  assert.equal(finite.kind,"value");
  assert.ok(Math.abs(finite.numeric-1)<1e-12);
});

test("Scientific SOLVE verifies residuals and uses a bracket fallback when Newton stalls",()=>{
  const c=new CalculatorController();
  c.field.setCanonicalExpression("X^3-1=0");
  assert.equal(c._solveVariable("X",0),true);
  assert.ok(Math.abs(Number(c.view().result)-1)<1e-10);

  const impossible=new CalculatorController();
  impossible.field.setCanonicalExpression("X^2+1=0");
  assert.equal(impossible._solveVariable("X",0),false);
  assert.equal(impossible.view().result,"SOLVE_NO_CONVERGENCE");
  assert.equal(impossible.view().lastResult,undefined);
});

test("Scientific calculator status exposes memory and exact/decimal mode",()=>{
  const c=new CalculatorController();
  c.dispatch("DIGIT_5");c.dispatch("EQUALS");c.dispatch("SHIFT");c.dispatch("RCL");
  let html=renderCalculatorMarkup(c.view(),"en");
  assert.match(html,/class="active">M<\/span>/);
  assert.match(html,/>EX<\/span>/);
  c.dispatch("S_D");
  html=renderCalculatorMarkup(c.view(),"en");
  assert.match(html,/>DEC<\/span>/);
});

test("Scientific calculator localizes engine errors and accessibility labels",()=>{
  const c=new CalculatorController();
  c.field.setCanonicalExpression("1/0");
  c.dispatch("EQUALS");
  const en=renderCalculatorMarkup(c.view(),"en");
  const ar=renderCalculatorMarkup(c.view(),"ar");
  assert.match(en,/Division by zero\./);
  assert.match(ar,/قسمة على صفر/);
  assert.match(en,/aria-label="Expression"/);
  assert.match(ar,/aria-label="التعبير"/);
});
