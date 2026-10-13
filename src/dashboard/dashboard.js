import { calculateRamp } from "../construction/ramp-calculator.js";
import { convertUnit, formatConversionValue } from "../converters/unit-converter.js";
import { evaluateExpression } from "../calculator/math-engine.js";
import { rampSvgMarkup } from "./ramp-diagram.js";

const get=id=>document.getElementById(id);
const numberText=value=>{
  if(!Number.isFinite(value))return "—";
  return Number(value.toPrecision(9)).toString();
};
const inputEnter=(id,callback)=>get(id)?.addEventListener("keydown",event=>{
  if(event.key==="Enter"&&!event.isComposing){event.preventDefault();callback()}
});

export function mountDashboard({getLocale,translate,ensureAdvancedTools,onSearch}){
  const rise=get("home-ramp-rise"),run=get("home-ramp-run"),unit=get("home-ramp-unit");
  if(!rise||!run||!unit)return{refreshLocale:()=>{},refreshRamp:()=>{}};
  const length=get("home-ramp-length"),visual=get("home-ramp-visual"),grade=get("home-ramp-grade"),
        angle=get("home-ramp-angle"),ratio=get("home-ramp-ratio"),message=get("home-ramp-message");
  let lastRamp=null,previousUnit="m",lastSci=null,hasSolverResult=false;

  function renderRamp(){
    try{
      const result=calculateRamp({rise:rise.value,run:run.value});
      lastRamp=result;
      length.value=numberText(result.length);
      grade.textContent=numberText(result.gradePercent)+"%";
      angle.textContent=numberText(result.angleDeg)+"°";
      ratio.textContent=result.ratioText;
      visual.innerHTML=rampSvgMarkup(result,{unit:unit.value,locale:getLocale()});
      message.textContent="";
      message.removeAttribute("data-error");
      [rise,run].forEach(el=>el.removeAttribute("aria-invalid"));
    }catch(error){
      lastRamp=null;
      length.value="";
      visual.replaceChildren();
      grade.textContent="—";angle.textContent="—";ratio.textContent="—";
      message.textContent=translate(getLocale(),error.message)||error.message;
      message.dataset.error="true";
      for(const el of [rise,run])el.setAttribute("aria-invalid",String(!el.value.trim()||!(Number(el.value)>0)));
    }
    return lastRamp;
  }
  for(const el of [rise,run])el.addEventListener("input",renderRamp);
  get("home-ramp-calculate")?.addEventListener("click",renderRamp);
  for(const id of ["home-ramp-rise","home-ramp-run"])inputEnter(id,renderRamp);
  unit.addEventListener("change",()=>{
    const next=unit.value;
    try{
      const factor=convertUnit("length",1,previousUnit,next);
      for(const el of [rise,run]){
        if(!el.value.trim()||!Number.isFinite(Number(el.value)))continue;
        el.value=numberText(Number(el.value)*factor);
      }
    }catch{/* Invalid user entry stays visible for correction. */}
    previousUnit=next;
    renderRamp();
  });
  get("home-ramp-reset")?.addEventListener("click",()=>{
    rise.value="0.75";run.value="3";unit.value="m";previousUnit="m";renderRamp();
  });

  const sciInput=get("home-sci-expression"),sciResult=get("home-sci-result");
  function runScience(){
    const result=evaluateExpression(sciInput.value,{angleMode:"DEG",ans:"0"});
    lastSci=result;
    sciResult.textContent=result.kind==="value"?formatConversionValue(result.numeric):
      translate(getLocale(),result.code||"INVALID_EXPRESSION");
    sciResult.dataset.kind=result.kind;
  }
  get("home-sci-run")?.addEventListener("click",runScience);
  inputEnter("home-sci-expression",runScience);
  const convInput=get("home-convert-value"),from=get("home-convert-from"),to=get("home-convert-to"),converted=get("home-convert-result");
  function runConversion(){
    try{
      const result=convertUnit("length",convInput.value,from.value,to.value);
      converted.textContent=formatConversionValue(result);
      converted.dataset.kind="value";
    }catch(error){
      converted.textContent=translate(getLocale(),error.message)||error.message;
      converted.dataset.kind="error";
    }
  }
  for(const el of [convInput,from,to])el?.addEventListener("input",runConversion);
  get("home-convert-swap")?.addEventListener("click",()=>{
    const before=from.value;from.value=to.value;to.value=before;runConversion();
  });
  inputEnter("home-convert-value",runConversion);

  const solveInput=get("home-solver-equation"),solveResult=get("home-solver-result"),solveButton=get("home-solver-run");
  async function runSolver(){
    if(solveButton.disabled)return;
    solveButton.disabled=true;
    solveResult.textContent=translate(getLocale(),"dashboardWorking");
    try{
      const {solveAdvancedInput,formatAdvancedResult}=await ensureAdvancedTools();
      const solved=solveAdvancedInput(solveInput.value,{angleMode:"RAD"});
      hasSolverResult=true;
      solveResult.textContent=formatAdvancedResult(solved,getLocale());
      solveResult.dataset.kind=solved.kind;
    }catch{
      solveResult.textContent=translate(getLocale(),"SOLVE_ERROR");
    }finally{solveButton.disabled=false}
  }
  solveButton?.addEventListener("click",runSolver);
  inputEnter("home-solver-equation",runSolver);

  const search=get("dashboard-search"),noResults=get("dashboard-search-empty"),
    searchCount=get("dashboard-search-count");
  const cards=[...document.querySelectorAll("#home-tool-grid .mw-tool-card")];
  function filterCards(){
    const query=(search?.value??"").trim().toLocaleLowerCase(getLocale()==="ar"?"ar":"en");
    let visible=0;
    for(const card of cards){
      const haystack=((card.textContent??"")+" "+(card.dataset.search??"")).toLocaleLowerCase(getLocale()==="ar"?"ar":"en");
      const show=!query||haystack.includes(query);
      card.hidden=!show;
      if(show)visible++;
    }
    if(noResults)noResults.hidden=visible!==0;
    if(searchCount)searchCount.textContent=query?translate(getLocale(),"dashboardSearchMatches")+": "+visible:"";
  }
  search?.addEventListener("input",()=>{
    onSearch?.();
    filterCards();
  });
  search?.addEventListener("keydown",event=>{
    if(event.key==="Escape"){
      search.value="";filterCards();search.blur();
    }else if(event.key==="Enter"){
      const first=cards.find(card=>!card.hidden)?.querySelector("[data-tool-target]");
      if(first){event.preventDefault();first.click()}
    }
  });

  runScience();
  runConversion();
  renderRamp();
  function refreshLocale(){
    renderRamp();
    if(lastSci&&sciResult&&lastSci.kind!=="value")sciResult.textContent=translate(getLocale(),lastSci.code||"INVALID_EXPRESSION");
    if(hasSolverResult)solveResult.textContent=translate(getLocale(),"dashboardSolveAgain");
    runConversion();
    filterCards();
  }
  return{refreshLocale,refreshRamp:renderRamp};
}
