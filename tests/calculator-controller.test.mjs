import test from "node:test";
import assert from "node:assert/strict";
import { CalculatorController } from "../src/calculator/calculator-controller.js";

const enter=(c,ids)=>ids.forEach(id=>c.dispatch(id));

test("digits arithmetic equals and Ans are wired through key ids",()=>{const c=new CalculatorController();enter(c,["DIGIT_2","ADD","DIGIT_3","MULTIPLY","DIGIT_4","EQUALS"]);assert.equal(c.view().result,"14");c.dispatch("AC");c.dispatch("ANS");c.dispatch("ADD");c.dispatch("DIGIT_1");c.dispatch("EQUALS");assert.equal(c.view().result,"15")});
test("DEL and AC operate on the structured field",()=>{const c=new CalculatorController();enter(c,["DIGIT_1","DIGIT_2","DIGIT_3"]);c.dispatch("DEL");assert.equal(c.view().canonicalExpression,"12");c.dispatch("AC");assert.equal(c.view().canonicalExpression,"");assert.equal(c.view().result,"0")});
test("FRAC creates a vertical fraction while physical DIVIDE remains division",()=>{const a=new CalculatorController();a.dispatch("FRAC");const b=new CalculatorController();b.dispatch("DIVIDE");assert.match(a.view().mathHtml,/math-fraction/);assert.equal(b.view().canonicalExpression,"/");assert.doesNotMatch(b.view().mathHtml,/math-fraction/)});
test("SHIFT alternate scientific actions are one shot",()=>{const c=new CalculatorController();c.dispatch("SHIFT");c.dispatch("SIN");assert.equal(c.view().canonicalExpression,"asin(");assert.equal(c.view().state.shift,false)});
test("memory store recall add and subtract are functional",()=>{const c=new CalculatorController();enter(c,["DIGIT_5","EQUALS"]);c.dispatch("SHIFT");c.dispatch("RCL");assert.equal(c.view().memory,5);c.dispatch("AC");c.dispatch("RCL");assert.equal(c.view().canonicalExpression,"5");c.dispatch("EQUALS");c.dispatch("M_PLUS");assert.equal(c.view().memory,10);c.dispatch("SHIFT");c.dispatch("M_PLUS");assert.equal(c.view().memory,5)});
test("S↔D toggles exact fraction and decimal result",()=>{const c=new CalculatorController();c.dispatch("FRAC");c.dispatch("DIGIT_1");c.dispatch("REPLAY_DOWN");c.dispatch("DIGIT_2");c.dispatch("EQUALS");assert.equal(c.view().result,"1/2");c.dispatch("S_D");assert.equal(c.view().result,"0.5");c.dispatch("S_D");assert.equal(c.view().result,"1/2")});
test("SHIFT + S↔D toggles improper and mixed fraction presentation",()=>{const c=new CalculatorController();c.dispatch("FRAC");c.dispatch("DIGIT_7");c.dispatch("REPLAY_DOWN");c.dispatch("DIGIT_3");c.dispatch("EQUALS");assert.equal(c.view().result,"7/3");c.dispatch("SHIFT");c.dispatch("S_D");assert.equal(c.view().result,"2 1/3");c.dispatch("SHIFT");c.dispatch("S_D");assert.equal(c.view().result,"7/3")});
test("REPLAY arrows navigate structured fraction slots before history",()=>{const c=new CalculatorController();c.dispatch("FRAC");c.dispatch("DIGIT_1");c.dispatch("REPLAY_DOWN");c.dispatch("DIGIT_2");assert.equal(c.view().focusSlot,"denominator");c.dispatch("REPLAY_UP");assert.equal(c.view().focusSlot,"numerator")});
test("history recall preserves and restores uncommitted draft",()=>{const c=new CalculatorController();enter(c,["DIGIT_2","ADD","DIGIT_3","EQUALS"]);c.dispatch("AC");enter(c,["DIGIT_9","ADD"]);c.dispatch("REPLAY_UP");assert.equal(c.view().canonicalExpression,"2+3");c.dispatch("REPLAY_DOWN");assert.equal(c.view().canonicalExpression,"9+")});

test("ALPHA inserts verified variables and equality as one-shot actions",()=>{const c=new CalculatorController();c.dispatch("ALPHA");c.dispatch("NEGATE");assert.equal(c.view().canonicalExpression,"A");assert.equal(c.view().state.alpha,false);c.dispatch("ALPHA");c.dispatch("CALC");assert.equal(c.view().canonicalExpression,"A=");assert.equal(c.view().state.alpha,false)});

test("HYP opens a function state and next trig chooses hyperbolic function",()=>{const x=new CalculatorController();x.dispatch("HYP");assert.equal(x.view().state.hyp,true);x.dispatch("SIN");assert.equal(x.view().canonicalExpression,"sinh(");assert.equal(x.view().state.hyp,false)});
test("DMS converts a decimal result to sexagesimal display and toggles back",()=>{const x=new CalculatorController();x.dispatch("DIGIT_1");x.dispatch("DECIMAL");x.dispatch("DIGIT_5");x.dispatch("EQUALS");x.dispatch("DMS");assert.equal(x.view().result,"1°30′0″");x.dispatch("DMS");assert.equal(x.view().result,"1.5")});

test("CALC accepts prompted variable values and evaluates the stored expression",()=>{const c=new CalculatorController();c.dispatch("ALPHA");c.dispatch("RPAREN");c.dispatch("ADD");c.dispatch("DIGIT_1");c.dispatch("CALC");assert.equal(c.view().state.prompt?.kind,"CALC");c.dispatch("DIGIT_5");c.dispatch("EQUALS");assert.equal(c.view().state.prompt,null);assert.equal(c.view().result,"6")});
test("SOLVE accepts an initial X value and numerically solves a one-variable equality",()=>{const c=new CalculatorController();c.dispatch("ALPHA");c.dispatch("RPAREN");c.dispatch("MULTIPLY");c.dispatch("ALPHA");c.dispatch("RPAREN");c.dispatch("ALPHA");c.dispatch("CALC");c.dispatch("DIGIT_4");c.dispatch("SHIFT");c.dispatch("CALC");assert.equal(c.view().state.prompt?.kind,"SOLVE");c.dispatch("DIGIT_1");c.dispatch("EQUALS");assert.equal(c.view().state.prompt,null);assert.ok(Math.abs(Number(c.view().result)-2)<1e-8)});
test("ENG formats a displayed result in engineering notation and repeated presses shift by three powers",()=>{const c=new CalculatorController();["DIGIT_1","DIGIT_2","DIGIT_3","DIGIT_4","EQUALS"].forEach(k=>c.dispatch(k));c.dispatch("ENG");assert.equal(c.view().result,"1.234×10^3");c.dispatch("ENG");assert.equal(c.view().result,"1234×10^0")});


test("history recall preserves structured Natural Display instead of flattening to text",()=> {
  const x=new CalculatorController();
  x.dispatch("FRAC");x.dispatch("DIGIT_1");x.dispatch("REPLAY_DOWN");x.dispatch("DIGIT_2");x.dispatch("EQUALS");
  x.dispatch("AC");
  x.dispatch("REPLAY_UP");
  assert.equal(x.view().canonicalExpression,"(1)/(2)");
  assert.match(x.view().mathHtml,/math-fraction/);
});


test("REPLAY left and DEL correct the digit immediately left of the cursor",()=> {
  const x=new CalculatorController();
  for(const id of ["DIGIT_1","DIGIT_2","DIGIT_3","DIGIT_4","DIGIT_5","DIGIT_6"])x.dispatch(id);
  x.dispatch("REPLAY_LEFT");x.dispatch("REPLAY_LEFT");x.dispatch("REPLAY_LEFT");
  x.dispatch("DEL");x.dispatch("DIGIT_9");
  assert.equal(x.view().canonicalExpression,"129456");
});

test("REPLAY left edits inside a fraction denominator and DEL replaces the selected digit",()=> {
  const x=new CalculatorController();
  x.dispatch("FRAC");x.dispatch("DIGIT_1");x.dispatch("REPLAY_DOWN");x.dispatch("DIGIT_3");x.dispatch("DIGIT_4");
  x.dispatch("REPLAY_LEFT");x.dispatch("DEL");x.dispatch("DIGIT_2");
  assert.equal(x.view().canonicalExpression,"(1)/(24)");
});


test("CMPLX mode evaluates complex expressions and reuses complex Ans",()=>{
  const c=new CalculatorController();
  assert.equal(c.selectMode("CMPLX"),true);
  c.setExpression("sqrt(-1)");
  assert.equal(c.evaluateCurrent(),true);
  assert.equal(c.view().result,"i");
  c.setExpression("Ans^2");
  assert.equal(c.evaluateCurrent(),true);
  assert.equal(c.view().result,"-1");
});
