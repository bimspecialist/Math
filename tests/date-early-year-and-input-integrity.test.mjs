import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseIsoDate, daysBetween, addDateUnits, dateDifferenceDetails } from "../src/date/date-calculator.js";

test("early ISO years are parsed as written, never silently shifted to 1900-1999",()=>{
  for(const iso of ["0000-01-01","0000-02-29","0001-01-01","0040-03-01","0099-12-31","0100-01-01","1900-03-01"]){
    const result=new Date(parseIsoDate(iso)).toISOString().slice(0,10);
    assert.equal(result,iso,iso);
  }
  for(const iso of ["0001-02-29","0099-02-29","0100-02-29","1900-02-29","2026-02-29"]){
    assert.throws(()=>parseIsoDate(iso),/INVALID_DATE/,iso);
  }
});

test("day differences across years 0099-0100 and leap year 0000 use calendar dates",()=>{
  assert.equal(daysBetween("0099-12-31","0100-01-01"),1);
  assert.equal(daysBetween("0000-02-28","0000-03-01"),2);
  assert.equal(daysBetween("0000-01-01","0001-01-01"),366);
  assert.deepEqual(dateDifferenceDetails("0099-12-31","0100-01-02"),{
    signedDays:2,absoluteDays:2,inclusiveDays:3,weeks:0,remainingDays:2
  });
});

test("adding months and years preserves leap-day clamping for early centuries",()=>{
  assert.equal(addDateUnits("0000-01-31",1,"months"),"0000-02-29");
  assert.equal(addDateUnits("0000-02-29",1,"years"),"0001-02-28");
  assert.equal(addDateUnits("0099-12-31",1,"months"),"0100-01-31");
  assert.equal(addDateUnits("0099-12-31",1,"days"),"0100-01-01");
  assert.equal(addDateUnits("0100-03-31",-1,"months"),"0100-02-28");
  assert.equal(addDateUnits("2024-01-31",1,"months"),"2024-02-29");
});

test("the four-digit date contract rejects arithmetic outside 0000 through 9999",()=>{
  assert.throws(()=>addDateUnits("0000-01-01",-1,"days"),/INVALID_DATE/);
  assert.throws(()=>addDateUnits("0000-01-15",-1,"months"),/INVALID_DATE/);
  assert.throws(()=>addDateUnits("9999-12-31",1,"days"),/INVALID_DATE/);
  assert.throws(()=>addDateUnits("9999-12-31",1,"years"),/INVALID_DATE/);
  assert.throws(()=>addDateUnits("9999-12-31",1,"months"),/INVALID_DATE/);
});

test("missing offsets cannot silently turn into a valid zero-day operation",()=>{
  for(const bad of ["","  ",null,false,true,undefined,Number.MAX_SAFE_INTEGER+1]){
    assert.throws(()=>addDateUnits("2026-10-13",bad,"days"),/INVALID_OFFSET/,String(bad));
  }
  assert.equal(addDateUnits("2026-10-13",0,"days"),"2026-10-13");
  assert.equal(addDateUnits("2026-10-13","0","days"),"2026-10-13");
  assert.equal(addDateUnits("2026-10-13","2","days"),"2026-10-15");
});

test("date UI passes the uncoerced offset to the domain validator",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(app,/addDateUnits\(dateBase\.value,dateOffset\.value,dateUnit\?\.value\?\?"days"\)/);
  assert.doesNotMatch(app,/addDateUnits\(dateBase\.value,Number\(dateOffset\.value\)/);
});
