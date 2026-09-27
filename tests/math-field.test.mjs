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
