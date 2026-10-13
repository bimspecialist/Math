import test from "node:test";
import assert from "node:assert/strict";
import {
  studentTTwoSidedPValue, chiSquareSurvival, chiSquareGoodnessOfFit,
  oneSampleTTest, linearRegression
} from "../src/science/statistics-research.js";

const nearRelative=(actual,expected,tolerance=1e-8)=>{
  assert.ok(Number.isFinite(actual)&&actual>0,`expected a positive finite tail, got ${actual}`);
  assert.ok(Math.abs(actual/expected-1)<tolerance,`${actual} differs from ${expected}`);
};

test("Student-t tiny two-sided p-values remain distinguishable from zero",()=>{
  nearRelative(studentTTwoSidedPValue(100,4),5.99600209899246e-8);
  nearRelative(studentTTwoSidedPValue(20,30),6.7490836657712895e-19);
  assert.equal(studentTTwoSidedPValue(0,5),1);
  assert.equal(studentTTwoSidedPValue(Number.POSITIVE_INFINITY,5),0);
  assert.ok(Number.isNaN(studentTTwoSidedPValue(1,-1)));
});

test("Chi-square upper survival remains accurate beyond CDF precision",()=>{
  nearRelative(chiSquareSurvival(100,2),1.9287498479639183e-22);
  nearRelative(chiSquareSurvival(100,1),1.5239706048320995e-23);
  nearRelative(chiSquareSurvival(200,10),1.6139305336977317e-37);
  assert.equal(chiSquareSurvival(0,2),1);
});

test("Research workflows retain meaningful tiny tail probabilities",()=>{
  const oneSample=oneSampleTTest([100,101,99,100,102],0,0.05);
  assert.equal(oneSample.kind,"t-test");
  assert.ok(oneSample.pValue>0&&oneSample.pValue<1e-6);

  const regression=linearRegression([1,2,3,4,5],[1,2,3,4,5.0001]);
  assert.equal(regression.kind,"linear-regression");
  assert.ok(regression.pSlope>0&&regression.pSlope<1e-6);

  const gof=chiSquareGoodnessOfFit([100,0],[50,50]);
  assert.equal(gof.kind,"chi-square");
  nearRelative(gof.pValue,1.5239706048320995e-23);
});

test("Chi-square observed data must be counts; expectations may be fractional",()=>{
  assert.deepEqual(chiSquareGoodnessOfFit([10.5,9.5],[10,10]),{kind:"error",code:"INVALID_INPUT"});
  const result=chiSquareGoodnessOfFit([11,9],[10.5,9.5]);
  assert.equal(result.kind,"chi-square");
  assert.ok(result.pValue>=0&&result.pValue<=1);
});
