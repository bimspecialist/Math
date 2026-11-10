/* Featured calculator uses the existing mathematical engine. No network or storage. */
import {evaluateExpression} from "../calculator/math-engine.js";
import {UI_STRINGS} from "../i18n/ui-strings.js";

const expression=document.getElementById("workbench-expression");
const output=document.getElementById("workbench-result");
const keys=document.getElementById("workbench-keys");
const history=document.getElementById("workbench-history");
const modeButtons=[...document.querySelectorAll("[data-workbench-angle]")];
let angleMode="DEG",lastAnswer="0";

const formatNumber=value=>{
  if(!Number.isFinite(value))return String(value);
  return Number(value.toPrecision(12)).toString();
};

function evaluate({storeHistory=true}={}){
  if(!expression||!output)return;
  const query=expression.value.trim();
  const lang=document.documentElement.lang==="ar"?"ar":"en";
  if(!query){
    output.textContent=UI_STRINGS[lang].INVALID_EXPRESSION;
    output.dataset.kind="error";
    expression.setAttribute("aria-invalid","true");
    return;
  }
  const result=evaluateExpression(query,{angleMode,ans:lastAnswer});
  if(result.kind==="value"){
    const number=formatNumber(result.numeric);
    output.textContent=number;
    output.dataset.kind="value";
    expression.removeAttribute("aria-invalid");
    lastAnswer=number;
    if(storeHistory&&history){
      const row=document.createElement("li");
      const label=document.createElement("span");
      const value=document.createElement("strong");
      label.textContent=query;
      value.textContent=number;
      row.append(label,value);
      history.prepend(row);
      while(history.children.length>3)history.lastElementChild.remove();
    }
  }else{
    output.textContent=UI_STRINGS[lang][result.code]||UI_STRINGS[lang].INVALID_EXPRESSION;
    output.dataset.kind="error";
    expression.setAttribute("aria-invalid","true");
  }
}
function insert(text){
  const start=expression.selectionStart??expression.value.length;
  const end=expression.selectionEnd??expression.value.length;
  expression.setRangeText(text,start,end,"end");
  expression.focus();
}
function backspace(){
  const start=expression.selectionStart??expression.value.length;
  const end=expression.selectionEnd??expression.value.length;
  if(start!==end)expression.setRangeText("",start,end,"end");
  else if(start>0)expression.setRangeText("",start-1,start,"end");
  expression.focus();
}
function clear(){
  expression.value="";expression.removeAttribute("aria-invalid");
  output.textContent="—";output.dataset.kind="empty";expression.focus();
}
if(expression&&output&&keys){
  keys.addEventListener("click",event=>{
    const key=event.target.closest("button");
    if(!key||!keys.contains(key))return;
    const command=key.dataset.workbenchCommand;
    if(command==="evaluate")evaluate();
    else if(command==="clear")clear();
    else if(command==="backspace")backspace();
    else if(key.hasAttribute("data-workbench-insert"))insert(key.dataset.workbenchInsert);
  });
  expression.addEventListener("keydown",event=>{
    if(event.isComposing)return;
    if(event.key==="Enter"){event.preventDefault();evaluate()}
    else if(event.key==="Escape"){event.preventDefault();clear()}
  });
  expression.addEventListener("input",()=>{
    expression.removeAttribute("aria-invalid");
  });
  modeButtons.forEach(button=>button.addEventListener("click",()=>{
    angleMode=button.dataset.workbenchAngle;
    modeButtons.forEach(item=>item.setAttribute("aria-pressed",String(item===button)));
    evaluate({storeHistory:false});
    expression.focus();
  }));
  evaluate({storeHistory:false});
}
