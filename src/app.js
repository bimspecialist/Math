import { CalculatorController } from "./calculator/calculator-controller.js";
import { mountCalculator } from "./calculator/render-calculator.js";
import { solveAdvancedInput } from "./advanced/advanced-solver.js";
import { formatAdvancedResult } from "./advanced/advanced-result-format.js";
import { FORMULA_CATEGORIES, filterFormulas } from "./formulas/formula-library.js";
import { runMathLabScript } from "./mathlab/math-lab-engine.js";
import { CONVERTER_CATEGORIES, convertUnit, unitsFor } from "./converters/unit-converter.js";
import { sampleGraphExpressions, graphBounds } from "./graphing/graph-engine.js";
import { parseInteger, describeInteger, bitwise } from "./programmer/programmer-engine.js";
import { daysBetween, addDays } from "./date/date-calculator.js";
import { translate } from "./i18n/ui-strings.js";
import { SITE_CONFIG } from "./config/site-config.js";
import { initAdSense } from "./monetization/adsense.js";
import { initGoogleAnalytics, trackVirtualPage } from "./analytics/google-analytics.js";
import { CALCULATOR_CATEGORIES } from "./catalog/calculator-categories.js";
import { calculateRamp } from "./construction/ramp-calculator.js";
const controller=new CalculatorController();
const calculatorRoot=document.querySelector("#calculator-root");
let locale=document.documentElement.lang==="ar"?"ar":"en";
const mounted=mountCalculator(calculatorRoot,controller,locale);
document.addEventListener("keydown",event=>{if(event.target instanceof HTMLTextAreaElement||event.target instanceof HTMLInputElement)return;mounted.keydown(event)});
function applyLocale(nextLocale){
  locale=nextLocale==="ar"?"ar":"en";
  document.documentElement.lang=locale;
  document.documentElement.dir=locale==="ar"?"rtl":"ltr";
  document.title=translate(locale,"siteTitle");
  document.querySelectorAll("[data-i18n]").forEach(el=>{el.textContent=translate(locale,el.dataset.i18n)});
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el=>{el.setAttribute("placeholder",translate(locale,el.dataset.i18nPlaceholder))});
  document.querySelectorAll("[data-i18n-aria-label]").forEach(el=>{el.setAttribute("aria-label",translate(locale,el.dataset.i18nAriaLabel))});
  document.querySelectorAll("[data-i18n-alt]").forEach(el=>{el.setAttribute("alt",translate(locale,el.dataset.i18nAlt))});
  const langToggle=document.querySelector("#lang-toggle");
  if(langToggle)langToggle.textContent=locale==="en"?"AR":"EN";
  mounted.setLocale(locale);
  renderFormulaCategories();
  renderFormulaLibrary();
  renderCalculatorCategories();
  selectConverterCategory(activeConverterCategory);
  updateDateCalculator();
  if(lastAdvancedResult&&advancedResult)advancedResult.textContent=formatAdvancedResult(lastAdvancedResult,locale);
}
document.querySelector("#lang-toggle")?.addEventListener("click",()=>applyLocale(locale==="en"?"ar":"en"));
const toolSidebar=document.querySelector("#tool-sidebar");
function activateTool(target){
  document.querySelectorAll("[data-tool-target]").forEach(x=>x.classList.toggle("active",x.dataset.toolTarget===target));
  document.querySelectorAll(".page-section").forEach(section=>section.classList.toggle("active",section.id===target+"-section"));
  trackVirtualPage("/#"+target,document.title);
  if(window.matchMedia?.("(max-width: 900px)").matches){
    toolSidebar?.classList.remove("open");
    document.querySelector("#sidebar-toggle")?.setAttribute("aria-expanded","false");
  }
}
document.querySelectorAll("[data-tool-target]").forEach(button=>button.addEventListener("click",()=>{
  if(button.dataset.converterCategory)selectConverterCategory(button.dataset.converterCategory);
  activateTool(button.dataset.toolTarget);
}));
document.querySelector("#sidebar-toggle")?.addEventListener("click",event=>{
  const open=toolSidebar?.classList.toggle("open")??false;
  event.currentTarget.setAttribute("aria-expanded",String(open));
});
function handleImage(file){if(!file)return;const preview=document.querySelector("#scan-preview");preview.src=URL.createObjectURL(file);preview.hidden=false;document.querySelector("#scan-note").textContent=translate(locale,"scanSelected")}
document.querySelector("#image-upload")?.addEventListener("change",e=>handleImage(e.target.files?.[0]));
document.querySelector("#camera-upload")?.addEventListener("change",e=>handleImage(e.target.files?.[0]));

const advancedInput=document.querySelector("#advanced-input");
const advancedResult=document.querySelector("#advanced-result");
let lastAdvancedResult=null;
document.querySelector("#advanced-solve")?.addEventListener("click",()=>{
  const result=solveAdvancedInput(advancedInput?.value??"");
  lastAdvancedResult=result;
  if(advancedResult){advancedResult.textContent=formatAdvancedResult(result,locale);advancedResult.dataset.kind=result.kind}
});
advancedInput?.addEventListener("keydown",event=>{
  if((event.ctrlKey||event.metaKey)&&event.key==="Enter"){event.preventDefault();document.querySelector("#advanced-solve")?.click()}
});

document.querySelectorAll("[data-advanced-example]").forEach(button=>button.addEventListener("click",()=>{
  if(!advancedInput)return;
  advancedInput.value=button.dataset.advancedExample??"";
  advancedInput.focus();
  document.querySelector("#advanced-solve")?.click();
}));

function escHtml(value){return String(value??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function renderFormulaCategories(){
  const select=document.querySelector("#formula-category");
  if(!select)return;
  const selected=select.value||"all";
  select.innerHTML="";
  for(const category of FORMULA_CATEGORIES){
    const option=document.createElement("option");
    option.value=category.id;
    option.textContent=locale==="ar"?category.labelAr:category.labelEn;
    select.appendChild(option);
  }
  if([...select.options].some(x=>x.value===selected))select.value=selected;
}
function renderFormulaLibrary(){
  const select=document.querySelector("#formula-category");
  const search=document.querySelector("#formula-search");
  const grid=document.querySelector("#formula-grid");
  const count=document.querySelector("#formula-count");
  if(!select||!grid)return;
  if(!select.options.length)renderFormulaCategories();
  const rows=filterFormulas({category:select.value||"all",query:search?.value??""});
  grid.innerHTML=rows.map(x=>{
    const title=locale==="ar"?x.titleAr:x.titleEn;
    const secondary=locale==="ar"?x.titleEn:x.titleAr;
    const description=locale==="ar"?x.descriptionAr:x.descriptionEn;
    return `<article class="formula-card"><div class="formula-card-meta">${escHtml(secondary)}</div><h3>${escHtml(title)}</h3><div class="formula-expression" dir="ltr">${escHtml(x.formula)}</div><p>${escHtml(description)}</p></article>`;
  }).join("");
  if(count)count.textContent=locale==="ar"?`عدد القوانين: ${rows.length}`:`${rows.length} formulas`;
}
document.querySelector("#formula-search")?.addEventListener("input",renderFormulaLibrary);
document.querySelector("#formula-category")?.addEventListener("change",renderFormulaLibrary);
renderFormulaCategories();
renderFormulaLibrary();

const mathLabInput=document.querySelector("#mathlab-input");
const mathLabOutput=document.querySelector("#mathlab-output");
const mathLabWorkspace=document.querySelector("#mathlab-workspace");
function formatLabValue(value){return Array.isArray(value)?JSON.stringify(value):String(value)}
function renderMathLabResult(result){
  if(mathLabOutput){
    const lines=result.outputs.map(x=>`>> ${x.source}\n${formatLabValue(x.value)}`);
    if(!result.ok)lines.push(`Error: ${result.error?.message??"MATHLAB_ERROR"}`);
    mathLabOutput.textContent=lines.length?lines.join("\n\n"):">> Ready";
  }
  if(mathLabWorkspace){
    const entries=Object.entries(result.workspace);
    mathLabWorkspace.innerHTML=entries.length?entries.map(([name,value])=>`<div class="workspace-row"><strong>${escHtml(name)}</strong><code dir="ltr">${escHtml(formatLabValue(value))}</code></div>`).join(""):`<span class="muted">${escHtml(translate(locale,"noVariables"))}</span>`;
  }
}
document.querySelector("#mathlab-run")?.addEventListener("click",()=>renderMathLabResult(runMathLabScript(mathLabInput?.value??"")));
document.querySelectorAll("[data-mathlab-example]").forEach(button=>button.addEventListener("click",()=>{
  if(!mathLabInput)return;
  mathLabInput.value=button.dataset.mathlabExample??"";
  mathLabInput.focus();
  document.querySelector("#mathlab-run")?.click();
}));

let activeConverterCategory="length";
const converterInput=document.querySelector("#converter-input");
const converterFrom=document.querySelector("#converter-from");
const converterTo=document.querySelector("#converter-to");
const converterResult=document.querySelector("#converter-result");
function renderConverterUnits(){
  if(!converterFrom||!converterTo)return;
  const units=unitsFor(activeConverterCategory);
  const options=units.map(u=>`<option value="${u}">${u}</option>`).join("");
  converterFrom.innerHTML=options;converterTo.innerHTML=options;
  if(units.length>1)converterTo.selectedIndex=1;
}
function updateConverter(){
  if(!converterInput||!converterFrom||!converterTo||!converterResult)return;
  try{
    const value=convertUnit(activeConverterCategory,converterInput.value,converterFrom.value,converterTo.value);
    converterResult.textContent=`${converterInput.value} ${converterFrom.value} = ${Number(value.toPrecision(12))} ${converterTo.value}`;
  }catch(error){converterResult.textContent=error.message}
}
function selectConverterCategory(category){
  if(!CONVERTER_CATEGORIES[category])return;
  activeConverterCategory=category;
  const title=document.querySelector("#converter-title");
  const titleKey={length:"converterLength",volume:"converterVolume",mass:"converterMass",temperature:"converterTemperature",energy:"converterEnergy",area:"converterArea",speed:"converterSpeed",time:"converterTime",power:"converterPower",data:"converterData",pressure:"converterPressure",angle:"converterAngle"}[category];
  if(title)title.textContent=(titleKey?translate(locale,titleKey)+" · ":"")+translate(locale,"converterTitle");
  renderConverterUnits();updateConverter();
}
converterInput?.addEventListener("input",updateConverter);converterFrom?.addEventListener("change",updateConverter);converterTo?.addEventListener("change",updateConverter);
document.querySelector("#converter-swap")?.addEventListener("click",()=>{if(!converterFrom||!converterTo)return;const a=converterFrom.value;converterFrom.value=converterTo.value;converterTo.value=a;updateConverter()});
renderConverterUnits();updateConverter();

const graphExpression=document.querySelector("#graph-expression");
const graphMinX=document.querySelector("#graph-min-x");
const graphMaxX=document.querySelector("#graph-max-x");
const graphCanvas=document.querySelector("#graph-canvas");
const graphStatus=document.querySelector("#graph-status");
function drawGraph(){
  if(!graphCanvas)return;
  const result=sampleGraphExpressions(graphExpression?.value??"",{minX:Number(graphMinX?.value??-10),maxX:Number(graphMaxX?.value??10),points:501});
  graphCanvas.innerHTML="";
  const legend=document.querySelector("#graph-legend");if(legend)legend.innerHTML="";
  if(!result.ok){if(graphStatus)graphStatus.textContent=result.error;return}
  const width=760,height=420,allSamples=result.series.flatMap(s=>s.samples),{minY,maxY}=graphBounds(allSamples);
  const sx=x=>(x-result.minX)/(result.maxX-result.minX)*width;
  const sy=y=>height-(y-minY)/(maxY-minY)*height;
  const makeLine=(x1,y1,x2,y2,klass)=>{
    const el=document.createElementNS("http://www.w3.org/2000/svg","line");
    el.setAttribute("x1",x1);el.setAttribute("y1",y1);el.setAttribute("x2",x2);el.setAttribute("y2",y2);el.setAttribute("class",klass);graphCanvas.appendChild(el);
  };
  if(result.minX<=0&&result.maxX>=0)makeLine(sx(0),0,sx(0),height,"graph-axis");
  if(minY<=0&&maxY>=0)makeLine(0,sy(0),width,sy(0),"graph-axis");
  result.series.forEach((series,index)=>{
    if(!series.result.ok)return;
    let d="",open=false;
    for(const p of series.samples){
      if(p.y===null||!Number.isFinite(p.y)){open=false;continue}
      const x=sx(p.x),y=sy(p.y);
      if(y<-height*4||y>height*5){open=false;continue}
      d+=(open?"L":"M")+x.toFixed(2)+" "+y.toFixed(2)+" ";open=true;
    }
    const path=document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d",d.trim());path.setAttribute("class",`graph-path graph-series-${index}`);graphCanvas.appendChild(path);
    if(legend){
      const item=document.createElement("span");item.className=`graph-legend-item graph-series-${index}`;
      item.textContent=series.expression;legend.appendChild(item);
    }
  });
  if(graphStatus)graphStatus.textContent=`x: [${result.minX}, ${result.maxX}] · y: [${Number(minY.toPrecision(5))}, ${Number(maxY.toPrecision(5))}]`;
}
document.querySelector("#graph-draw")?.addEventListener("click",drawGraph);
graphExpression?.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();drawGraph()}});
drawGraph();

const programmerInput=document.querySelector("#programmer-input");
const programmerBase=document.querySelector("#programmer-base");
const programmerB=document.querySelector("#programmer-b");
const programmerOp=document.querySelector("#programmer-op");
const programmerResult=document.querySelector("#programmer-result");
function renderProgrammer(){
  if(!programmerInput||!programmerBase||!programmerOp||!programmerResult)return;
  try{
    const base=Number(programmerBase.value),a=parseInteger(programmerInput.value,base);
    let value=a;
    if(programmerOp.value!=="convert"){
      const b=parseInteger(programmerB?.value??"0",base);
      value=bitwise(programmerOp.value,a,b);
    }
    const d=describeInteger(value);
    programmerResult.innerHTML=`<div><span>BIN</span><code>${escHtml(d.bin)}</code></div><div><span>OCT</span><code>${escHtml(d.oct)}</code></div><div><span>DEC</span><code>${escHtml(d.dec)}</code></div><div><span>HEX</span><code>${escHtml(d.hex)}</code></div>`;
  }catch(error){programmerResult.textContent=error.message}
}
document.querySelector("#programmer-run")?.addEventListener("click",renderProgrammer);
programmerInput?.addEventListener("input",renderProgrammer);programmerBase?.addEventListener("change",renderProgrammer);programmerOp?.addEventListener("change",renderProgrammer);
renderProgrammer();

const dateStart=document.querySelector("#date-start");
const dateEnd=document.querySelector("#date-end");
const dateDifference=document.querySelector("#date-difference");
const dateBase=document.querySelector("#date-base");
const dateOffset=document.querySelector("#date-offset");
const dateOffsetResult=document.querySelector("#date-offset-result");
function updateDateCalculator(){
  try{if(dateStart&&dateEnd&&dateDifference){const days=daysBetween(dateStart.value,dateEnd.value);dateDifference.textContent=locale==="ar"?`${days} يومًا`:`${days} day${Math.abs(days)===1?"":"s"}`}}catch(error){if(dateDifference)dateDifference.textContent=error.message}
  try{if(dateBase&&dateOffset&&dateOffsetResult)dateOffsetResult.textContent=addDays(dateBase.value,Number(dateOffset.value))}catch(error){if(dateOffsetResult)dateOffsetResult.textContent=error.message}
}
for(const el of [dateStart,dateEnd,dateBase,dateOffset])el?.addEventListener("input",updateDateCalculator);
updateDateCalculator();

applyLocale(locale);

function renderCalculatorCategories(){
  const root=document.querySelector("#calculator-categories");if(!root)return;
  root.innerHTML=CALCULATOR_CATEGORIES.map(category=>{
    const tools=category.tools.length?category.tools.map(tool=>tool.status==="available"
      ?`<button type="button" class="category-tool" data-category-tool="${tool.id}">${escHtml(locale==="ar"?tool.labelAr:tool.labelEn)}</button>`
      :`<span class="category-tool planned">${escHtml(locale==="ar"?tool.labelAr:tool.labelEn)}</span>`).join("")
      :`<span class="category-empty">${escHtml(translate(locale,"comingSoon"))}</span>`;
    return `<article class="category-card"><h3>${escHtml(locale==="ar"?category.labelAr:category.labelEn)}</h3><div class="category-tools">${tools}</div></article>`;
  }).join("");
  root.querySelectorAll("[data-category-tool]").forEach(button=>button.addEventListener("click",()=>activateTool(button.dataset.categoryTool)));
}
renderCalculatorCategories();

const rampRise=document.querySelector("#ramp-rise"),rampRun=document.querySelector("#ramp-run"),rampLength=document.querySelector("#ramp-length"),rampUnit=document.querySelector("#ramp-unit"),rampResult=document.querySelector("#ramp-result");
function updateRampCalculator(){
  if(!rampResult)return;
  try{
    const result=calculateRamp({rise:rampRise?.value,run:rampRun?.value,length:rampLength?.value});
    const unit=rampUnit?.value??"";
    rampResult.innerHTML=`<div><strong>${escHtml(translate(locale,"rampAngle"))}</strong><span>${result.angleDeg}°</span></div><div><strong>${escHtml(translate(locale,"rampGrade"))}</strong><span>${result.gradePercent}%</span></div><div><strong>${escHtml(translate(locale,"rampRatio"))}</strong><span>${escHtml(result.ratioText)}</span></div><div><strong>${escHtml(translate(locale,"rampRun"))}</strong><span>${result.run} ${escHtml(unit)}</span></div><div><strong>${escHtml(translate(locale,"rampLength"))}</strong><span>${result.length} ${escHtml(unit)}</span></div>`;
  }catch(error){rampResult.textContent=translate(locale,error.message)||error.message}
}
document.querySelector("#ramp-calculate")?.addEventListener("click",updateRampCalculator);
for(const el of [rampRise,rampRun,rampLength,rampUnit])el?.addEventListener("input",updateRampCalculator);
updateRampCalculator();

const CONSENT_KEY="math.external-services-consent";
function enableExternalServices(){
  initAdSense(SITE_CONFIG.adsense);
  initGoogleAnalytics(SITE_CONFIG.analytics);
}
function setupConsent(){
  const banner=document.querySelector("#consent-banner");if(!banner)return;
  let choice=null;try{choice=localStorage.getItem(CONSENT_KEY)}catch{}
  if(choice==="accepted"){enableExternalServices();return}
  if(choice==="rejected")return;
  if(!SITE_CONFIG.adsense.client&&!SITE_CONFIG.analytics.measurementId)return;
  banner.hidden=false;
  document.querySelector("#consent-accept")?.addEventListener("click",()=>{try{localStorage.setItem(CONSENT_KEY,"accepted")}catch{};banner.hidden=true;enableExternalServices()});
  document.querySelector("#consent-reject")?.addEventListener("click",()=>{try{localStorage.setItem(CONSENT_KEY,"rejected")}catch{};banner.hidden=true});
}
setupConsent();
