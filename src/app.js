import { CalculatorController } from "./calculator/calculator-controller.js";
import { mountCalculator } from "./calculator/render-calculator.js";
import { solveAdvancedInput } from "./advanced/advanced-solver.js";
import { formatAdvancedResult } from "./advanced/advanced-result-format.js";
import { FORMULA_CATEGORIES, filterFormulas } from "./formulas/formula-library.js";
import { runMathLabScript } from "./mathlab/math-lab-engine.js";
import { CONVERTER_CATEGORIES, convertUnit, unitsFor } from "./converters/unit-converter.js";
const controller=new CalculatorController();
const calculatorRoot=document.querySelector("#calculator-root");
let locale=document.documentElement.lang==="en"?"en":"ar";
const mounted=mountCalculator(calculatorRoot,controller,locale);
document.addEventListener("keydown",event=>{if(event.target instanceof HTMLTextAreaElement||event.target instanceof HTMLInputElement)return;mounted.keydown(event)});
document.querySelector("#lang-toggle")?.addEventListener("click",event=>{locale=locale==="ar"?"en":"ar";document.documentElement.lang=locale;document.documentElement.dir=locale==="ar"?"rtl":"ltr";event.currentTarget.textContent=locale==="ar"?"EN":"AR";document.querySelector("#page-title").textContent=locale==="ar"?"الحاسبة العلمية":"Scientific Calculator";document.querySelector("[data-tab-target='calculator']").textContent=locale==="ar"?"الحاسبة":"Calculator";mounted.setLocale(locale)});
const toolSidebar=document.querySelector("#tool-sidebar");
function activateTool(target){
  document.querySelectorAll("[data-tool-target]").forEach(x=>x.classList.toggle("active",x.dataset.toolTarget===target));
  document.querySelectorAll(".page-section").forEach(section=>section.classList.toggle("active",section.id===target+"-section"));
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
function handleImage(file){if(!file)return;const preview=document.querySelector("#scan-preview");preview.src=URL.createObjectURL(file);preview.hidden=false;document.querySelector("#scan-note").textContent="تم اختيار الصورة. Math Recognition الفعلي سيُربط بمزوّد server-side لاحقًا؛ راجع المعادلة يدويًا قبل الحل."}
document.querySelector("#image-upload")?.addEventListener("change",e=>handleImage(e.target.files?.[0]));
document.querySelector("#camera-upload")?.addEventListener("change",e=>handleImage(e.target.files?.[0]));

const advancedInput=document.querySelector("#advanced-input");
const advancedResult=document.querySelector("#advanced-result");
document.querySelector("#advanced-solve")?.addEventListener("click",()=>{
  const result=solveAdvancedInput(advancedInput?.value??"");
  if(advancedResult){advancedResult.textContent=formatAdvancedResult(result);advancedResult.dataset.kind=result.kind}
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
function renderFormulaLibrary(){
  const select=document.querySelector("#formula-category");
  const search=document.querySelector("#formula-search");
  const grid=document.querySelector("#formula-grid");
  const count=document.querySelector("#formula-count");
  if(!select||!grid)return;
  if(!select.options.length){
    for(const category of FORMULA_CATEGORIES){
      const option=document.createElement("option");
      option.value=category.id;
      option.textContent=locale==="ar"?category.labelAr:category.labelEn;
      select.appendChild(option);
    }
  }
  const rows=filterFormulas({category:select.value||"all",query:search?.value??""});
  grid.innerHTML=rows.map(x=>`<article class="formula-card"><div class="formula-card-meta">${escHtml(x.titleEn)}</div><h3>${escHtml(x.titleAr)}</h3><div class="formula-expression" dir="ltr">${escHtml(x.formula)}</div><p>${escHtml(x.descriptionAr)}</p></article>`).join("");
  if(count)count.textContent=(locale==="ar"?`عدد القوانين: ${rows.length}`:`${rows.length} formulas`);
}
document.querySelector("#formula-search")?.addEventListener("input",renderFormulaLibrary);
document.querySelector("#formula-category")?.addEventListener("change",renderFormulaLibrary);
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
    mathLabWorkspace.innerHTML=entries.length?entries.map(([name,value])=>`<div class="workspace-row"><strong>${escHtml(name)}</strong><code dir="ltr">${escHtml(formatLabValue(value))}</code></div>`).join(""):'<span class="muted">No variables yet</span>';
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
  const title=document.querySelector("#converter-title");if(title)title.textContent=category[0].toUpperCase()+category.slice(1)+" Converter";
  renderConverterUnits();updateConverter();
}
converterInput?.addEventListener("input",updateConverter);converterFrom?.addEventListener("change",updateConverter);converterTo?.addEventListener("change",updateConverter);
document.querySelector("#converter-swap")?.addEventListener("click",()=>{if(!converterFrom||!converterTo)return;const a=converterFrom.value;converterFrom.value=converterTo.value;converterTo.value=a;updateConverter()});
renderConverterUnits();updateConverter();
