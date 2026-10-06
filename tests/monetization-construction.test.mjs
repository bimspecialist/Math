import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { calculateRamp } from "../src/construction/ramp-calculator.js";
import { validateAdSenseClient, validateAdSlot } from "../src/monetization/adsense.js";
import { validateMeasurementId } from "../src/analytics/google-analytics.js";
import { CALCULATOR_CATEGORIES } from "../src/catalog/calculator-categories.js";
import { SITE_CONFIG } from "../src/config/site-config.js";

test("ramp calculator solves rise and run",()=>{
  const r=calculateRamp({rise:1,run:12});
  assert.ok(Math.abs(r.length-Math.sqrt(145))<1e-12);
  assert.ok(Math.abs(r.angleDeg-4.7636416907)<1e-9);
  assert.ok(Math.abs(r.gradePercent-8.3333333333)<1e-9);
  assert.equal(r.ratioText,"1:12");
});

test("ramp calculator solves either missing leg from ramp length",()=>{
  const a=calculateRamp({rise:3,length:5});
  assert.equal(a.run,4);
  const b=calculateRamp({run:4,length:5});
  assert.equal(b.rise,3);
});

test("ramp calculator rejects impossible geometry",()=>{
  assert.throws(()=>calculateRamp({rise:5,length:4}),/INVALID_RAMP_GEOMETRY/);
  assert.throws(()=>calculateRamp({rise:0,run:12}),/INVALID_RAMP_VALUE/);
});

test("AdSense and Analytics identifiers are validated without guessing account values",()=>{
  assert.equal(validateAdSenseClient("ca-pub-1234567890123456"),true);
  assert.equal(validateAdSenseClient("pub-123"),false);
  assert.equal(validateAdSlot("1234567890"),true);
  assert.equal(validateAdSlot(""),false);
  assert.equal(validateMeasurementId("G-ABC123XYZ9"),true);
  assert.equal(validateMeasurementId("UA-123"),false);
  assert.equal(SITE_CONFIG.adsense.client,"ca-pub-5386218928692257");
  assert.equal(SITE_CONFIG.analytics.measurementId,"");
});

test("calculator catalog includes the requested category structure and Ramp Calculator",()=>{
  const ids=CALCULATOR_CATEGORIES.map(x=>x.id);
  for(const id of ["biology","chemistry","construction","conversion","ecology","everyday","finance","food","health","math","physics","sports","statistics","other"])assert.ok(ids.includes(id),id);
  const construction=CALCULATOR_CATEGORIES.find(x=>x.id==="construction");
  assert.ok(construction.tools.some(x=>x.id==="ramp"&&x.status==="available"));
});

test("site exposes monetization-ready ad placements, analytics consent, favicon, categories and Ramp Calculator",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.match(index,/rel="icon"[^>]*href="\.\/assets\/favicon\.svg"/);
  assert.match(index,/data-ad-placement="outer-left"/);
  assert.match(index,/data-ad-placement="side-left"/);
  assert.match(index,/data-ad-placement="side-right"/);
  assert.match(index,/data-ad-placement="outer-right"/);
  assert.match(index,/data-ad-placement="bottom-main"/);
  assert.match(index,/id="consent-banner"/);
  assert.match(index,/data-tool-target="categories"/);
  assert.match(index,/id="categories-section"/);
  assert.match(index,/data-tool-target="ramp"/);
  assert.match(index,/id="ramp-section"/);
  assert.match(index,/id="ramp-rise"/);
  assert.match(index,/id="ramp-run"/);
  assert.match(index,/id="ramp-length"/);
});

test("app initializes ads, analytics, categories and ramp calculator",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(app,/initAdSense/);
  assert.match(app,/initGoogleAnalytics/);
  assert.match(app,/renderCalculatorCategories/);
  assert.match(app,/calculateRamp/);
});

test("index does not eagerly load AdSense before consent",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  assert.doesNotMatch(index,/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js/);
});


test("AdSense initializer reuses the ownership script instead of loading a duplicate",()=>{
  const source=readFileSync(new URL("../src/monetization/adsense.js",import.meta.url),"utf8");
  assert.match(source,/script\[src\*="pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js"\]/);
});


test("local consent banner gates both advertising and analytics behind opt-in",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(app,/const CONSENT_KEY="math\.external-services-consent"/);
  assert.match(app,/const LEGACY_CONSENT_KEY="math\.analytics-consent"/);
  assert.match(app,/function enableExternalServices\(\)\{\s*initAdSense\(SITE_CONFIG\.adsense\);\s*initGoogleAnalytics\(SITE_CONFIG\.analytics\)/);
  const setup=app.slice(app.indexOf("function setupConsent()"),app.indexOf("function researchErrorText"));
  assert.doesNotMatch(setup,/initAdSense\(SITE_CONFIG\.adsense\)/);
  assert.match(setup,/choice==="accepted"\)\{enableExternalServices\(\)/);
});


test("manual ad containers can remain as reserved zones until real slot ids are supplied",()=>{
  const source=readFileSync(new URL("../src/monetization/adsense.js",import.meta.url),"utf8");
  assert.match(source,/container\.hidden=!config\.showReservedSlots/);
  assert.equal(SITE_CONFIG.adsense.showReservedSlots,true);
  assert.match(source,/container\.hidden=false/);
});
