import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { KEY_CONTRACT } from "../src/calculator/key-contract.js";
import { renderCalculatorMarkup } from "../src/calculator/render-calculator.js";
import { CalculatorController } from "../src/calculator/calculator-controller.js";

const index = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const app = readFileSync(new URL("../src/app.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles/calculator.css", import.meta.url), "utf8");

test("English is default, Arabic switches the site RTL, and calculator geometry remains fixed LTR", () => {
  assert.match(index, /<html[^>]*lang="en"[^>]*dir="ltr"/);
  assert.match(app, /document\.documentElement\.dir=locale==="ar"\?"rtl":"ltr"/);
  const html = renderCalculatorMarkup(new CalculatorController().view(), "ar");
  assert.match(html, /class="calculator-shell"[^>]*dir="ltr"/);
  assert.match(html, /class="calculator-face"[^>]*dir="ltr"/);
});

test("math entry viewport is visually anchored to the left/start edge", () => {
  assert.match(css, /\.math-input\{[^}]*justify-content:flex-start/);
  assert.doesNotMatch(css, /\.math-input\{[^}]*justify-content:flex-end/);
});

test("physical-parity profile does not expose a standalone SETUP key", () => {
  assert.equal(KEY_CONTRACT.some(k => k.id === "SETUP"), false);
  const html = renderCalculatorMarkup(new CalculatorController().view(), "en");
  assert.doesNotMatch(html, /data-key-id="SETUP"/);
  assert.match(html, /data-key-id="MODE"/);
});

test("SHIFT + MODE remains the canonical SETUP path", () => {
  const c = new CalculatorController();
  c.dispatch("SHIFT");
  c.dispatch("MODE");
  assert.equal(c.view().state.menu?.id, "SETUP");
});
