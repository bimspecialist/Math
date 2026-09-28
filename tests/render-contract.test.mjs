import test from "node:test";
import assert from "node:assert/strict";
import { KEY_CONTRACT } from "../src/calculator/key-contract.js";
import { renderCalculatorMarkup, mapKeyboardToKeyId } from "../src/calculator/render-calculator.js";
import { CalculatorController } from "../src/calculator/calculator-controller.js";

test("rendered calculator uses contract ids and renders every required face key",()=>{const html=renderCalculatorMarkup(new CalculatorController().view(),"ar");for(const key of KEY_CONTRACT)assert.match(html,new RegExp('data-key-id="'+key.id+'"'),"not rendered: "+key.id)});
test("no visible key renders an unimplemented alternate legend",()=>{const html=renderCalculatorMarkup(new CalculatorController().view(),"ar");assert.doesNotMatch(html,/undefined|null|NOOP/i)});
test("calculator and math display remain LTR in Arabic locale",()=>{const html=renderCalculatorMarkup(new CalculatorController().view(),"ar");assert.match(html,/class="calculator-shell"[^>]*dir="ltr"/);assert.match(html,/class="math-input"[^>]*dir="ltr"/)});
test("REPLAY directions are real focusable buttons",()=>{const html=renderCalculatorMarkup(new CalculatorController().view(),"en");for(const id of ["REPLAY_UP","REPLAY_DOWN","REPLAY_LEFT","REPLAY_RIGHT"])assert.match(html,new RegExp('<button[^>]*data-key-id="'+id+'"[^>]*type="button"'))});
test("keyboard slash maps to structured division/fraction command",()=>{assert.equal(mapKeyboardToKeyId("/"),"FRAC");const c=new CalculatorController();c.dispatch(mapKeyboardToKeyId("/"));assert.match(c.view().mathHtml,/math-fraction/)});
test("keyboard arrows map to REPLAY navigation without changing canonical token order",()=>{assert.equal(mapKeyboardToKeyId("ArrowDown"),"REPLAY_DOWN");const c=new CalculatorController();c.dispatch("FRAC");c.dispatch("DIGIT_1");c.dispatch(mapKeyboardToKeyId("ArrowDown"));c.dispatch("DIGIT_2");assert.equal(c.view().canonicalExpression,"(1)/(2)")});
test("controller exposes menu selections for UI without label-based dispatch",()=>{const c=new CalculatorController();c.dispatch("MODE");assert.equal(c.view().state.menu?.id,"MODE");assert.equal(c.selectMode("COMP"),true);c.dispatch("SHIFT");c.dispatch("MODE");assert.equal(c.selectSetup("ANGLE","RAD"),true);assert.equal(c.view().state.angleMode,"RAD")});

test("CALC prompt is rendered visibly when controller enters prompt state",()=>{const x=new CalculatorController();x.dispatch("ALPHA");x.dispatch("RPAREN");x.dispatch("ADD");x.dispatch("DIGIT_1");x.dispatch("CALC");const html=renderCalculatorMarkup(x.view(),"en");assert.match(html,/calculator-prompt/);assert.match(html,/data-prompt-variable="X"/)});

test("web face omits the unnecessary hardware ON key",()=>{const html=renderCalculatorMarkup(new CalculatorController().view(),"ar");assert.doesNotMatch(html,/data-key-id="ON"/)});
test("REPLAY left and right controls keep physical LTR placement in Arabic UI",()=>{const html=renderCalculatorMarkup(new CalculatorController().view(),"ar");assert.match(html,/class="replay-left"><button[^>]*data-key-id="REPLAY_LEFT"/);assert.match(html,/class="replay-right"><button[^>]*data-key-id="REPLAY_RIGHT"/)});

test("calculator face keeps physical LTR geometry even in Arabic shell",()=>{const html=renderCalculatorMarkup(new CalculatorController().view(),"ar");assert.match(html,/class="calculator-face" dir="ltr"/)});

test("EXP and ANS are rendered in the numeric keypad, not the scientific grid",()=>{const html=renderCalculatorMarkup(new CalculatorController().view(),"en");const numeric=html.match(/<div class="numeric-grid">([\s\S]*?)<\/div>/)?.[1]??"";assert.match(numeric,/data-key-id="EXP"/);assert.match(numeric,/data-key-id="ANS"/)});
test("scientific keys follow the approved traditional row order",()=>{const html=renderCalculatorMarkup(new CalculatorController().view(),"en");const p=id=>html.indexOf('data-key-id="'+id+'"');const row1=["INVERSE","FRAC","SQRT","POWER","LOG","LN"];for(let i=1;i<row1.length;i++)assert.ok(p(row1[i-1])<p(row1[i]),row1[i-1]+" before "+row1[i]);const row2=["NEGATE","DMS","HYP","SIN","COS","TAN"];for(let i=1;i<row2.length;i++)assert.ok(p(row2[i-1])<p(row2[i]),row2[i-1]+" before "+row2[i]);});

test("calculator shell and face stay LTR in Arabic locale",()=>{const html=renderCalculatorMarkup(new CalculatorController().view(),"ar");assert.match(html,/class="calculator-shell" dir="ltr"/);assert.match(html,/class="calculator-face" dir="ltr"/)});
test("exact fraction results render with vertical numerator and denominator",()=>{const c=new CalculatorController();c.dispatch("FRAC");c.dispatch("DIGIT_1");c.dispatch("REPLAY_DOWN");c.dispatch("DIGIT_2");c.dispatch("EQUALS");const html=renderCalculatorMarkup(c.view(),"ar");assert.match(html,/class="result-fraction"/);assert.match(html,/class="result-numerator">1</);assert.match(html,/class="result-denominator">2</)});
