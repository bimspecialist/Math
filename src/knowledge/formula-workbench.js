import { evaluateExpression } from "../calculator/math-engine.js";

const RESERVED=new Set(["sin","cos","tan","sqrt","abs","log","ln","exp","det","root","ncr","npr","pi","e"]);

export function inferReferenceVariables(formulaText=""){
  const text=String(formulaText);
  const [left="",...rest]=text.split("=");
  const right=rest.join("=")||left;
  const target=/^\s*([A-Za-z][A-Za-z0-9_]*)\s*$/.exec(left)?.[1]??null;
  const tokens=[...right.matchAll(/[A-Za-z][A-Za-z0-9_]*/g)].map(m=>m[0]);
  const vars=[];
  for(const token of tokens){
    const lower=token.toLowerCase();
    if(RESERVED.has(lower)||token===target)continue;
    if(!vars.includes(token))vars.push(token);
  }
  return vars.slice(0,8);
}

export function substituteFormula(formulaText,values={}){
  let result=String(formulaText??"");
  const entries=Object.entries(values)
    .filter(([,value])=>String(value).trim()!=="")
    .sort(([a],[b])=>b.length-a.length);
  for(const [key,value] of entries){
    const safe=String(value).trim();
    result=result.replace(new RegExp("\\b"+escapeRegExp(key)+"\\b","g"),"("+safe+")");
  }
  return result;
}

export function evaluateProfessionalFormula(formula,values={}){
  if(!formula?.calcExpression)return{ok:false,code:"REFERENCE_ONLY"};
  let expression=formula.calcExpression;
  for(const variable of formula.variables??[]){
    const raw=String(values[variable.id]??"").trim();
    if(!raw)return{ok:false,code:"MISSING_VALUE",variable:variable.id};
    const numeric=Number(raw);
    if(!Number.isFinite(numeric))return{ok:false,code:"INVALID_VALUE",variable:variable.id};
    expression=expression.replace(new RegExp("\\b"+escapeRegExp(variable.id)+"\\b","g"),"("+numeric+")");
  }
  const result=evaluateExpression(expression,{angleMode:"DEG"});
  if(result.kind!=="value")return{ok:false,code:result.code??"INVALID_EXPRESSION"};
  return{ok:true,value:result.numeric,exact:result.exact,expression};
}

function escapeRegExp(value){return String(value).replace(/[.*+?^\$\{\}()|[\]\\]/g,"\\$&")}
