import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculateRamp, calculateRampFromSlope, rampConsistencyError } from "../src/construction/ramp-calculator.js";

test("Ramp Calculator solves classic right-triangle geometry",()=>{
  const r=calculateRamp({rise:3,run:4});
  assert.equal(r.length,5);
  assert.equal(r.derivedField,"length");
  assert.ok(Math.abs(r.angleDeg-36.869897645844)<1e-12);
  assert.equal(r.gradePercent,75);
  assert.ok(Math.abs(r.ratioRun-4/3)<1e-12);
});

test("Ramp Calculator validates all three supplied measurements",()=>{
  const verified=calculateRamp({rise:3,run:4,length:5});
  assert.equal(verified.derivedField,"verified");
  assert.throws(()=>calculateRamp({rise:3,run:4,length:6}),/RAMP_INCONSISTENT_VALUES/);
  assert.equal(rampConsistencyError({rise:3,run:4,length:6}),1);
});

test("Ramp Calculator derives each missing side safely",()=>{
  assert.equal(calculateRamp({rise:3,length:5}).run,4);
  assert.equal(calculateRamp({run:4,length:5}).rise,3);
  assert.throws(()=>calculateRamp({rise:5,length:4}),/INVALID_RAMP_GEOMETRY/);
});

test("Ramp slope design supports ratio grade and angle definitions",()=>{
  const ratio=calculateRampFromSlope({rise:1,slopeType:"ratio",slopeValue:12});
  assert.equal(ratio.run,12);
  assert.equal(ratio.ratioText,"1:12");

  const grade=calculateRampFromSlope({rise:1,slopeType:"grade",slopeValue:8.333333333333334});
  assert.ok(Math.abs(grade.run-12)<1e-10);

  const angle=calculateRampFromSlope({rise:1,slopeType:"angle",slopeValue:45});
  assert.ok(Math.abs(angle.run-1)<1e-12);
});

test("Ramp slope design rejects invalid definitions and angles",()=>{
  assert.throws(()=>calculateRampFromSlope({rise:1,slopeType:"angle",slopeValue:90}),/INVALID_RAMP_ANGLE/);
  assert.throws(()=>calculateRampFromSlope({rise:1,slopeType:"unknown",slopeValue:12}),/INVALID_RAMP_SLOPE_TYPE/);
  assert.throws(()=>calculateRampFromSlope({rise:1,slopeType:"ratio",slopeValue:0}),/INVALID_RAMP_VALUE/);
});

test("Ramp UI exposes verification and slope-design workflows accessibly",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/id="ramp-geometry-title"/);
  assert.match(index,/id="ramp-design-title"/);
  assert.match(index,/id="ramp-slope-type"/);
  assert.match(index,/id="ramp-slope-value"/);
  assert.match(index,/id="ramp-derived-note"/);
  assert.match(app,/calculateRampFromSlope/);
  assert.match(app,/rampValuesVerified/);
});
