import test from "node:test";
import assert from "node:assert/strict";
import { evaluateExpression } from "../src/calculator/math-engine.js";

const calc=(expression,angleMode="DEG")=>evaluateExpression(expression,{angleMode,ans:"0"});
const near=(actual,expected,tol=1e-10)=>assert.ok(Math.abs(actual-expected)<=tol,`${actual} != ${expected}`);

test("lecture regression: arithmetic fractions powers and engineering notation",()=>{
  assert.equal(calc("2+3*4").numeric,14);
  assert.equal(calc("(2+3)*4").numeric,20);
  assert.equal(calc("1/2+1/3").exact,"5/6");
  assert.equal(calc("3(4+5)").numeric,27);
  near(calc("2π").numeric,2*Math.PI);
  assert.equal(calc("2^3^2").numeric,512);
  assert.equal(calc("-2^2").numeric,-4);
  assert.equal(calc("(-2)^2").numeric,4);
  assert.equal(calc("5!").numeric,120);
  near(calc("1.25e3+250").numeric,1500);
  assert.equal(calc("25%").numeric,0.25);
});

test("lecture regression: trigonometry and angles",()=>{
  near(calc("sin(30)").numeric,0.5);
  near(calc("cos(60)").numeric,0.5);
  near(calc("tan(45)").numeric,1);
  near(calc("sin(30)^2+cos(30)^2").numeric,1);
  near(calc("asin(0.5)").numeric,30);
  near(calc("acos(0.5)").numeric,60);
  near(calc("atan(1)").numeric,45);
  near(calc("sin(pi/2)","RAD").numeric,1);
  near(calc("deg(pi)").numeric,180);
  near(calc("rad(180)").numeric,Math.PI);
  near(calc("dms(25,30,0)").numeric,25.5);
});

test("lecture regression: logarithms roots probability and number theory",()=>{
  assert.equal(calc("sqrt(144)").numeric,12);
  assert.equal(calc("cbrt(125)").numeric,5);
  assert.equal(calc("root(4,81)").numeric,3);
  assert.equal(calc("log(10000)").numeric,4);
  assert.equal(calc("log(2,1024)").numeric,10);
  near(calc("ln(e)").numeric,1);
  assert.equal(calc("nCr(12,2)").numeric,66);
  assert.equal(calc("nPr(8,3)").numeric,336);
  assert.equal(calc("gcd(252,105)").numeric,21);
  assert.equal(calc("lcm(12,18)").numeric,36);
});

test("lecture regression: common engineering calculations",()=>{
  near(calc("pi*(0.25^2)/4").numeric,Math.PI*0.25**2/4);
  near(calc("1000*9.81*2.5").numeric,24525);
  near(calc("(1/2)*9.81*12^2").numeric,706.32);
  near(calc("sqrt(2*9.81*5)").numeric,Math.sqrt(98.1));
  near(calc("3.6*25").numeric,90);
  near(calc("hypot(6,8)").numeric,10);
  near(calc("atan2(3,4)").numeric,36.86989764584402,1e-10);
});

test("lecture regression: quick statistics",()=>{
  near(calc("mean(10,12,14,16,18)").numeric,14);
  assert.equal(calc("sum(10,12,14,16,18)").numeric,70);
  assert.equal(calc("min(10,12,14,16,18)").numeric,10);
  assert.equal(calc("max(10,12,14,16,18)").numeric,18);
  near(calc("std(10,12,14,16,18)").numeric,Math.sqrt(10));
});

test("lecture regression: calculus and summation",()=>{
  near(calc("deriv(X^3,2)","RAD").numeric,12,1e-5);
  near(calc("integral(X,0,10)","RAD").numeric,50,1e-8);
  near(calc("integral(cos(X),0,pi/2)","RAD").numeric,1,1e-8);
  assert.equal(calc("sigma(X,1,50)").numeric,1275);
  assert.equal(calc("sigma(X^2,1,5)").numeric,55);
});

test("lecture regression: invalid domains never produce plausible wrong answers",()=>{
  assert.equal(calc("1/0").code,"DIVISION_BY_ZERO");
  assert.equal(calc("sqrt(-4)").code,"DOMAIN_ERROR");
  assert.equal(calc("log(0)").code,"DOMAIN_ERROR");
  assert.equal(calc("asin(2)").code,"DOMAIN_ERROR");
  assert.equal(calc("nCr(3,5)").code,"DOMAIN_ERROR");
  assert.equal(calc("dms(10,61,0)").code,"DOMAIN_ERROR");
});
