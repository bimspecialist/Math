import { evaluateExpression } from "../calculator/math-engine.js";

const RESERVED=new Set(["sin","cos","tan","sqrt","abs","log","ln","exp","det","root","ncr","npr","pi","π","e"]);

export function inferReferenceVariables(formulaText=""){
  const text=String(formulaText);
  const [left="",...rest]=text.split("=");
  const right=rest.join("=")||left;
  const target=/^\s*([A-Za-z][A-Za-z0-9_]*|[Δσμθρλ])\s*$/.exec(left)?.[1]??null;
  const tokens=[...right.matchAll(/[A-Za-z][A-Za-z0-9_]*|[Δσμθρλπ]/g)].map(m=>m[0]);
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
    const pattern=/^[A-Za-z][A-Za-z0-9_]*$/.test(key)?"\\b"+escapeRegExp(key)+"\\b":escapeRegExp(key);
    result=result.replace(new RegExp(pattern,"g"),"("+safe+")");
  }
  return result;
}

function validateVariable(variable,numeric){
  if(variable?.integer&&!Number.isInteger(numeric))return"INTEGER_REQUIRED";
  if(variable?.nonZero&&numeric===0)return"DIVISION_BY_ZERO";
  if(variable?.min!==undefined&&numeric<Number(variable.min))return"VALUE_BELOW_MINIMUM";
  if(variable?.exclusiveMin!==undefined&&numeric<=Number(variable.exclusiveMin))return"VALUE_BELOW_MINIMUM";
  if(variable?.max!==undefined&&numeric>Number(variable.max))return"VALUE_ABOVE_MAXIMUM";
  if(variable?.notEqual!==undefined&&numeric===Number(variable.notEqual))return"INVALID_VALUE";
  if(variable?.absLessThan!==undefined&&Math.abs(numeric)>=Number(variable.absLessThan))return"OUTSIDE_FORMULA_DOMAIN";
  return null;
}

export function evaluateFormulaDefinition(definition,values={}){
  if(!definition?.calcExpression)return{ok:false,code:"REFERENCE_ONLY"};
  let expression=definition.calcExpression;
  const normalized={};
  for(const variable of definition.variables??[]){
    const raw=String(values[variable.id]??"").trim();
    if(!raw)return{ok:false,code:"MISSING_VALUE",variable:variable.id};
    const numeric=Number(raw);
    if(!Number.isFinite(numeric))return{ok:false,code:"INVALID_VALUE",variable:variable.id};
    const validation=validateVariable(variable,numeric);
    if(validation)return{ok:false,code:validation,variable:variable.id};
    normalized[variable.id]=numeric;
    expression=expression.replace(new RegExp("\\b"+escapeRegExp(variable.id)+"\\b","g"),"("+numeric+")");
  }
  const result=evaluateExpression(expression,{angleMode:"DEG"});
  if(result.kind!=="value")return{ok:false,code:result.code??"INVALID_EXPRESSION"};
  return{ok:true,value:result.numeric,exact:result.exact,expression,values:normalized,unit:definition.unit??""};
}

export function evaluateProfessionalFormula(formula,values={}){
  return evaluateFormulaDefinition(formula,values);
}

function escapeRegExp(value){return String(value).replace(/[.*+?^\$\{\}()|[\]\\]/g,"\\$&")}
