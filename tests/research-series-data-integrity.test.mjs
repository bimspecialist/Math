import test from "node:test";
import assert from "node:assert/strict";
import {oneSampleTTest,linearRegression,chiSquareGoodnessOfFit} from "../src/science/statistics-research.js";

// Regression for a real data-integrity risk: Number(null), Number("") and
// Number(false) yield zero, which can silently fabricate an observation.
test("one-sample inference rejects missing or nonnumeric data rather than filling zero",()=>{
  for(const series of [[10,"",12],[10,"  ",12],[10,null,12],[10,false,12]]){
    assert.deepEqual(oneSampleTTest(series,10),{kind:"error",code:"INVALID_INPUT"});
  }
});

test("regression refuses an omitted X observation instead of shifting/fabricating samples",()=>{
  assert.deepEqual(linearRegression([1,null,3],[2,4,6]),{kind:"error",code:"INVALID_INPUT"});
  assert.deepEqual(linearRegression([1,"",3],[2,4,6]),{kind:"error",code:"INVALID_INPUT"});
});

test("chi-square observed and expected arrays reject missing values",()=>{
  assert.deepEqual(chiSquareGoodnessOfFit([10,null,10],[5,5,10]),{kind:"error",code:"INVALID_INPUT"});
  assert.deepEqual(chiSquareGoodnessOfFit([10,0,10],[5,"",15]),{kind:"error",code:"INVALID_INPUT"});
});

import { parseResearchSeries } from "../src/science/research-series-input.js";
import { UI_STRINGS } from "../src/i18n/ui-strings.js";
import { readFileSync } from "node:fs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("scientific data parser preserves every real observation and accepts spreadsheet whitespace",()=>{
  assert.deepEqual(parseResearchSeries("1, 2.5; -3e-2\n4\t5"),{ok:true,values:[1,2.5,-0.03,4,5]});
  assert.deepEqual(parseResearchSeries(" 1 2 3 "),{ok:true,values:[1,2,3]});
  assert.deepEqual(parseResearchSeries("0,-0,+2.5e+3"),{ok:true,values:[0,-0,2500]});
});

test("data parser rejects blank cells and malformed exponent notation rather than dropping them",()=>{
  for(const text of ["1,,3",",1,3","1,3,","1; ;3","1؛؛3","1,\n,3"]){
    assert.deepEqual(parseResearchSeries(text),{ok:false,code:"RESEARCH_SERIES_GAP"},text);
  }
  for(const text of ["","   ","\n"]){
    assert.deepEqual(parseResearchSeries(text),{ok:false,code:"RESEARCH_SERIES_REQUIRED"});
  }
  for(const text of ["1,foo,3","1e,3","0x10,2","Infinity,2","1e999,3","1.2.3;2"]){
    assert.deepEqual(parseResearchSeries(text),{ok:false,code:"RESEARCH_SERIES_INVALID"},text);
  }
});

test("Arabic and Persian digits, Arabic decimal and Arabic list punctuation remain valid",()=>{
  assert.deepEqual(parseResearchSeries("١، ٢٫٥؛ −٣"),{ok:true,values:[1,2.5,-3]});
  assert.deepEqual(parseResearchSeries("۱ ۲٫۵ ۳"),{ok:true,values:[1,2.5,3]});
  assert.deepEqual(parseResearchSeries("١٬٠٠٠"),{ok:false,code:"RESEARCH_SERIES_INVALID"});
});

test("research UI consumes strict parser for t-test, regression and goodness-of-fit",()=>{
  const app=read("src/app.js");
  const html=read("index.html");
  assert.match(app,/import \{ parseResearchSeries \} from "\.\/science\/research-series-input\.js"/);
  assert.match(app,/function readResearchSeries\(id\)/);
  assert.match(app,/reportResearchSeriesProblem\(out,\[x,y\]\)/);
  assert.match(app,/reportResearchSeriesProblem\(out,\[observed,expected\]\)/);
  assert.doesNotMatch(app,/split\(\/\[;,\\s\]\+\/\)\.filter\(Boolean\)\.map\(Number\)/);
  for(const id of ["research-stats-data","research-regression-x","research-regression-y","research-chi-observed","research-chi-expected"]){
    assert.match(html,new RegExp('id="'+id+'" dir="ltr" aria-describedby="research-'));
  }
  for(const key of ["researchSeriesHint","RESEARCH_SERIES_REQUIRED","RESEARCH_SERIES_GAP","RESEARCH_SERIES_INVALID","RESEARCH_SERIES_LENGTH_MISMATCH"]){
    assert.ok(UI_STRINGS.en[key]&&UI_STRINGS.ar[key],"missing localized message "+key);
  }
});

test("spreadsheet paste with empty rows or empty tabular columns is rejected",()=>{
  for(const source of ["1\n\n3","1\r\n \r\n3","1\n;\n3","1\n,\n3","1\t\t3","1\t  \t3"]){
    assert.deepEqual(parseResearchSeries(source),{ok:false,code:"RESEARCH_SERIES_GAP"},JSON.stringify(source));
  }
  assert.deepEqual(parseResearchSeries("1\t2\n3\t4"),{ok:true,values:[1,2,3,4]});
});

test("validated pasted data produce the expected statistical calculations",()=>{
  const x=parseResearchSeries("١،٢،٣،٤،٥");
  const y=parseResearchSeries("3 5 7 9 11");
  assert.equal(x.ok,true);assert.equal(y.ok,true);
  const reg=linearRegression(x.values,y.values);
  assert.equal(reg.kind,"linear-regression");
  assert.ok(Math.abs(reg.slope-2)<1e-12);
  assert.ok(Math.abs(reg.intercept-1)<1e-12);
  const observed=parseResearchSeries("20,30,50"),expected=parseResearchSeries("25,25,50");
  const gof=chiSquareGoodnessOfFit(observed.values,expected.values);
  assert.equal(gof.kind,"chi-square");
  assert.ok(Math.abs(gof.statistic-2)<1e-12);
  assert.ok(Math.abs(gof.pValue-Math.exp(-1))<1e-11);
  assert.deepEqual(parseResearchSeries("<script>alert(1)</script>"),{ok:false,code:"RESEARCH_SERIES_INVALID"});
});
