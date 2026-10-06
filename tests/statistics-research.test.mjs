import test from "node:test";
import assert from "node:assert/strict";
import { studentTCdf, studentTInv, chiSquareCdf, oneSampleTTest, linearRegression, chiSquareGoodnessOfFit } from "../src/science/statistics-research.js";

const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);

test("Student-t CDF and inverse are mutually consistent",()=>{
  for(const df of [1,2,5,10,30]){
    for(const p of [0.025,0.1,0.5,0.9,0.975]){
      const t=studentTInv(p,df);
      near(studentTCdf(t,df),p,2e-7);
    }
  }
});

test("one-sample t-test returns confidence interval and p-value",()=>{
  const r=oneSampleTTest([10.2,9.9,10.5,10.1,10.3],10,0.05);
  assert.equal(r.kind,"t-test");
  assert.equal(r.df,4);
  assert.ok(r.ci[0]<r.mean&&r.ci[1]>r.mean);
  assert.ok(r.pValue>=0&&r.pValue<=1);
});

test("linear regression recovers exact line",()=>{
  const r=linearRegression([1,2,3,4,5],[3,5,7,9,11]);
  assert.equal(r.kind,"linear-regression");
  near(r.slope,2,1e-12);near(r.intercept,1,1e-12);near(r.r2,1,1e-12);
});

test("chi-square distribution and goodness-of-fit are bounded",()=>{
  const c=chiSquareCdf(3.841458820694124,1);
  near(c,0.95,5e-7);
  const r=chiSquareGoodnessOfFit([20,30,50],[25,25,50]);
  assert.equal(r.kind,"chi-square");
  assert.ok(r.pValue>=0&&r.pValue<=1);
});


test("research statistics reject invalid tokens instead of silently dropping them",()=>{
  assert.deepEqual(oneSampleTTest([10,Number.NaN,11],10,0.05),{kind:"error",code:"INVALID_INPUT"});
  assert.deepEqual(linearRegression([1,2,Number.NaN],[2,4,6]),{kind:"error",code:"INVALID_INPUT"});
  assert.deepEqual(chiSquareGoodnessOfFit([10,20,Number.NaN],[10,20,30]),{kind:"error",code:"INVALID_INPUT"});
});


test("research statistics reject invalid inferential parameters",()=>{
  assert.deepEqual(oneSampleTTest([1,2,3],Number.NaN,0.05),{kind:"error",code:"INVALID_INPUT"});
  assert.deepEqual(oneSampleTTest([1,2,3],0,1.2),{kind:"error",code:"INVALID_INPUT"});
  assert.deepEqual(linearRegression([1,2,3],[2,4,6],0),{kind:"error",code:"INVALID_INPUT"});
  assert.deepEqual(linearRegression([1,2,3],[5,5,5],0.05),{kind:"error",code:"ZERO_RESPONSE_VARIANCE"});
});

test("chi-square rejects impossible counts, invalid parameter counts, and mismatched totals",()=>{
  assert.deepEqual(chiSquareGoodnessOfFit([10,-1,11],[10,10,10]),{kind:"error",code:"INVALID_INPUT"});
  assert.deepEqual(chiSquareGoodnessOfFit([10,10,10],[10,10,10],-1),{kind:"error",code:"INVALID_INPUT"});
  assert.deepEqual(chiSquareGoodnessOfFit([10,10,10],[8,8,8]),{kind:"error",code:"EXPECTED_TOTAL_MISMATCH"});
  assert.deepEqual(chiSquareGoodnessOfFit([10,10,10],[10,10,10],2),{kind:"error",code:"INVALID_DF"});
});
