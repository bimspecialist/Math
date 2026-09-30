import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { addDateUnits, dateDifferenceDetails, daysBetween } from "../src/date/date-calculator.js";

test("Date Calculator returns signed absolute inclusive and week breakdowns",()=>{
  assert.deepEqual(dateDifferenceDetails("2026-01-01","2026-01-31"),{
    signedDays:30,absoluteDays:30,inclusiveDays:31,weeks:4,remainingDays:2
  });
  const reversed=dateDifferenceDetails("2026-01-31","2026-01-01");
  assert.equal(reversed.signedDays,-30);
  assert.equal(reversed.absoluteDays,30);
  assert.equal(reversed.inclusiveDays,31);
});

test("Date Calculator month arithmetic clamps to the target month",()=>{
  assert.equal(addDateUnits("2026-01-31",1,"months"),"2026-02-28");
  assert.equal(addDateUnits("2024-01-31",1,"months"),"2024-02-29");
  assert.equal(addDateUnits("2026-03-31",-1,"months"),"2026-02-28");
});

test("Date Calculator year arithmetic handles leap-day rollover",()=>{
  assert.equal(addDateUnits("2024-02-29",1,"years"),"2025-02-28");
  assert.equal(addDateUnits("2024-02-29",4,"years"),"2028-02-29");
});

test("Date Calculator supports weeks and remains timezone independent",()=>{
  assert.equal(addDateUnits("2026-03-25",2,"weeks"),"2026-04-08");
  assert.equal(daysBetween("2026-03-25","2026-04-08"),14);
});

test("Date Calculator rejects fractional offsets and unsupported units",()=>{
  assert.throws(()=>addDateUnits("2026-01-01",1.5,"days"),/INVALID_OFFSET/);
  assert.throws(()=>addDateUnits("2026-01-01",1,"hours"),/INVALID_DATE_UNIT/);
});

test("Date Calculator UI exposes detailed results unit selection and date swapping",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/id="date-unit"/);
  assert.match(index,/id="date-swap"/);
  assert.match(index,/id="date-difference-details"/);
  assert.match(index,/id="date-result-weekday"/);
  assert.match(app,/dateDifferenceDetails/);
  assert.match(app,/addDateUnits/);
  assert.match(app,/Intl\.DateTimeFormat/);
});
