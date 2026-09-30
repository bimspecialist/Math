import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sampleGraphExpression, resolveGraphYBounds } from "../src/graphing/graph-engine.js";

test("Graphing marks asymptote crossings so renderers do not connect them",()=>{
  const r=sampleGraphExpression("tan(x)",{minX:1.4,maxX:1.75,points:41});
  assert.equal(r.ok,true);
  assert.ok(r.samples.some(p=>p.breakBefore),"expected an asymptote break near pi/2");
});

test("Graphing preserves smooth steep functions without arbitrary breaks",()=>{
  const r=sampleGraphExpression("100*x",{minX:-1,maxX:1,points:41});
  assert.equal(r.ok,true);
  assert.equal(r.samples.filter(p=>p.breakBefore).length,0);
});

test("Graphing validates optional manual y ranges and keeps auto scaling default",()=>{
  const samples=sampleGraphExpression("x^2",{minX:-2,maxX:2,points:9}).samples;
  const auto=resolveGraphYBounds(samples,{});
  assert.equal(auto.ok,true);
  assert.equal(auto.auto,true);
  const manual=resolveGraphYBounds(samples,{minY:-2,maxY:8});
  assert.deepEqual(manual,{ok:true,minY:-2,maxY:8,auto:false});
  assert.equal(resolveGraphYBounds(samples,{minY:-2,maxY:""}).error,"INVALID_GRAPH_Y_RANGE");
  assert.equal(resolveGraphYBounds(samples,{minY:3,maxY:3}).error,"INVALID_GRAPH_Y_RANGE");
});

test("Graphing UI exposes accessible viewport controls and reset action",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/id="graph-min-y"/);
  assert.match(index,/id="graph-max-y"/);
  assert.match(index,/id="graph-reset"/);
  assert.match(index,/data-i18n-aria-label="graphLegend"/);
  assert.match(app,/resolveGraphYBounds/);
  assert.match(app,/p\.breakBefore/);
  assert.match(app,/graph-tick-label/);
});
