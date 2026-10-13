import test from "node:test";
import assert from "node:assert/strict";
import {
  measurement, addMeasurements, formatMeasurement
} from "../src/science/uncertainty-engine.js";
import { runUncertaintyResearch } from "../src/science/research-workbench.js";

test("uncertainty engine does not turn missing values into measured zeros",()=>{
  for(const invalid of ["","   ",null,false,true]){
    assert.throws(()=>measurement(invalid,0.1),/INVALID_VALUE/,String(invalid));
    assert.throws(()=>measurement(10,invalid),/INVALID_VALUE/,String(invalid));
  }
  assert.deepEqual(measurement("10.5","0.2"),{value:10.5,uncertainty:0.2});
  assert.deepEqual(measurement(0,0),{value:0,uncertainty:0});
});

test("correlation input must be explicit finite number, never an empty string",()=>{
  const a=measurement(10,0.2),b=measurement(3,0.1);
  assert.throws(()=>addMeasurements(a,b,""),/INVALID_VALUE/);
  assert.throws(()=>addMeasurements(a,b,null),/INVALID_VALUE/);
  assert.equal(addMeasurements(a,b,0).value,13);
});

test("Research Mode returns a clear error for an omitted measurement",()=>{
  assert.deepEqual(runUncertaintyResearch({a:"",ua:0.2,b:3,ub:0.1,correlation:0}),{kind:"error",code:"INVALID_VALUE"});
  assert.deepEqual(runUncertaintyResearch({a:10,ua:null,b:3,ub:0.1,correlation:0}),{kind:"error",code:"INVALID_VALUE"});
});

test("measurement formatter never displays NaN for finite subnormal standard uncertainties",()=>{
  const samples=[
    measurement(1.2345e-309,9.9e-310),
    measurement(12.3,Number.MIN_VALUE),
    measurement(0,1e-320)
  ];
  for(const m of samples){
    const result=formatMeasurement(m,{uncertaintyDigits:2});
    assert.match(result,/ ± /);
    assert.doesNotMatch(result,/NaN|Infinity/);
    assert.ok(result.length<90,result);
  }
  assert.equal(formatMeasurement(measurement(12.3456,0.0789),{uncertaintyDigits:2}),"12.346 ± 0.079");
});
