import test from "node:test";
import assert from "node:assert/strict";
import { calculateRamp } from "../src/construction/ramp-calculator.js";
import { rampDiagramLayout,rampSvgMarkup } from "../src/dashboard/ramp-diagram.js";

test("SVG ramp geometry is derived from the real calculation",()=>{
 const result=calculateRamp({rise:.75,run:3});
 const svg=rampSvgMarkup(result,{unit:"m",locale:"en"});
 assert.equal(result.gradePercent,25);
 assert.ok(Math.abs(result.length-Math.hypot(.75,3))<1e-12);
 for(const piece of ["<svg","role=\"img\"","Ramp length","3.092","0.75 m","3 m","14.036"])assert.ok(svg.includes(piece),piece);
 assert.match(svg,/<polygon points="/);
 assert.match(svg,/stroke="#1161ef"/);
 assert.ok(rampSvgMarkup(calculateRamp({rise:1.5,run:3})).length>0);
});

test("SVG diagram changes slope while preserving the numeric labels",()=>{
 const shallow=rampDiagramLayout(.75,3),steep=rampDiagramLayout(1.5,3);
 assert.ok(steep.y1<shallow.y1);
 assert.equal(steep.x1,shallow.x1);
 assert.ok(rampSvgMarkup(calculateRamp({rise:1.5,run:3}),{locale:"ar"}).includes("الارتفاع"));
});

test("visualization rejects invalid values and escapes units",()=>{
 assert.throws(()=>rampSvgMarkup({rise:NaN,run:3}),/INVALID_RAMP_GEOMETRY/);
 assert.throws(()=>rampDiagramLayout(0,1),/INVALID_RAMP_GEOMETRY/);
 const svg=rampSvgMarkup(calculateRamp({rise:1,run:2}),{unit:'<img src=x>',locale:"en"});
 assert.doesNotMatch(svg,/<img|src=x/);
});
