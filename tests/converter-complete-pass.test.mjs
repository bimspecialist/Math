import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { convertUnit, conversionFactor, formatConversionValue, unitsFor } from "../src/converters/unit-converter.js";

test("Unit Converter covers expanded engineering categories accurately",()=>{
  assert.ok(Math.abs(convertUnit("force",1,"lbf","N")-4.4482216152605)<1e-12);
  assert.ok(Math.abs(convertUnit("torque",1,"lbf·ft","N·m")-1.3558179483314004)<1e-12);
  assert.equal(convertUnit("frequency",60,"rpm","Hz"),1);
  assert.ok(Math.abs(convertUnit("density",1,"g/cm3","kg/m3")-1000)<1e-12);
});

test("Unit Converter preserves round-trip values across linear categories",()=>{
  for(const [category,from,to,value] of [
    ["length","mi","km",12.345],
    ["pressure","psi","kPa",42.5],
    ["energy","BTU","kJ",250],
    ["volume","US gal","L",3.2],
    ["data","GiB","MB",1.5]
  ]){
    const converted=convertUnit(category,value,from,to);
    const roundTrip=convertUnit(category,converted,to,from);
    assert.ok(Math.abs(roundTrip-value)<=Math.max(1,Math.abs(value))*1e-12,category);
  }
});

test("Temperature conversion includes Rankine and rejects below absolute zero",()=>{
  assert.ok(Math.abs(convertUnit("temperature",0,"C","K")-273.15)<1e-12);
  assert.ok(Math.abs(convertUnit("temperature",491.67,"R","C"))<1e-10);
  assert.throws(()=>convertUnit("temperature",-1,"K","C"),/BELOW_ABSOLUTE_ZERO/);
  assert.throws(()=>convertUnit("temperature",-500,"C","F"),/BELOW_ABSOLUTE_ZERO/);
});

test("Conversion factors are available only for linear conversions",()=>{
  assert.equal(conversionFactor("length","km","m"),1000);
  assert.equal(conversionFactor("temperature","C","F"),null);
});

test("Conversion formatting handles ordinary and scientific magnitudes",()=>{
  assert.equal(formatConversionValue(1234.56789,6),"1234.57");
  assert.match(formatConversionValue(1e-10,6),/e-10$/);
  assert.equal(formatConversionValue(0,12),"0");
});

test("Converter UI exposes complete categories precision and localized validation",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  for(const id of ["force","torque","frequency","density"])assert.match(index,new RegExp(`data-converter-category="${id}"`));
  assert.match(index,/id="converter-category"/);
  assert.match(index,/id="converter-precision"/);
  assert.match(index,/id="converter-factor"/);
  assert.match(app,/formatConversionValue/);
  assert.match(app,/conversionFactor/);
  assert.match(app,/translate\(locale,error\.message\)/);
});

test("Expanded unit lists expose common engineering units",()=>{
  assert.ok(unitsFor("volume").includes("US gal"));
  assert.ok(unitsFor("pressure").includes("MPa"));
  assert.ok(unitsFor("temperature").includes("R"));
  assert.ok(unitsFor("force").includes("kN"));
});
