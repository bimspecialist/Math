import test from "node:test";
import assert from "node:assert/strict";
import {oneSampleTTest,linearRegression,chiSquareGoodnessOfFit} from "../src/science/statistics-research.js";

// Regression for a real data-integrity risk: Number(null), Number("") and
// Number(false) yield zero, which can silently fabricate an observation.
test("one-sample inference rejects missing or nonnumeric data rather than filling zero",()=>{
  for(const series of [[10,"",12],[10,"  ",12],[10,null,12],[10,false,12]]){
    assert.deepEqual(oneSampleTTest(series,10),{kind:"error",code:"INVALID_INPUT"});
  }
});

test("regression refuses an omitted X observation instead of shifting/fabricating samples",()=>{
  assert.deepEqual(linearRegression([1,null,3],[2,4,6]),{kind:"error",code:"INVALID_INPUT"});
  assert.deepEqual(linearRegression([1,"",3],[2,4,6]),{kind:"error",code:"INVALID_INPUT"});
});

test("chi-square observed and expected arrays reject missing values",()=>{
  assert.deepEqual(chiSquareGoodnessOfFit([10,null,10],[5,5,10]),{kind:"error",code:"INVALID_INPUT"});
  assert.deepEqual(chiSquareGoodnessOfFit([10,0,10],[5,"",15]),{kind:"error",code:"INVALID_INPUT"});
});
