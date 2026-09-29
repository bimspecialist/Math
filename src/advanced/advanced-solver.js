import { evaluateExpression } from "../calculator/math-engine.js";

const normalize=s=>String(s??"").trim().replaceAll("×","*").replaceAll("÷","/").replaceAll("−","-");
const variableList=s=>[...new Set((normalize(s).match(/\b[x-zX-Z]\b/g)||[]).map(v=>v.toLowerCase()))].sort();

function evaluateWith(source,variable,value){
  const re=new RegExp("\\b"+variable+"\\b","gi");
  return evaluateExpression(source.replace(re,`(${value})`),{angleMode:"DEG",ans:"0"});
}

function solveEquation(left,right,variable){
  const f=x=>{
    const a=evaluateWith(left,variable,x),b=evaluateWith(right,variable,x);
    if(a.kind!=="value"||b.kind!=="value")return NaN;
    return a.numeric-b.numeric;
  };
  const starts=[0,1,-1,2,-2,5,-5,10,-10,100,-100];
  for(const start of starts){
    let x=start;
    for(let i=0;i<80;i++){
      const y=f(x);
      if(!Number.isFinite(y))break;
      if(Math.abs(y)<1e-10)return x;
      const h=1e-6*Math.max(1,Math.abs(x));
      const yp=f(x+h),ym=f(x-h);
      if(!Number.isFinite(yp)||!Number.isFinite(ym))break;
      const d=(yp-ym)/(2*h);
      if(!Number.isFinite(d)||Math.abs(d)<1e-12)break;
      const next=x-y/d;
      if(!Number.isFinite(next))break;
      if(Math.abs(next-x)<1e-12){x=next;break}
      x=next;
    }
    const residual=f(x);
    if(Number.isFinite(residual)&&Math.abs(residual)<1e-8)return x;
  }
  return null;
}

export function solveAdvancedInput(source){
  source=normalize(source);
  if(!source)return{kind:"error",code:"EMPTY_INPUT"};
  const vars=variableList(source);
  if(vars.length>1)return{kind:"error",code:"MULTIPLE_VARIABLES",variables:vars};

  const eq=source.indexOf("=");
  if(eq<0){
    if(vars.length)return{kind:"error",code:"VARIABLE_REQUIRES_EQUATION",variables:vars};
    return evaluateExpression(source,{angleMode:"DEG",ans:"0"});
  }
  if(source.indexOf("=",eq+1)>=0)return{kind:"error",code:"INVALID_EQUATION"};

  const left=source.slice(0,eq).trim(),right=source.slice(eq+1).trim();
  if(!left||!right)return{kind:"error",code:"INVALID_EQUATION"};

  if(vars.length===0){
    const a=evaluateExpression(left,{angleMode:"DEG",ans:"0"}),b=evaluateExpression(right,{angleMode:"DEG",ans:"0"});
    if(a.kind!=="value"||b.kind!=="value")return{kind:"error",code:"INVALID_EXPRESSION"};
    return{kind:"equation-check",equal:Math.abs(a.numeric-b.numeric)<1e-12,left:a.numeric,right:b.numeric};
  }

  const variable=vars[0],value=solveEquation(left,right,variable);
  if(value===null)return{kind:"error",code:"NO_NUMERIC_SOLUTION",variables:[variable]};
  return{kind:"solution",variable,value:Number(value.toPrecision(14))};
}
