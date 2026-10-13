import test from "node:test";
import assert from "node:assert/strict";
import {mountDashboard} from "../src/dashboard/dashboard.js";
import {UI_STRINGS} from "../src/i18n/ui-strings.js";
import {solveAdvancedInput} from "../src/advanced/advanced-solver.js";
import {formatAdvancedResult} from "../src/advanced/advanced-result-format.js";

class FakeElement {
  constructor({value="",textContent=""}={}){
    this.value=value;this.textContent=textContent;this.dataset={};this.listeners=new Map();
    this.attrs=new Map();this.hidden=false;this.disabled=false;this.innerHTML="";
  }
  addEventListener(name,callback){
    if(!this.listeners.has(name))this.listeners.set(name,[]);
    this.listeners.get(name).push(callback);
  }
  async fire(name,opts={}){
    const event={key:"",isComposing:false,preventDefault(){},...opts};
    for(const listener of (this.listeners.get(name)||[]))await listener(event);
  }
  setAttribute(key,value){this.attrs.set(key,value)}
  removeAttribute(key){this.attrs.delete(key)}
  getAttribute(key){return this.attrs.get(key)}
  replaceChildren(){this.innerHTML=""}
  blur(){this.blurred=true}
  querySelector(){return null}
}

function makeTestHarness(){
 const ids=["home-ramp-rise","home-ramp-run","home-ramp-unit","home-ramp-length",
    "home-ramp-visual","home-ramp-grade","home-ramp-angle","home-ramp-ratio","home-ramp-message",
    "home-ramp-calculate","home-ramp-reset","home-sci-expression","home-sci-result","home-sci-run",
    "home-convert-value","home-convert-from","home-convert-to","home-convert-result","home-convert-swap",
    "home-solver-equation","home-solver-result","home-solver-run",
    "dashboard-search","dashboard-search-empty","dashboard-search-count"];
 const map=new Map(ids.map(id=>[id,new FakeElement()]));
 const get=id=>map.get(id);
 get("home-ramp-rise").value="0.75";
 get("home-ramp-run").value="3";
 get("home-ramp-unit").value="m";
 get("home-sci-expression").value="sin(30) + 2^3";
 get("home-convert-value").value="5";
 get("home-convert-from").value="m";
 get("home-convert-to").value="ft";
 get("home-solver-equation").value="x^2 - 5*x + 6 = 0";
 const cardNames=["Scientific Calculator","Hydraulics Library","Advanced Solver"];
 let opened=false;
 const cards=cardNames.map(text=>{
   const card=new FakeElement({textContent:text});
   card.querySelector=()=>({click(){opened=true}});
   return card;
 });
 const document={
   getElementById:id=>get(id)??null,
   querySelectorAll:selector=>selector==="#home-tool-grid .mw-tool-card"?cards:[]
 };
 return {document,get,cards,wasOpened:()=>opened};
}

test("changing ramp rise immediately updates visual geometry and dependent results",async()=>{
 const original=globalThis.document;
 const h=makeTestHarness();globalThis.document=h.document;
 try{
   let locale="en";
   const ui=mountDashboard({
     getLocale:()=>locale,translate:(lang,key)=>UI_STRINGS[lang]?.[key]??key,
     ensureAdvancedTools:async()=>({solveAdvancedInput,formatAdvancedResult}),
     onSearch:()=>{}
   });
   assert.equal(h.get("home-ramp-grade").textContent,"25%");
   assert.ok(h.get("home-ramp-visual").innerHTML.includes("0.75 m"));
   assert.ok(Math.abs(Number(h.get("home-ramp-length").value)-Math.hypot(.75,3))<1e-7);

   h.get("home-ramp-rise").value="1.5";
   await h.get("home-ramp-rise").fire("input");
   assert.equal(h.get("home-ramp-grade").textContent,"50%");
   assert.ok(h.get("home-ramp-visual").innerHTML.includes("1.5 m"));

   h.get("home-ramp-run").value="";
   await h.get("home-ramp-run").fire("input");
   assert.equal(h.get("home-ramp-visual").innerHTML,"");
   assert.equal(h.get("home-ramp-run").getAttribute("aria-invalid"),"true");
   assert.equal(h.get("home-ramp-grade").textContent,"—");

   await h.get("home-ramp-reset").fire("click");
   assert.equal(h.get("home-ramp-run").value,"3");
   assert.equal(h.get("home-ramp-grade").textContent,"25%");

   h.get("home-ramp-unit").value="ft";
   await h.get("home-ramp-unit").fire("change");
   assert.ok(Math.abs(Number(h.get("home-ramp-rise").value)-2.4606299213)<1e-7);
   assert.ok(h.get("home-ramp-visual").innerHTML.includes("ft"));

   locale="ar";ui.refreshLocale();
   assert.ok(h.get("home-ramp-visual").innerHTML.includes("الارتفاع"));
 }finally{globalThis.document=original}
});

test("mini expression, deferred solver, unit swap and dashboard search execute actions",async()=>{
 const original=globalThis.document;
 const h=makeTestHarness();globalThis.document=h.document;
 try{
   let routed=0,solverLoads=0;
   mountDashboard({
     getLocale:()=>"en",translate:(l,key)=>UI_STRINGS[l]?.[key]??key,
     ensureAdvancedTools:async()=>{
       solverLoads++;
       return {solveAdvancedInput,formatAdvancedResult};
     },
     onSearch:()=>routed++
   });
   assert.equal(h.get("home-sci-result").textContent,"8.5");
   h.get("home-sci-expression").value="2^5";
   await h.get("home-sci-run").fire("click");
   assert.equal(h.get("home-sci-result").textContent,"32");
   assert.equal(solverLoads,0,"advanced code remains lazy until explicitly requested");
   await h.get("home-solver-run").fire("click");
   assert.equal(solverLoads,1);
   assert.match(h.get("home-solver-result").textContent,/2/);
   assert.match(h.get("home-solver-result").textContent,/3/);

   assert.ok(Math.abs(Number(h.get("home-convert-result").textContent)-16.4041994751)<1e-8);
   await h.get("home-convert-swap").fire("click");
   assert.equal(h.get("home-convert-from").value,"ft");
   assert.equal(h.get("home-convert-to").value,"m");
   assert.ok(Math.abs(Number(h.get("home-convert-result").textContent)-5)<1e-7);

   h.get("dashboard-search").value="Hydraulics";
   await h.get("dashboard-search").fire("input");
   assert.ok(routed>0);
   assert.equal(h.cards.filter(card=>!card.hidden).length,1);
   await h.get("dashboard-search").fire("keydown",{key:"Enter"});
   assert.ok(h.wasOpened());
   h.get("dashboard-search").value="not-a-real-tool";
   await h.get("dashboard-search").fire("input");
   assert.equal(h.get("dashboard-search-empty").hidden,false);
 }finally{globalThis.document=original}
});
