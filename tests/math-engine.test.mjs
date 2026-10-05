import test from "node:test";
import assert from "node:assert/strict";
import { evaluateExpression } from "../src/calculator/math-engine.js";
import { formatExactDecimal } from "../src/calculator/result-format.js";
const evalv = (s, angleMode="DEG", ans="0") => evaluateExpression(s,{angleMode,ans});
test("operator precedence is deterministic", () => { assert.equal(evalv("2+3*4").numeric, 14); });
test("degree and radian trig differ and sin 30deg is 0.5", () => {
  assert.ok(Math.abs(evalv("sin(30)","DEG").numeric - 0.5) < 1e-12);
  assert.notEqual(evalv("sin(1)","DEG").numeric, evalv("sin(1)","RAD").numeric);
});
test("factorial and nCr nPr work", () => {
  assert.equal(evalv("5!").numeric, 120); assert.equal(evalv("nCr(5,2)").numeric, 10); assert.equal(evalv("nPr(5,2)").numeric, 20);
});
test("roots work", () => { assert.equal(evalv("sqrt(81)").numeric, 9); assert.equal(evalv("root(3,27)").numeric, 3); });
test("division by zero and domain errors are explicit", () => {
  assert.deepEqual(evalv("1/0"), {kind:"error",code:"DIVISION_BY_ZERO"});
  assert.deepEqual(evalv("sqrt(-1)"), {kind:"error",code:"DOMAIN_ERROR"});
});
test("Ans is a calculation context value", () => { assert.equal(evalv("Ans+2","DEG","5").numeric, 7); });
test("rational-only arithmetic preserves exact result", () => {
  const r = evalv("1/2+1/3"); assert.equal(r.exact, "5/6");
  assert.equal(formatExactDecimal(r,"EXACT"), "5/6"); assert.equal(formatExactDecimal(r,"DECIMAL"), String(5/6));
});

test("SHIFT log and ln engine functions are evaluable", () => {
  assert.equal(evalv("pow10(2)").numeric, 100);
  assert.ok(Math.abs(evalv("exp(1)").numeric - Math.E) < 1e-12);
});


test("lecture-style implicit multiplication is accepted", () => {
  assert.ok(Math.abs(evalv("2π").numeric - 2*Math.PI) < 1e-12);
  assert.equal(evalv("3(4+5)").numeric, 27);
  assert.equal(evalv("(2+3)(4+5)").numeric, 45);
  assert.ok(Math.abs(evalv("2sin(30)","DEG").numeric - 1) < 1e-12);
});

test("calculator accepts common percent and superscript notation", () => {
  assert.equal(evalv("50%").numeric, 0.5);
  assert.equal(evalv("200*10%").numeric, 20);
  assert.equal(evalv("5²").numeric, 25);
  assert.equal(evalv("2³").numeric, 8);
});

test("unary minus follows calculator power precedence", () => {
  assert.equal(evalv("-2^2").numeric, -4);
  assert.equal(evalv("(-2)^2").numeric, 4);
});


test("student calculator supports common lecture notation and implied multiplication", () => {
  assert.ok(Math.abs(evalv("2π").numeric - 2*Math.PI) < 1e-12);
  assert.equal(evalv("3(4+5)").numeric,27);
  assert.equal(evalv("(2+3)(4+5)").numeric,45);
  assert.ok(Math.abs(evalv("2sin(30)","DEG").numeric-1)<1e-12);
  assert.equal(evalv("50%").numeric,0.5);
  assert.equal(evalv("5²").numeric,25);
  assert.equal(evalv("2³").numeric,8);
});

test("student calculator follows textbook power and unary-minus precedence", () => {
  assert.equal(evalv("-2^2").numeric,-4);
  assert.equal(evalv("(-2)^2").numeric,4);
  assert.equal(evalv("2^3^2").numeric,512);
});

test("general logarithms roots and inverse powers are lecture-ready", () => {
  assert.equal(evalv("log(1000)").numeric,3);
  assert.equal(evalv("log(2,16)").numeric,4);
  assert.equal(evalv("cbrt(27)").numeric,3);
  assert.equal(evalv("root(4,81)").numeric,3);
  assert.ok(Math.abs(evalv("2^-3").numeric-0.125)<1e-12);
});

test("inverse and hyperbolic functions cover scientific calculator use", () => {
  assert.ok(Math.abs(evalv("asin(0.5)","DEG").numeric-30)<1e-12);
  assert.ok(Math.abs(evalv("acos(0.5)","DEG").numeric-60)<1e-12);
  assert.ok(Math.abs(evalv("atan(1)","DEG").numeric-45)<1e-12);
  assert.ok(Math.abs(evalv("asinh(sinh(1))","RAD").numeric-1)<1e-12);
  assert.ok(Math.abs(evalv("acosh(cosh(1))","RAD").numeric-1)<1e-12);
  assert.ok(Math.abs(evalv("atanh(tanh(0.5))","RAD").numeric-0.5)<1e-12);
});

test("number theory and integer helpers cover classroom calculations", () => {
  assert.equal(evalv("gcd(84,30)").numeric,6);
  assert.equal(evalv("lcm(12,18)").numeric,36);
  assert.equal(evalv("mod(-7,3)").numeric,2);
  assert.equal(evalv("rem(-7,3)").numeric,-1);
  assert.equal(evalv("floor(3.8)").numeric,3);
  assert.equal(evalv("ceil(3.2)").numeric,4);
  assert.equal(evalv("trunc(-3.8)").numeric,-3);
  assert.ok(Math.abs(evalv("frac(3.75)").numeric-0.75)<1e-12);
});

test("statistics helpers support quick lecture calculations", () => {
  assert.equal(evalv("mean(2,4,6,8)").numeric,5);
  assert.equal(evalv("sum(2,4,6,8)").numeric,20);
  assert.equal(evalv("prod(2,3,4)").numeric,24);
  assert.equal(evalv("min(9,3,7,4)").numeric,3);
  assert.equal(evalv("max(9,3,7,4)").numeric,9);
  assert.ok(Math.abs(evalv("std(1,2,3)").numeric-1)<1e-12);
  assert.ok(Math.abs(evalv("stdp(1,2,3)").numeric-Math.sqrt(2/3))<1e-12);
});

test("angles coordinates and DMS helpers support engineering lectures", () => {
  assert.ok(Math.abs(evalv("rad(180)").numeric-Math.PI)<1e-12);
  assert.equal(evalv("deg(pi)").numeric,180);
  assert.equal(evalv("grad(90)").numeric,100);
  assert.equal(evalv("dms(30,30,0)").numeric,30.5);
  assert.equal(evalv("hypot(3,4)").numeric,5);
  assert.equal(evalv("atan2(1,1)","DEG").numeric,45);
});

test("probability and random integer functions enforce domains", () => {
  assert.equal(evalv("nCr(10,3)").numeric,120);
  assert.equal(evalv("nPr(10,3)").numeric,720);
  const r=evalv("randint(2,5)").numeric;
  assert.ok(Number.isInteger(r)&&r>=2&&r<=5);
  const u=evalv("rand()").numeric;
  assert.ok(u>=0&&u<1);
});

test("rounding and sign functions behave predictably", () => {
  assert.equal(evalv("round(3.14159,3)").numeric,3.142);
  assert.equal(evalv("sign(-12)").numeric,-1);
  assert.equal(evalv("abs(-12)").numeric,12);
});

test("domain and input failures stay explicit instead of silently returning wrong answers", () => {
  assert.deepEqual(evalv("log(-1)"),{kind:"error",code:"DOMAIN_ERROR"});
  assert.deepEqual(evalv("gcd(2.5,2)"),{kind:"error",code:"DOMAIN_ERROR"});
  assert.deepEqual(evalv("atanh(1)"),{kind:"error",code:"DOMAIN_ERROR"});
  assert.deepEqual(evalv("mod(2,0)"),{kind:"error",code:"DIVISION_BY_ZERO"});
});


test("numerical derivative supports lecture formulas", () => {
  assert.ok(Math.abs(evalv("deriv(X^2,3)","RAD").numeric-6)<1e-6);
  assert.ok(Math.abs(evalv("derivative(sin(X),0)","RAD").numeric-1)<1e-7);
});

test("numerical integral supports lecture formulas", () => {
  assert.ok(Math.abs(evalv("integral(X^2,0,3)","RAD").numeric-9)<1e-8);
  assert.ok(Math.abs(evalv("integral(sin(X),0,pi)","RAD").numeric-2)<1e-8);
});

test("sigma supports textbook summations", () => {
  assert.equal(evalv("sigma(X,1,100)").numeric,5050);
  assert.equal(evalv("sigma(X^2,1,10)").numeric,385);
});


test("scientific constants are available directly in expressions", () => {
  assert.equal(evalv("c0").numeric,299792458);
  assert.equal(evalv("c").numeric,299792458);
  assert.ok(Math.abs(evalv("hplanck").numeric-6.62607015e-34)<1e-45);
  assert.ok(Math.abs(evalv("kb").numeric-1.380649e-23)<1e-34);
  assert.ok(Math.abs(evalv("g0").numeric-9.80665)<1e-12);
  assert.equal(evalv("atm").numeric,101325);
});

test("special functions support advanced scientific work", () => {
  assert.ok(Math.abs(evalv("gamma(6)").numeric-120)<1e-10);
  assert.ok(Math.abs(evalv("lgamma(6)").numeric-Math.log(120))<1e-10);
  assert.ok(Math.abs(evalv("erf(1)").numeric-0.84270079)<1e-6);
  assert.ok(Math.abs(evalv("erfc(1)").numeric-(1-0.84270079))<1e-6);
});

test("probability distributions cover normal binomial and Poisson workflows", () => {
  assert.ok(Math.abs(evalv("normalpdf(0)").numeric-1/Math.sqrt(2*Math.PI))<1e-12);
  assert.ok(Math.abs(evalv("normalcdf(0)").numeric-0.5)<1e-7);
  assert.ok(Math.abs(evalv("binompdf(3,10,0.5)").numeric-0.1171875)<1e-12);
  assert.ok(Math.abs(evalv("binomcdf(3,10,0.5)").numeric-0.171875)<1e-12);
  assert.ok(Math.abs(evalv("poissonpdf(2,3)").numeric-(Math.exp(-3)*9/2))<1e-12);
  assert.ok(evalv("poissoncdf(4,3)").numeric>0.8&&evalv("poissoncdf(4,3)").numeric<0.82);
});
