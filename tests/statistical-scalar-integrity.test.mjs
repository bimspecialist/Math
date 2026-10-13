import test from "node:test";
import assert from "node:assert/strict";
import {oneSampleTTest,chiSquareGoodnessOfFit} from "../src/science/statistics-research.js";

const data=[9,10,11,12];
const counts=[12,9,9],expectations=[10,10,10];

test("one-sample test rejects absent or boolean null-hypothesis values",()=>{
 for(const mu0 of [null,false,true,"","   "]){
  assert.deepEqual(oneSampleTTest(data,mu0,0.05),{kind:"error",code:"INVALID_INPUT"},String(mu0));
 }
 const zero=oneSampleTTest(data,0,0.05),numericString=oneSampleTTest(data,"0",0.05);
 assert.equal(zero.kind,"t-test");
 assert.equal(numericString.kind,"t-test");
 assert.equal(zero.t,numericString.t);
});

test("goodness-of-fit estimated parameter count cannot silently default to zero",()=>{
 for(const estimated of [null,false,true,"","   "]){
  assert.deepEqual(chiSquareGoodnessOfFit(counts,expectations,estimated),{kind:"error",code:"INVALID_INPUT"},String(estimated));
 }
 const zero=chiSquareGoodnessOfFit(counts,expectations,0);
 const numericString=chiSquareGoodnessOfFit(counts,expectations,"0");
 assert.equal(zero.kind,"chi-square");
 assert.equal(numericString.kind,"chi-square");
 assert.equal(zero.df,numericString.df);
});

test("omitted optional statistical parameters retain the documented defaults",()=>{
 assert.equal(oneSampleTTest(data).kind,"t-test");
 assert.equal(oneSampleTTest(data,undefined).kind,"t-test");
 assert.equal(chiSquareGoodnessOfFit(counts,expectations).kind,"chi-square");
 assert.equal(chiSquareGoodnessOfFit(counts,expectations,undefined).kind,"chi-square");
});
