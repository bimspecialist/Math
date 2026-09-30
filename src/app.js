import { CalculatorController } from "./calculator/calculator-controller.js";
import { mountCalculator } from "./calculator/render-calculator.js";
import { solveAdvancedInput } from "./advanced/advanced-solver.js";
import { formatAdvancedResult } from "./advanced/advanced-result-format.js";
import { FORMULA_CATEGORIES, FORMULAS, filterFormulas } from "./formulas/formula-library.js";
import { runMathLabScript } from "./mathlab/math-lab-engine.js";
import { CONVERTER_CATEGORIES, convertUnit, unitsFor } from "./converters/unit-converter.js";
import { sampleGraphExpressions, resolveGraphYBounds } from "./graphing/graph-engine.js";
import { parseInteger, describeInteger, bitwise } from "./programmer/programmer-engine.js";
import { daysBetween, addDateUnits, dateDifferenceDetails } from "./date/date-calculator.js";
import { translate } from "./i18n/ui-strings.js";
import { SITE_CONFIG } from "./config/site-config.js";
import { initAdSense } from "./monetization/adsense.js";
import { initGoogleAnalytics, trackVirtualPage } from "./analytics/google-analytics.js";
import { CALCULATOR_CATEGORIES } from "./catalog/calculator-categories.js";
import { calculateRamp } from "./construction/ramp-calculator.js";
import { PROFESSIONAL_LIBRARIES, getProfessionalLibrary, getProfessionalFormula } from "./knowledge/professional-libraries.js";
import { inferReferenceVariables, substituteFormula, evaluateProfessionalFormula } from "./knowledge/formula-workbench.js";
import { professionalFormulaExplanation, referenceFormulaExplanation } from "./knowledge/formula-explanations.js";
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
  filterToolNavigation();
  renderFormulaCategories();
  renderFormulaLibrary();
  renderProfessionalLibrary();
  renderMathLabWorkspace();
  if(formulaDetailContext){
    captureFormulaDetailValues();
    renderFormulaDetail();
  }
  renderCalculatorCategories();
  selectConverterCategory(activeConverterCategory);
  updateDateCalculator();
  if(lastAdvancedResult&&advancedResult)advancedResult.textContent=formatAdvancedResult(lastAdvancedResult,locale);
  const activeSection=document.querySelector(".page-section.active");
  const activeTarget=activeSection?.id?.replace(/-section$/,"")||document.querySelector("[data-tool-target].active")?.dataset.toolTarget||"calculator";
  updateToolHeading(activeTarget);
}
document.querySelector("#lang-toggle")?.addEventListener("click",()=>applyLocale(locale==="en"?"ar":"en"));

const toolSearch=document.querySelector("#tool-search");
const toolSearchStatus=document.querySelector("#tool-search-status");
function filterToolNavigation(){
  const query=(toolSearch?.value??"").trim().toLocaleLowerCase(locale==="ar"?"ar":"en");
  let visibleCount=0;
  document.querySelectorAll("#tool-sidebar .tool-group").forEach(group=>{
    let groupVisible=0;
    group.querySelectorAll(".tool-item,.tool-item-static").forEach(item=>{
      const text=(item.textContent??"").trim().toLocaleLowerCase(locale==="ar"?"ar":"en");
      const matches=!query||text.includes(query);
      item.hidden=!matches;
      if(matches){groupVisible++;visibleCount++}
    });
    group.hidden=groupVisible===0;
  });
  if(toolSearchStatus)toolSearchStatus.textContent=`${translate(locale,"toolSearchResults")}: ${visibleCount}`;
}
toolSearch?.addEventListener("input",filterToolNavigation);
toolSearch?.addEventListener("keydown",event=>{
  if(event.key==="Escape"){
    event.preventDefault();
    if(toolSearch.value){
      toolSearch.value="";
      filterToolNavigation();
    }else{
      toolSearch.blur();
    }
  }
});
document.addEventListener("keydown",event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){
    event.preventDefault();
    toolSearch?.focus();
    toolSearch?.select();
  }
});
filterToolNavigation();

const toolSidebar=document.querySelector("#tool-sidebar");
const sidebarToggle=document.querySelector("#sidebar-toggle");
const toolTargets=new Set([...document.querySelectorAll("[data-tool-target]")].map(x=>x.dataset.toolTarget).filter(Boolean));
toolTargets.add("formula-detail");
const TOOL_TITLE_KEYS=Object.freeze({
  categories:"categoriesTitle",
  calculator:"pageTitle",
  advanced:"advancedTitle",
  formulas:"formulaTitle",
  knowledge:"professionalKnowledgeKicker",
  "formula-detail":"formulaCalculatorKicker",
  mathlab:"mathLabTitle",
  converter:"converterTitle",
  graphing:"graphingTitle",
  ramp:"rampTitle",
  programmer:"programmerTitle",
  date:"dateTitle"
});
function updateToolHeading(target){
  const key=TOOL_TITLE_KEYS[target]||"pageTitle";
  const title=translate(locale,key);
  const heading=document.querySelector("#page-title");
  if(heading)heading.textContent=title;
  document.title=target==="calculator"?translate(locale,"siteTitle"):`${title} — Math`;
}
function closeToolSidebar({restoreFocus=false}={}){
  const wasOpen=toolSidebar?.classList.contains("open")??false;
  toolSidebar?.classList.remove("open");
  sidebarToggle?.setAttribute("aria-expanded","false");
  if(restoreFocus&&wasOpen)sidebarToggle?.focus();
}
function activateTool(target,{updateHash=true,track=true}={}){
  if(!toolTargets.has(target))target="calculator";
  document.querySelectorAll("[data-tool-target]").forEach(x=>{
    let selected=x.dataset.toolTarget===target;
    if(selected&&x.dataset.converterCategory)selected=x.dataset.converterCategory===activeConverterCategory;
    if(selected&&x.dataset.knowledgeLibrary)selected=x.dataset.knowledgeLibrary===activeKnowledgeLibrary;
    x.classList.toggle("active",selected);
    x.setAttribute("aria-pressed",String(selected));
  });
  document.querySelectorAll(".page-section").forEach(section=>{
    const selected=section.id===target+"-section";
    section.classList.toggle("active",selected);
    section.setAttribute("aria-hidden",String(!selected));
  });
  updateToolHeading(target);
  if(target==="graphing"&&!graphInitialized)drawGraph();
  if(updateHash&&window.location.hash!=="#"+target)history.replaceState(null,"","#"+target);
  if(track)trackVirtualPage("/#"+target,document.title);
  if(window.matchMedia?.("(max-width: 900px)").matches)closeToolSidebar();
}
document.querySelectorAll("[data-tool-target]").forEach(button=>{
  button.setAttribute("aria-pressed",String(button.classList.contains("active")));
  button.addEventListener("click",()=>{
    if(button.dataset.converterCategory)selectConverterCategory(button.dataset.converterCategory);
    if(button.dataset.knowledgeLibrary)selectProfessionalLibrary(button.dataset.knowledgeLibrary);
    activateTool(button.dataset.toolTarget);
  });
});
sidebarToggle?.addEventListener("click",event=>{
  const open=toolSidebar?.classList.toggle("open")??false;
  event.currentTarget.setAttribute("aria-expanded",String(open));
  if(open)toolSidebar?.querySelector("[data-tool-target]")?.focus();
});
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&toolSidebar?.classList.contains("open")){
    event.preventDefault();
    closeToolSidebar({restoreFocus:true});
  }
});
window.addEventListener("hashchange",()=>{
  if(restoreFormulaHashRoute())return;
  const target=decodeURIComponent(window.location.hash.slice(1));
  if(toolTargets.has(target))activateTool(target,{updateHash:false});
});
let scanPreviewUrl=null;
function handleImage(file){
  if(!file||!String(file.type||"").startsWith("image/"))return;
  const preview=document.querySelector("#scan-preview");if(!preview)return;
  if(scanPreviewUrl)URL.revokeObjectURL(scanPreviewUrl);
  scanPreviewUrl=URL.createObjectURL(file);
  preview.src=scanPreviewUrl;
  preview.hidden=false;
  document.querySelector("#scan-note").textContent=translate(locale,"scanSelected");
}
window.addEventListener("pagehide",()=>{if(scanPreviewUrl)URL.revokeObjectURL(scanPreviewUrl)},{once:true});
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

let activeKnowledgeLibrary="accounting";
let formulaDetailContext=null;
let formulaDetailBackTarget="formulas";
let formulaDetailValues={};

function selectProfessionalLibrary(id){
  if(!getProfessionalLibrary(id))return;
  activeKnowledgeLibrary=id;
  const search=document.querySelector("#knowledge-search");if(search)search.value="";
  renderProfessionalLibrary();
}
function renderProfessionalLibrary(){
  const library=getProfessionalLibrary(activeKnowledgeLibrary)??PROFESSIONAL_LIBRARIES[0];
  const title=document.querySelector("#knowledge-title");
  const description=document.querySelector("#knowledge-description");
  const grid=document.querySelector("#knowledge-formulas");
  const count=document.querySelector("#knowledge-count");
  const search=document.querySelector("#knowledge-search");
  if(!library||!grid)return;
  if(title)title.textContent=locale==="ar"?library.labelAr:library.labelEn;
  if(description)description.textContent=locale==="ar"?library.descriptionAr:library.descriptionEn;
  const q=(search?.value??"").trim().toLowerCase();
  const rows=library.formulas.filter(formula=>{
    if(!q)return true;
    const explanationEn=professionalFormulaExplanation(library.id,formula.id,"en");
    const explanationAr=professionalFormulaExplanation(library.id,formula.id,"ar");
    const hay=[formula.titleEn,formula.titleAr,formula.formulaEn,formula.formulaAr,explanationEn,explanationAr].join(" ").toLowerCase();
    return hay.includes(q);
  });
  grid.innerHTML=rows.length?rows.map(formula=>{
    const titleText=locale==="ar"?formula.titleAr:formula.titleEn;
    const expression=locale==="ar"?formula.formulaAr:formula.formulaEn;
    return `<article class="formula-card"><button type="button" class="formula-open" data-professional-library="${escHtml(library.id)}" data-professional-formula="${escHtml(formula.id)}"><h3>${escHtml(titleText)}</h3><div class="formula-expression" dir="ltr">${escHtml(expression)}</div><span class="formula-card-action">${escHtml(translate(locale,"enterValues"))} →</span></button></article>`;
  }).join(""):`<p class="empty-state" role="status">${escHtml(translate(locale,"knowledgeNoResults"))}</p>`;
  if(count)count.textContent=locale==="ar"?`عدد القوانين: ${rows.length}`:`${rows.length} formulas`;
  grid.querySelectorAll("[data-professional-formula]").forEach(button=>button.addEventListener("click",()=>{
    openProfessionalFormula(button.dataset.professionalLibrary,button.dataset.professionalFormula);
  }));
}
function formulaHashForContext(context=formulaDetailContext){
  if(!context)return"#formulas";
  if(context.kind==="professional")return`#formula/professional/${encodeURIComponent(context.libraryId)}/${encodeURIComponent(context.formulaId)}`;
  return`#formula/reference/${encodeURIComponent(context.formulaId)}`;
}
function openProfessionalFormula(libraryId,formulaId,{fromHash=false}={}){
  const formula=getProfessionalFormula(libraryId,formulaId);if(!formula)return false;
  activeKnowledgeLibrary=libraryId;
  formulaDetailContext={kind:"professional",libraryId,formulaId};
  formulaDetailBackTarget="knowledge";
  formulaDetailValues={};
  renderProfessionalLibrary();
  renderFormulaDetail();
  activateTool("formula-detail",{updateHash:false});
  if(!fromHash)history.replaceState(null,"",formulaHashForContext());
  return true;
}
function openReferenceFormula(formulaId,{fromHash=false}={}){
  const formula=FORMULAS.find(x=>x.id===formulaId);if(!formula)return false;
  formulaDetailContext={kind:"reference",formulaId};
  formulaDetailBackTarget="formulas";
  formulaDetailValues={};
  renderFormulaDetail();
  activateTool("formula-detail",{updateHash:false});
  if(!fromHash)history.replaceState(null,"",formulaHashForContext());
  return true;
}
function restoreFormulaHashRoute(){
  const raw=decodeURIComponent(window.location.hash.slice(1));
  const parts=raw.split("/");
  if(parts[0]!=="formula")return false;
  if(parts[1]==="professional"&&parts[2]&&parts[3])return openProfessionalFormula(parts[2],parts[3],{fromHash:true});
  if(parts[1]==="reference"&&parts[2])return openReferenceFormula(parts[2],{fromHash:true});
  return false;
}
function currentFormulaDetail(){
  if(!formulaDetailContext)return null;
  if(formulaDetailContext.kind==="professional"){
    const formula=getProfessionalFormula(formulaDetailContext.libraryId,formulaDetailContext.formulaId);
    if(!formula)return null;
    return{
      title:locale==="ar"?formula.titleAr:formula.titleEn,
      description:"",
      explanation:professionalFormulaExplanation(formulaDetailContext.libraryId,formulaDetailContext.formulaId,locale),
      expression:formula.formulaEn,
      variables:formula.variables,
      professional:formula
    };
  }
  const formula=FORMULAS.find(x=>x.id===formulaDetailContext.formulaId);
  if(!formula)return null;
  return{
    title:locale==="ar"?formula.titleAr:formula.titleEn,
    description:locale==="ar"?formula.descriptionAr:formula.descriptionEn,
    explanation:referenceFormulaExplanation(formula,locale),
    expression:formula.formula,
    variables:inferReferenceVariables(formula.formula).map(id=>({id,labelEn:id,labelAr:id,defaultValue:""})),
    professional:null
  };
}
function captureFormulaDetailValues(){
  const inputs=document.querySelectorAll("#formula-detail-form [data-formula-variable]");
  if(!inputs.length)return;
  formulaDetailValues={...formulaDetailValues};
  inputs.forEach(input=>{formulaDetailValues[input.dataset.formulaVariable]=input.value});
}
function renderFormulaDetail(){
  const detail=currentFormulaDetail();if(!detail)return;
  const title=document.querySelector("#formula-detail-title");
  const description=document.querySelector("#formula-detail-description");
  const expression=document.querySelector("#formula-detail-expression");
  const explanation=document.querySelector("#formula-detail-explanation");
  const variableGuide=document.querySelector("#formula-variable-guide");
  const form=document.querySelector("#formula-detail-form");
  const substitution=document.querySelector("#formula-detail-substitution");
  const result=document.querySelector("#formula-detail-result");
  if(title)title.textContent=detail.title;
  if(description)description.textContent=detail.description;
  if(expression)expression.textContent=detail.expression;
  if(explanation)explanation.textContent=detail.explanation||detail.description||"";
  if(variableGuide){
    variableGuide.innerHTML=detail.variables.length
      ?`<h4>${escHtml(translate(locale,"variableGuideTitle"))}</h4><dl>${detail.variables.map(variable=>{
        const label=locale==="ar"?variable.labelAr:variable.labelEn;
        return `<div><dt dir="ltr">${escHtml(variable.id)}</dt><dd>${escHtml(label)}</dd></div>`;
      }).join("")}</dl>`
      :"";
  }
  const calculateButton=document.querySelector("#formula-detail-calculate");
  if(calculateButton)calculateButton.textContent=translate(locale,detail.professional?"substituteAndCalculate":"substituteValues");
  if(form)form.innerHTML=detail.variables.length?detail.variables.map(variable=>{
    const label=locale==="ar"?variable.labelAr:variable.labelEn;
    const value=formulaDetailValues[variable.id]??variable.defaultValue??"";
    return `<label><span>${escHtml(label)}</span><input type="number" step="any" inputmode="decimal" required data-formula-variable="${escHtml(variable.id)}" value="${escHtml(value)}" aria-invalid="false"></label>`;
  }).join(""):`<p class="empty-state">${escHtml(translate(locale,"referenceSubstitution"))}</p>`;
  if(substitution)substitution.textContent="";
  if(result)result.textContent="";
  const status=document.querySelector("#formula-detail-status");if(status)status.textContent="";
}
function calculateFormulaDetail(){
  const detail=currentFormulaDetail();if(!detail)return;
  const inputs=[...document.querySelectorAll("#formula-detail-form [data-formula-variable]")];
  const values={};
  let firstInvalid=null;
  for(const input of inputs){
    const raw=input.value.trim();
    const valid=raw!==""&&Number.isFinite(Number(raw));
    input.setAttribute("aria-invalid",String(!valid));
    if(!valid&&!firstInvalid)firstInvalid=input;
    values[input.dataset.formulaVariable]=raw;
  }
  formulaDetailValues={...values};
  const status=document.querySelector("#formula-detail-status");
  if(firstInvalid){
    if(status)status.textContent=translate(locale,firstInvalid.value.trim()===""?"missingValue":"invalidValue");
    firstInvalid.focus();
    return;
  }
  if(status)status.textContent="";
  const substitution=document.querySelector("#formula-detail-substitution");
  const result=document.querySelector("#formula-detail-result");
  const substituted=substituteFormula(detail.expression,values);
  if(substitution)substitution.textContent=`${translate(locale,"substitutedFormula")}: ${substituted}`;
  if(!result)return;
  if(!detail.professional){result.textContent=translate(locale,"referenceSubstitution");return}
  const evaluated=evaluateProfessionalFormula(detail.professional,values);
  if(!evaluated.ok){
    result.textContent=evaluated.code==="MISSING_VALUE"?translate(locale,"missingValue"):translate(locale,"invalidValue");
    return;
  }
  const numeric=new Intl.NumberFormat(locale==="ar"?"ar":"en",{maximumSignificantDigits:12}).format(evaluated.value);
  result.textContent=`${translate(locale,"calculatedResult")}: ${numeric}${detail.professional.unit??""}`;
}
function clearFormulaDetail(){
  formulaDetailValues={};
  renderFormulaDetail();
  document.querySelector("#formula-detail-form [data-formula-variable]")?.focus();
}
async function copyFormulaDetailResult(){
  const substitution=document.querySelector("#formula-detail-substitution")?.textContent?.trim()??"";
  const result=document.querySelector("#formula-detail-result")?.textContent?.trim()??"";
  const status=document.querySelector("#formula-detail-status");
  const text=[substitution,result].filter(Boolean).join("\n");
  if(!text||!navigator.clipboard?.writeText){if(status)status.textContent=translate(locale,"copyUnavailable");return}
  try{
    await navigator.clipboard.writeText(text);
    if(status)status.textContent=translate(locale,"resultCopied");
  }catch{
    if(status)status.textContent=translate(locale,"copyUnavailable");
  }
}
document.querySelector("#formula-detail-form")?.addEventListener("submit",event=>{event.preventDefault();calculateFormulaDetail()});
document.querySelector("#formula-detail-clear")?.addEventListener("click",clearFormulaDetail);
document.querySelector("#formula-detail-copy")?.addEventListener("click",copyFormulaDetailResult);
document.querySelector("#formula-detail-back")?.addEventListener("click",()=>{
  formulaDetailValues={};
  formulaDetailContext=null;
  activateTool(formulaDetailBackTarget);
});

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
  grid.innerHTML=rows.length?rows.map(x=>{
    const title=locale==="ar"?x.titleAr:x.titleEn;
    const secondary=locale==="ar"?x.titleEn:x.titleAr;
    const description=locale==="ar"?x.descriptionAr:x.descriptionEn;
    return `<article class="formula-card"><button type="button" class="formula-open" data-general-formula-id="${escHtml(x.id)}"><div class="formula-card-meta">${escHtml(secondary)}</div><h3>${escHtml(title)}</h3><div class="formula-expression" dir="ltr">${escHtml(x.formula)}</div><p>${escHtml(description)}</p><span class="formula-card-action">${escHtml(translate(locale,"enterValues"))} →</span></button></article>`;
  }).join(""):`<p class="empty-state" role="status">${escHtml(translate(locale,"formulaNoResults"))}</p>`;
  grid.querySelectorAll("[data-general-formula-id]").forEach(button=>button.addEventListener("click",()=>openReferenceFormula(button.dataset.generalFormulaId)));
  if(count)count.textContent=locale==="ar"?`عدد القوانين: ${rows.length}`:`${rows.length} formulas`;
}
document.querySelector("#formula-search")?.addEventListener("input",renderFormulaLibrary);
document.querySelector("#formula-category")?.addEventListener("change",renderFormulaLibrary);
document.querySelector("#knowledge-search")?.addEventListener("input",renderProfessionalLibrary);
renderFormulaCategories();
renderFormulaLibrary();
renderProfessionalLibrary();

const mathLabInput=document.querySelector("#mathlab-input");
const mathLabOutput=document.querySelector("#mathlab-output");
const mathLabWorkspace=document.querySelector("#mathlab-workspace");
const mathLabStatus=document.querySelector("#mathlab-status");
let mathLabWorkspaceState={};

function formatLabValue(value){
  if(!Array.isArray(value))return String(value);
  if(value.every(Array.isArray)){
    return "[\n"+value.map(row=>"  "+row.map(v=>String(v)).join("  ")).join("\n")+"\n]";
  }
  return "["+value.map(v=>typeof v==="object"?JSON.stringify(v):String(v)).join(", ")+"]";
}
function formatMathLabError(error){
  const code=error?.message??"MATHLAB_ERROR";
  const localized=translate(locale,"ml_"+code);
  const message=localized==="ml_"+code?code:localized;
  const line=error?.line?`${translate(locale,"mathLabErrorLine")} ${error.line}: `:"";
  return line+message;
}
function renderMathLabWorkspace(){
  if(!mathLabWorkspace)return;
  const entries=Object.entries(mathLabWorkspaceState);
  mathLabWorkspace.innerHTML=entries.length?entries.map(([name,value])=>`<div class="workspace-row"><strong>${escHtml(name)}</strong><code dir="ltr">${escHtml(formatLabValue(value))}</code></div>`).join(""):`<span class="muted">${escHtml(translate(locale,"noVariables"))}</span>`;
}
function runMathLab(){
  if(!mathLabInput)return;
  const result=runMathLabScript(mathLabInput.value,mathLabWorkspaceState);
  mathLabWorkspaceState={...result.workspace};
  if(mathLabOutput){
    const lines=result.outputs.map(x=>`>> ${x.source}\n${formatLabValue(x.value)}`);
    if(!result.ok){
      const source=result.error?.source?`\n>> ${result.error.source}`:"";
      lines.push(`${formatMathLabError(result.error)}${source}`);
    }
    mathLabOutput.textContent=lines.length?lines.join("\n\n"):">> Ready";
  }
  renderMathLabWorkspace();
  if(mathLabStatus)mathLabStatus.textContent=translate(locale,result.ok?"mathLabRunSuccess":"mathLabRunError");
  return result;
}
document.querySelector("#mathlab-run")?.addEventListener("click",runMathLab);
document.querySelector("#mathlab-clear-workspace")?.addEventListener("click",()=>{
  mathLabWorkspaceState={};
  renderMathLabWorkspace();
  if(mathLabStatus)mathLabStatus.textContent=translate(locale,"workspaceCleared");
});
document.querySelector("#mathlab-clear-output")?.addEventListener("click",()=>{
  if(mathLabOutput)mathLabOutput.textContent=">> Ready";
  if(mathLabStatus)mathLabStatus.textContent=translate(locale,"outputCleared");
});
mathLabInput?.addEventListener("keydown",event=>{
  if((event.ctrlKey||event.metaKey)&&event.key==="Enter"){
    event.preventDefault();
    runMathLab();
  }
});
document.querySelectorAll("[data-mathlab-example]").forEach(button=>button.addEventListener("click",()=>{
  if(!mathLabInput)return;
  mathLabInput.value=button.dataset.mathlabExample??"";
  mathLabInput.focus();
  runMathLab();
}));
renderMathLabWorkspace();

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
const graphMinY=document.querySelector("#graph-min-y");
const graphMaxY=document.querySelector("#graph-max-y");
const graphCanvas=document.querySelector("#graph-canvas");
const graphStatus=document.querySelector("#graph-status");
let graphInitialized=false;
function drawGraph(){
  if(!graphCanvas)return;
  const result=sampleGraphExpressions(graphExpression?.value??"",{minX:Number(graphMinX?.value??-10),maxX:Number(graphMaxX?.value??10),points:601});
  graphCanvas.innerHTML="";
  const legend=document.querySelector("#graph-legend");if(legend)legend.innerHTML="";
  if(!result.ok){if(graphStatus)graphStatus.textContent=translate(locale,result.error);return}
  const width=760,height=420,allSamples=result.series.flatMap(s=>s.samples);
  const yBounds=resolveGraphYBounds(allSamples,{minY:graphMinY?.value??"",maxY:graphMaxY?.value??""});
  if(!yBounds.ok){if(graphStatus)graphStatus.textContent=translate(locale,yBounds.error);return}
  const {minY,maxY}=yBounds;
  const sx=x=>(x-result.minX)/(result.maxX-result.minX)*width;
  const sy=y=>height-(y-minY)/(maxY-minY)*height;
  const makeLine=(x1,y1,x2,y2,klass)=>{
    const el=document.createElementNS("http://www.w3.org/2000/svg","line");
    el.setAttribute("x1",x1);el.setAttribute("y1",y1);el.setAttribute("x2",x2);el.setAttribute("y2",y2);el.setAttribute("class",klass);graphCanvas.appendChild(el);
  };
  const makeText=(x,y,value,anchor="middle")=>{
    const el=document.createElementNS("http://www.w3.org/2000/svg","text");
    el.setAttribute("x",x);el.setAttribute("y",y);el.setAttribute("text-anchor",anchor);el.setAttribute("class","graph-tick-label");el.textContent=Number(value.toPrecision(4));graphCanvas.appendChild(el);
  };
  for(let i=0;i<=4;i++){
    const x=result.minX+(result.maxX-result.minX)*i/4,px=sx(x);
    const y=minY+(maxY-minY)*i/4,py=sy(y);
    makeLine(px,0,px,height,"graph-grid-line");
    makeLine(0,py,width,py,"graph-grid-line");
    makeText(px,height-8,x);
    makeText(6,Math.max(14,Math.min(height-6,py-4)),y,"start");
  }
  if(result.minX<=0&&result.maxX>=0)makeLine(sx(0),0,sx(0),height,"graph-axis");
  if(minY<=0&&maxY>=0)makeLine(0,sy(0),width,sy(0),"graph-axis");
  result.series.forEach((series,index)=>{
    if(!series.result.ok)return;
    let d="",open=false;
    for(const p of series.samples){
      if(p.y===null||!Number.isFinite(p.y)||p.breakBefore){open=false;if(p.y===null||!Number.isFinite(p.y))continue}
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
  if(graphStatus)graphStatus.textContent=`${yBounds.auto?translate(locale,"autoScale")+" · ":""}x: [${result.minX}, ${result.maxX}] · y: [${Number(minY.toPrecision(5))}, ${Number(maxY.toPrecision(5))}]`;
  graphInitialized=true;
}
document.querySelector("#graph-draw")?.addEventListener("click",drawGraph);
document.querySelector("#graph-reset")?.addEventListener("click",()=>{
  if(graphMinX)graphMinX.value="-10";if(graphMaxX)graphMaxX.value="10";
  if(graphMinY)graphMinY.value="";if(graphMaxY)graphMaxY.value="";
  drawGraph();
});
for(const input of [graphMinX,graphMaxX,graphMinY,graphMaxY])input?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();drawGraph()}});
graphExpression?.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){e.preventDefault();drawGraph()}});

const programmerInput=document.querySelector("#programmer-input");
const programmerBase=document.querySelector("#programmer-base");
const programmerB=document.querySelector("#programmer-b");
const programmerOp=document.querySelector("#programmer-op");
const programmerWordSize=document.querySelector("#programmer-word-size");
const programmerSigned=document.querySelector("#programmer-signed");
const programmerResult=document.querySelector("#programmer-result");
function updateProgrammerOperandState(){
  if(!programmerB||!programmerOp)return;
  programmerB.disabled=programmerOp.value==="convert"||programmerOp.value==="not";
  programmerB.setAttribute("aria-disabled",programmerB.disabled?"true":"false");
}
function renderProgrammer(){
  if(!programmerInput||!programmerBase||!programmerOp||!programmerResult)return;
  updateProgrammerOperandState();
  try{
    const base=Number(programmerBase.value),wordSize=Number(programmerWordSize?.value??64),signed=programmerSigned?.value==="signed";
    const a=parseInteger(programmerInput.value,base);
    let value=a;
    if(programmerOp.value!=="convert"){
      const b=programmerOp.value==="not"?0n:parseInteger(programmerB?.value??"0",base);
      value=bitwise(programmerOp.value,a,b,{wordSize,signed});
    }
    const d=describeInteger(value,{wordSize});
    programmerResult.innerHTML=`<div><span>BIN</span><code>${escHtml(d.bin)}</code></div><div><span>OCT</span><code>${escHtml(d.oct)}</code></div><div><span>${escHtml(translate(locale,"signedDecLabel"))}</span><code>${escHtml(d.signedDec)}</code></div><div><span>${escHtml(translate(locale,"unsignedDecLabel"))}</span><code>${escHtml(d.unsignedDec)}</code></div><div><span>HEX</span><code>${escHtml(d.hex)}</code></div>`;
  }catch(error){programmerResult.textContent=translate(locale,error.message)}
}
document.querySelector("#programmer-run")?.addEventListener("click",renderProgrammer);
programmerInput?.addEventListener("input",renderProgrammer);programmerB?.addEventListener("input",renderProgrammer);programmerBase?.addEventListener("change",renderProgrammer);programmerOp?.addEventListener("change",renderProgrammer);programmerWordSize?.addEventListener("change",renderProgrammer);programmerSigned?.addEventListener("change",renderProgrammer);
renderProgrammer();

const dateStart=document.querySelector("#date-start");
const dateEnd=document.querySelector("#date-end");
const dateDifference=document.querySelector("#date-difference");
const dateBase=document.querySelector("#date-base");
const dateOffset=document.querySelector("#date-offset");
const dateUnit=document.querySelector("#date-unit");
const dateOffsetResult=document.querySelector("#date-offset-result");
const dateDifferenceDetailsEl=document.querySelector("#date-difference-details");
const dateResultWeekday=document.querySelector("#date-result-weekday");
function formatIsoWeekday(iso){
  const dt=new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat(locale==="ar"?"ar-SA":"en-US",{weekday:"long",timeZone:"UTC"}).format(dt);
}
function updateDateCalculator(){
  try{
    if(dateStart&&dateEnd&&dateDifference){
      const details=dateDifferenceDetails(dateStart.value,dateEnd.value);
      dateDifference.textContent=locale==="ar"?`${details.signedDays} يومًا`:`${details.signedDays} day${Math.abs(details.signedDays)===1?"":"s"}`;
      if(dateDifferenceDetailsEl){
        dateDifferenceDetailsEl.innerHTML=`<div><span>${escHtml(translate(locale,"absoluteDays"))}</span><strong>${details.absoluteDays}</strong></div><div><span>${escHtml(translate(locale,"inclusiveDays"))}</span><strong>${details.inclusiveDays}</strong></div><div><span>${escHtml(translate(locale,"weeksAndDays"))}</span><strong>${details.weeks} + ${details.remainingDays}</strong></div><div><span>${escHtml(translate(locale,"direction"))}</span><strong>${escHtml(translate(locale,details.signedDays<0?"backward":"forward"))}</strong></div>`;
      }
    }
  }catch(error){
    if(dateDifference)dateDifference.textContent=translate(locale,error.message);
    if(dateDifferenceDetailsEl)dateDifferenceDetailsEl.innerHTML="";
  }
  try{
    if(dateBase&&dateOffset&&dateOffsetResult){
      const result=addDateUnits(dateBase.value,Number(dateOffset.value),dateUnit?.value??"days");
      dateOffsetResult.textContent=result;
      if(dateResultWeekday)dateResultWeekday.textContent=`${translate(locale,"weekday")}: ${formatIsoWeekday(result)}`;
    }
  }catch(error){
    if(dateOffsetResult)dateOffsetResult.textContent=translate(locale,error.message);
    if(dateResultWeekday)dateResultWeekday.textContent="";
  }
}
for(const el of [dateStart,dateEnd,dateBase,dateOffset,dateUnit])el?.addEventListener("input",updateDateCalculator);
document.querySelector("#date-swap")?.addEventListener("click",()=>{if(!dateStart||!dateEnd)return;const v=dateStart.value;dateStart.value=dateEnd.value;dateEnd.value=v;updateDateCalculator()});
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

const CONSENT_KEY="math.analytics-consent";
function enableAnalytics(){
  initGoogleAnalytics(SITE_CONFIG.analytics);
}
function setupConsent(){
  initAdSense(SITE_CONFIG.adsense);
  const banner=document.querySelector("#consent-banner");if(!banner)return;
  if(!SITE_CONFIG.analytics.measurementId)return;
  let choice=null;try{choice=localStorage.getItem(CONSENT_KEY)}catch{}
  if(choice==="accepted"){enableAnalytics();return}
  if(choice==="rejected")return;
  banner.hidden=false;
  document.querySelector("#consent-accept")?.addEventListener("click",()=>{try{localStorage.setItem(CONSENT_KEY,"accepted")}catch{};banner.hidden=true;enableAnalytics()});
  document.querySelector("#consent-reject")?.addEventListener("click",()=>{try{localStorage.setItem(CONSENT_KEY,"rejected")}catch{};banner.hidden=true});
}
setupConsent();

if(!restoreFormulaHashRoute()){
  const initialTool=decodeURIComponent(window.location.hash.slice(1));
  if(toolTargets.has(initialTool))activateTool(initialTool,{updateHash:false,track:false});
  else activateTool("calculator",{updateHash:false,track:false});
}
