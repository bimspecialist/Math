import test from "node:test";
import assert from "node:assert/strict";
import { createCalculatorState, dispatchCalculatorCommand } from "../src/calculator/calculator-state.js";
import { buildModeMenu } from "../src/calculator/menu-controller.js";
import { ES_PLUS_PROFILE } from "../src/calculator/behavior-profile.js";

test("MODE opens a calculation mode menu", () => {
  const s = dispatchCalculatorCommand(createCalculatorState(), {type:"OPEN_MODE_MENU"});
  assert.equal(s.menu?.id, "MODE"); assert.equal(s.angleMode, "DEG");
});
test("SHIFT plus MODE opens SETUP and consumes SHIFT", () => {
  let s = dispatchCalculatorCommand(createCalculatorState(), {type:"SHIFT"});
  s = dispatchCalculatorCommand(s, {type:"OPEN_MODE_MENU"});
  assert.equal(s.menu?.id, "SETUP"); assert.equal(s.shift, false);
});
test("SETUP changes angle mode and keeps mode separate", () => {
  let s = dispatchCalculatorCommand(createCalculatorState(), {type:"OPEN_SETUP_MENU"});
  s = dispatchCalculatorCommand(s, {type:"SELECT_SETUP", group:"ANGLE", value:"RAD"});
  assert.equal(s.angleMode, "RAD"); assert.equal(s.mode, "COMP");
});
test("SHIFT and ALPHA are one-shot and can be cancelled", () => {
  let s = dispatchCalculatorCommand(createCalculatorState(), {type:"SHIFT"});
  assert.equal(s.shift, true); s = dispatchCalculatorCommand(s, {type:"CONSUME_MODIFIER"}); assert.equal(s.shift, false);
  s = dispatchCalculatorCommand(s, {type:"ALPHA"}); assert.equal(s.alpha, true); s = dispatchCalculatorCommand(s, {type:"ALPHA"}); assert.equal(s.alpha, false);
});
test("menu cancel clears transient modifier state deterministically", () => {
  let s = {...createCalculatorState(), shift:true, alpha:true, menu:{id:"MODE"}};
  s = dispatchCalculatorCommand(s, {type:"CANCEL_MENU"});
  assert.equal(s.menu, null); assert.equal(s.shift, false); assert.equal(s.alpha, false);
});
test("CALC prompts for required variables", () => {
  const s = dispatchCalculatorCommand(createCalculatorState(), {type:"CALC", variables:["X","Y"]});
  assert.deepEqual(s.prompt, {kind:"CALC", variables:["X","Y"], index:0, values:{}});
});
test("SHIFT plus CALC enters SOLVE only in supported mode", () => {
  let s = {...createCalculatorState(), shift:true, mode:"COMP"};
  s = dispatchCalculatorCommand(s, {type:"CALC", variables:["X"]});
  assert.equal(s.prompt?.kind, "SOLVE"); assert.equal(s.shift, false);
  let unsupported = {...createCalculatorState(), shift:true, mode:"STAT"};
  unsupported = dispatchCalculatorCommand(unsupported, {type:"CALC", variables:["X"]});
  assert.equal(unsupported.prompt, null); assert.equal(unsupported.error, "SOLVE_UNSUPPORTED_MODE");
});
test("student modes backed by specialist engines are selectable", () => {
  const menu = buildModeMenu(ES_PLUS_PROFILE);
  assert.deepEqual(menu.choices.map(x=>x.id), ["COMP","STAT","BASE_N","EQN","MATRIX","TABLE","VECTOR"]);
  assert.equal(menu.choices.some(x=>x.id==="CMPLX"), false);
});
