import test from "node:test";
import assert from "node:assert/strict";
import { measurement, addMeasurements, multiplyMeasurements, divideMeasurements, powerMeasurement, unaryMeasurement, propagateIndependent, formatMeasurement } from "../src/science/uncertainty-engine.js";

const near=(a,b,t=1e-12)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);

test("uncertainty engine propagates independent sums and products",()=>{
  const a=measurement(10,0.2),b=measurement(5,0.1);
  near(addMeasurements(a,b).uncertainty,Math.sqrt(0.05));
  near(multiplyMeasurements(a,b).uncertainty,Math.sqrt((5*0.2)**2+(10*0.1)**2));
});

test("uncertainty engine handles division powers and functions",()=>{
  const q=divideMeasurements(measurement(10,0.2),measurement(2,0.05));
  near(q.value,5);
  const p=powerMeasurement(measurement(3,0.1),2);
  near(p.value,9);near(p.uncertainty,0.6);
  const s=unaryMeasurement(measurement(0.5,0.01),"sin");
  near(s.uncertainty,Math.abs(Math.cos(0.5))*0.01);
});

test("general independent propagation uses numerical partial derivatives",()=>{
  const r=propagateIndependent(([x,y])=>x*y+y*y,[measurement(2,0.1),measurement(3,0.2)]);
  near(r.value,15);
  near(r.uncertainty,Math.sqrt((3*0.1)**2+(8*0.2)**2),2e-7);
});

test("measurement formatting follows uncertainty precision",()=>{
  assert.equal(formatMeasurement(measurement(12.3456,0.0789),{uncertaintyDigits:2}),"12.346 ± 0.079");
});
