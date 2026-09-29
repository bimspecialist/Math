import test from "node:test";
import assert from "node:assert/strict";
import { MathFieldAdapter } from "../src/calculator/math-field-adapter.js";

test("fraction creates vertical numerator and denominator slots", () => {
  const f = new MathFieldAdapter(); f.insertFraction();
  assert.equal(f.focusSlot(), "numerator");
  assert.match(f.renderHtml(), /math-fraction/);
  assert.match(f.renderHtml(), /math-numerator/);
  assert.match(f.renderHtml(), /math-denominator/);
});
test("fraction navigation moves numerator down to denominator and up again", () => {
  const f = new MathFieldAdapter(); f.insertFraction(); f.insertText("1");
  assert.equal(f.moveDown(), true); assert.equal(f.focusSlot(), "denominator");
  f.insertText("2"); assert.equal(f.moveUp(), true); assert.equal(f.focusSlot(), "numerator");
  assert.equal(f.getCanonicalExpression(), "(1)/(2)");
});
test("right exits a fraction from denominator", () => {
  const f = new MathFieldAdapter(); f.insertFraction(); f.insertText("1"); f.moveDown(); f.insertText("2");
  assert.equal(f.moveRight(), true); f.insertText("+3"); assert.equal(f.getCanonicalExpression(), "(1)/(2)+3");
});
test("nested fractions serialize without corruption", () => {
  const f = new MathFieldAdapter(); f.insertFraction(); f.insertText("1"); f.moveDown(); f.insertFraction(); f.insertText("2"); f.moveDown(); f.insertText("3");
  assert.equal(f.getCanonicalExpression(), "(1)/((2)/(3))");
});
test("backspace on empty fraction slot safely collapses template", () => {
  const f = new MathFieldAdapter(); f.insertFraction(); assert.equal(f.deleteBackward(), true); assert.equal(f.getCanonicalExpression(), "");
});
test("keyboard slash and FRAC command create equivalent structures", () => {
  const a = new MathFieldAdapter(); a.insertFraction(); const b = new MathFieldAdapter(); b.insertKeyboard("/");
  assert.equal(a.renderHtml(), b.renderHtml()); assert.equal(a.getCanonicalExpression(), b.getCanonicalExpression());
});

test("power key wraps the existing base and focuses the exponent", () => {
  const f = new MathFieldAdapter(); f.insertText("2"); f.insertPower(); f.insertText("3");
  assert.equal(f.focusSlot(), "exponent");
  assert.equal(f.getCanonicalExpression(), "(2)^(3)");
  assert.match(f.renderHtml(), /math-power/);
});


test("structured snapshot restores nested fraction and focused slot", () => {
  const a=new MathFieldAdapter();
  a.insertFraction(); a.insertText("1"); a.moveDown(); a.insertFraction(); a.insertText("2"); a.moveDown(); a.insertText("3");
  const snap=a.createSnapshot();
  const b=new MathFieldAdapter();
  b.restoreSnapshot(snap);
  assert.equal(b.getCanonicalExpression(),"(1)/((2)/(3))");
  assert.equal(b.focusSlot(),"denominator");
  assert.match(b.renderHtml(),/math-fraction/);
  assert.equal((b.renderHtml().match(/math-fraction/g)||[]).length,2);
});


test("left arrow moves horizontally and never jumps up inside a fraction", () => {
  const x=new MathFieldAdapter();
  x.insertFraction();x.insertText("1");x.moveDown();x.insertText("2");
  assert.equal(x.focusSlot(),"denominator");
  assert.equal(x.moveLeft(),true);
  assert.equal(x.focusSlot(),"denominator");
  assert.equal(x.cursorPosition(),0);
  assert.equal(x.moveUp(),true);
  assert.equal(x.focusSlot(),"numerator");
});


test("left and right arrows move a real cursor inside root expression", () => {
  const f=new MathFieldAdapter();
  f.insertText("1");f.insertText("2");f.insertText("3");
  assert.equal(f.cursorPosition(),3);
  assert.equal(f.moveLeft(),true);
  assert.equal(f.cursorPosition(),2);
  assert.equal(f.moveRight(),true);
  assert.equal(f.cursorPosition(),3);
});

test("DEL at an internal cursor removes the token under the cursor", () => {
  const f=new MathFieldAdapter();
  f.insertText("1");f.insertText("2");f.insertText("3");
  f.moveLeft();f.moveLeft();
  assert.equal(f.cursorPosition(),1);
  assert.equal(f.deleteBackward(),true);
  assert.equal(f.getCanonicalExpression(),"13");
  f.insertText("9");
  assert.equal(f.getCanonicalExpression(),"193");
});

test("cursor can correct a denominator without leaving the fraction", () => {
  const f=new MathFieldAdapter();
  f.insertFraction();f.insertText("1");f.moveDown();f.insertText("3");f.insertText("4");
  assert.equal(f.focusSlot(),"denominator");
  f.moveLeft();
  assert.equal(f.cursorPosition(),1);
  f.deleteBackward();
  f.insertText("2");
  assert.equal(f.getCanonicalExpression(),"(1)/(32)");
});

test("rendered math exposes a visible cursor at the active insertion point", () => {
  const f=new MathFieldAdapter();
  f.insertText("1");f.insertText("2");f.moveLeft();
  assert.match(f.renderHtml(),/math-cursor/);
});
