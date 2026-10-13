import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {spawnSync} from "node:child_process";
import {UI_STRINGS} from "../src/i18n/ui-strings.js";
import {evaluateExpression} from "../src/calculator/math-engine.js";
import {calculateRamp} from "../src/construction/ramp-calculator.js";
import {convertUnit} from "../src/converters/unit-converter.js";
import {solveAdvancedInput} from "../src/advanced/advanced-solver.js";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const html=read("index.html"),css=read("styles/dashboard.css"),app=read("src/app.js"),
  dashboard=read("src/dashboard/dashboard.js");

test("the real homepage uses the approved dashboard, with existing calculator intact",()=>{
  assert.match(html,/id="main-content" class="site-shell dashboard-active"/);
  assert.match(html,/<section id="home-section" class="page-section active"/);
  assert.match(html,/<section id="calculator-section" class="page-section">/);
  assert.match(html,/<div class="mw-hero-layout">/);
  assert.match(html,/<section class="mw-featured-ramp"/);
  assert.match(html,/<div id="home-tool-grid" class="mw-tool-grid">/);
  assert.equal((html.match(/class="mw-tool-card"/g)||[]).length,12);
  assert.match(app,/else activateTool\("home",\{updateHash:false,track:false\}\)/);
  assert.match(app,/classList\.toggle\("dashboard-active",target==="home"\)/);
  assert.match(app,/dashboardUI\.refreshLocale\(\)/);
});

test("featured ramp uses the actual calculation engine with live SVG and error recovery",()=>{
  for(const id of ["home-ramp-rise","home-ramp-run","home-ramp-length","home-ramp-unit","home-ramp-visual","home-ramp-grade","home-ramp-angle","home-ramp-ratio","home-ramp-calculate","home-ramp-reset","home-ramp-message","dashboard-open-ramp","ramp-live-visual"]){
    assert.match(html,new RegExp('id="'+id+'"'),id);
  }
  assert.match(dashboard,/calculateRamp\(\{rise:rise\.value,run:run\.value\}\)/);
  assert.match(dashboard,/rampSvgMarkup\(result,\{unit:unit\.value,locale:getLocale\(\)\}\)/);
  assert.match(dashboard,/message\.dataset\.error="true"/);
  assert.match(dashboard,/renderRamp\(\);/);
  assert.match(app,/diagram\.innerHTML=rampSvgMarkup\(result,\{unit,locale\}\)/);
  assert.match(app,/document\.querySelector\("#ramp-live-visual"\)\?\.replaceChildren\(\)/);
  assert.match(app,/rampRise\.value=homeRise\.value/);
  assert.match(html,/dashboardRampDisclaimer/);
  const r=calculateRamp({rise:0.75,run:3});
  assert.equal(r.gradePercent,25);
  assert.ok(Math.abs(r.angleDeg-14.0362434679)<1e-9);
});

test("mini calculator, solver, converter and graph preview lead to real math functionality",()=>{
  for(const id of ["home-sci-expression","home-sci-run","home-sci-result","home-solver-equation","home-solver-run","home-solver-result","home-convert-value","home-convert-from","home-convert-to","home-convert-swap","home-convert-result"]){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  assert.match(dashboard,/evaluateExpression\(sciInput\.value/);
  assert.match(dashboard,/solveAdvancedInput\(solveInput\.value/);
  assert.match(dashboard,/convertUnit\("length",convInput\.value,from\.value,to\.value\)/);
  assert.match(dashboard,/if\(Number\.isFinite\(previousResult\)\)convInput\.value=numberText\(previousResult\)/);
  assert.match(html,/f\(x\) = x² − 4/);
  const sci=evaluateExpression("sin(30) + 2^3",{angleMode:"DEG",ans:"0"});
  assert.equal(sci.kind,"value");assert.equal(sci.numeric,8.5);
  assert.ok(Math.abs(convertUnit("length",5,"m","ft")-16.404199475065616)<1e-11);
  assert.deepEqual(solveAdvancedInput("x^2 - 5*x + 6 = 0").solutions,[2,3]);
});

test("all dashboard cards open an existing task or an authorized library",()=>{
  const ids=new Set([...html.matchAll(/id="([A-Za-z][^"]+)"/g)].map(m=>m[1]));
  for(const match of html.matchAll(/<button[^>]+data-tool-target="([^"]+)"[^>]*>/g)){
    assert.ok(ids.has(match[1]+"-section"),"unsupported tool target "+match[1]);
  }
  assert.match(html,/data-knowledge-library="civil"/);
  assert.match(html,/data-knowledge-library="hydraulics"/);
  assert.match(html,/id="dashboard-search"/);
  assert.match(dashboard,/card\.hidden=!show/);
  assert.match(dashboard,/onSearch\?\.\(\)/);
});

test("responsive, light/dark and bilingual interface preserve real control semantics",()=>{
  const keys=[...new Set([...html.matchAll(/data-i18n(?:-placeholder|-aria-label|-alt)?="([^"]+)"/g)].map(m=>m[1]))];
  for(const key of keys){
    assert.ok(UI_STRINGS.en[key],"missing en "+key);
    assert.ok(UI_STRINGS.ar[key],"missing ar "+key);
  }
  assert.doesNotMatch(html,/[\u0600-\u06FF]/);
  assert.match(html,/<input id="home-ramp-length"[^>]*readonly/);
  assert.match(css,/@media\(max-width:1050px\)/);
  assert.match(css,/@media\(max-width:570px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/data-dashboard-theme="dark"/);
  assert.match(app,/dashboardThemeToggle\.setAttribute\("aria-pressed",String\(dark\)\)/);
  assert.match(app,/dashboardSearch\?\.focus\(\)/);
  assert.match(html,/id="privacy-choices"/);
  assert.match(app,/const CONSENT_KEY="math\.external-services-consent"/);
});

test("dashboard does not request extra tracking, block external services or load advanced code at startup",()=>{
  assert.doesNotMatch(dashboard,/fetch\(|https?:\/\/|localStorage|setInterval/);
  assert.match(dashboard,/await ensureAdvancedTools\(\)/);
  assert.match(app,/if\(!advancedToolsPromise\)advancedToolsPromise=Promise\.all/);
  assert.match(app,/if\(!mathLabEnginePromise\)mathLabEnginePromise=import/);
});

test("new browser modules and application entrypoint pass JavaScript syntax validation",()=>{
 for(const path of ["src/app.js","src/dashboard/dashboard.js","src/dashboard/ramp-diagram.js"]){
   const result=spawnSync(process.execPath,["--check",path],{encoding:"utf8"});
   assert.equal(result.status,0,path+": "+result.stderr);
 }
});

test("default homepage and full ramp share identical SVG implementation and no duplicate ids",()=>{
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
 assert.equal(new Set(ids).size,ids.length);
 assert.match(app,/import \{ rampSvgMarkup \} from "\.\/dashboard\/ramp-diagram\.js";/);
 assert.match(read("src/dashboard/dashboard.js"),/import \{ rampSvgMarkup \} from "\.\/ramp-diagram\.js";/);
 assert.match(read("styles/dashboard.css"),/\.mw-ramp-svg\{display:block;width:100%;height:auto/);
 assert.match(html,/dashboardRampDisclaimer/);
});
