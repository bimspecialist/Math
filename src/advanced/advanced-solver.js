import { evaluateExpression } from "../calculator/math-engine.js";

const EPS=1e-9;
const normalize=s=>String(s??"")
  .replaceAll("×","*").replaceAll("÷","/").replaceAll("−","-")
  .replaceAll("²","^2").replaceAll("³","^3").trim();

const clean=n=>Math.abs(n)<EPS?0:Number(n.toPrecision(14));
const variableList=s=>{
  const out=[];
  for(const m of normalize(s).matchAll(/\b[A-Za-z]\b/g)){
    const v=m[0];
    if(v==="e")continue;
    if(!out.includes(v))out.push(v);
  }
  return out;
};

function substitute(source,variables,values){
  let out=source;
  for(let i=0;i<variables.length;i++){
    const re=new RegExp("\\b"+variables[i]+"\\b","g");
    out=out.replace(re,`(${values[i]})`);
  }
  return out;
}

function evalNumeric(source,variables=[],values=[]){
  return evaluateExpression(substitute(source,variables,values),{angleMode:"DEG",ans:"0"});
}

function differenceFunction(left,right,variables){
  return values=>{
    const a=evalNumeric(left,variables,values),b=evalNumeric(right,variables,values);
    if(a.kind!=="value"||b.kind!=="value")return NaN;
    return a.numeric-b.numeric;
  };
}

function inferQuadratic(f){
  const c=f(0),p=f(1),m=f(-1);
  if(![c,p,m].every(Number.isFinite))return null;
  const a=(p+m)/2-c,b=(p-m)/2;
  for(const x of [2,-2,3]){
    const expected=a*x*x+b*x+c,actual=f(x);
    if(!Number.isFinite(actual)||Math.abs(actual-expected)>1e-7*Math.max(1,Math.abs(actual)))return null;
  }
  return{a:clean(a),b:clean(b),c:clean(c)};
}

function quadraticRoots({a,b,c}){
  if(Math.abs(a)<EPS){
    if(Math.abs(b)<EPS)return Math.abs(c)<EPS?{all:true}: {none:true};
    return{roots:[clean(-c/b)],degree:1};
  }
  const d=b*b-4*a*c;
  if(Math.abs(d)<EPS)return{roots:[clean(-b/(2*a))],degree:2};
  if(d>0){
    const s=Math.sqrt(d),r1=clean((-b-s)/(2*a)),r2=clean((-b+s)/(2*a));
    return{roots:[r1,r2].sort((x,y)=>x-y),degree:2};
  }
  const re=clean(-b/(2*a)),im=clean(Math.sqrt(-d)/(2*Math.abs(a)));
  const imag=im===1?"i":`${im}i`;
  if(re===0)return{roots:[`-${imag}`,imag],degree:2,complex:true};
  return{roots:[`${re}-${imag}`,`${re}+${imag}`],degree:2,complex:true};
}

function solveSingleEquation(left,right,variable){
  const f=differenceFunction(left,right,[variable]);
  const poly=inferQuadratic(x=>f([x]));
  if(poly){
    const solved=quadraticRoots(poly);
    if(solved.all)return{kind:"identity",variables:[variable]};
    if(solved.none)return{kind:"error",code:"NO_SOLUTION",variables:[variable]};
    return{kind:"solution-set",variable,solutions:solved.roots,degree:solved.degree,complex:Boolean(solved.complex)};
  }
  return{kind:"error",code:"NON_POLYNOMIAL_SOLVER_PENDING",variables:[variable]};
}

function inferLinearEquation(left,right,variables){
  const f=differenceFunction(left,right,variables);
  const zeros=variables.map(()=>0),c=f(zeros);
  if(!Number.isFinite(c))return null;
  const coeffs=variables.map((_,i)=>{
    const v=zeros.slice();v[i]=1;
    return f(v)-c;
  });
  const probes=[
    variables.map((_,i)=>i+2),
    variables.map((_,i)=>i%2?-.75:1.5)
  ];
  for(const v of probes){
    const actual=f(v);
    const expected=c+coeffs.reduce((s,a,i)=>s+a*v[i],0);
    if(!Number.isFinite(actual)||Math.abs(actual-expected)>1e-7*Math.max(1,Math.abs(actual)))return null;
  }
  return{coeffs:coeffs.map(clean),rhs:clean(-c)};
}

function rref(matrix,varCount){
  const a=matrix.map(r=>r.slice());
  let row=0;
  const pivots=[];
  for(let col=0;col<varCount&&row<a.length;col++){
    let p=row;
    for(let r=row+1;r<a.length;r++)if(Math.abs(a[r][col])>Math.abs(a[p][col]))p=r;
    if(Math.abs(a[p][col])<EPS)continue;
    [a[row],a[p]]=[a[p],a[row]];
    const div=a[row][col];for(let j=col;j<=varCount;j++)a[row][j]/=div;
    for(let r=0;r<a.length;r++){
      if(r===row)continue;
      const factor=a[r][col];if(Math.abs(factor)<EPS)continue;
      for(let j=col;j<=varCount;j++)a[r][j]-=factor*a[row][j];
    }
    pivots.push({row,col});row++;
  }
  for(const r of a){
    const zero=r.slice(0,varCount).every(v=>Math.abs(v)<EPS);
    if(zero&&Math.abs(r[varCount])>=EPS)return{kind:"inconsistent"};
  }
  return{kind:"ok",matrix:a,pivots};
}

const fmt=n=>{
  n=clean(n);
  if(Number.isInteger(n))return String(n);
  return String(n);
};

function parametricFromRref(rr,variables){
  const pivotCols=new Set(rr.pivots.map(p=>p.col));
  const freeCols=variables.map((_,i)=>i).filter(i=>!pivotCols.has(i));
  const expressions={};
  for(const {row,col} of rr.pivots){
    let s=fmt(rr.matrix[row][variables.length]);
    for(const j of freeCols){
      const coeff=clean(-rr.matrix[row][j]);
      if(Math.abs(coeff)<EPS)continue;
      const sign=coeff>=0?" + ":" - ",mag=Math.abs(coeff);
      s+=sign+(Math.abs(mag-1)<EPS?"":fmt(mag)+"*")+variables[j];
    }
    expressions[variables[col]]=s;
  }
  for(const j of freeCols)expressions[variables[j]]=variables[j];
  return{
    kind:"parametric-system",
    variables,
    freeVariables:freeCols.map(i=>variables[i]),
    expressions
  };
}

function solveLinearSystem(equations,variables){
  const rows=[];
  for(const {left,right} of equations){
    const lin=inferLinearEquation(left,right,variables);
    if(!lin)return null;
    rows.push([...lin.coeffs,lin.rhs]);
  }
  const rr=rref(rows,variables.length);
  if(rr.kind==="inconsistent")return{kind:"error",code:"NO_SOLUTION",variables};
  if(rr.pivots.length===variables.length){
    const values={};
    for(const {row,col} of rr.pivots)values[variables[col]]=clean(rr.matrix[row][variables.length]);
    return{kind:"system-solution",variables,values};
  }
  return parametricFromRref(rr,variables);
}

function parseEquations(source){
  const lines=source.split(/[\n;]/).map(s=>s.trim()).filter(Boolean);
  if(!lines.length)return[];
  return lines.map(line=>{
    const parts=line.split("=");
    if(parts.length!==2||!parts[0].trim()||!parts[1].trim())return null;
    return{left:parts[0].trim(),right:parts[1].trim()};
  });
}

export function solveAdvancedInput(source){
  source=normalize(source);
  if(!source)return{kind:"error",code:"EMPTY_INPUT"};
  const vars=variableList(source);
  const hasEquals=source.includes("=");

  if(!hasEquals){
    if(vars.length===0)return evaluateExpression(source,{angleMode:"DEG",ans:"0"});
    if(vars.length===1){
      const variable=vars[0],poly=inferQuadratic(x=>{
        const r=evalNumeric(source,[variable],[x]);return r.kind==="value"?r.numeric:NaN;
      });
      if(!poly)return{kind:"error",code:"SYMBOLIC_ANALYSIS_PENDING",variables:vars};
      const solved=quadraticRoots(poly);
      return{
        kind:"expression-analysis",expression:source,variable,degree:solved.degree??0,
        coefficients:poly,roots:solved.roots??[],complex:Boolean(solved.complex)
      };
    }
    return{kind:"error",code:"SYMBOLIC_ANALYSIS_PENDING",variables:vars};
  }

  const equations=parseEquations(source);
  if(!equations.length||equations.some(x=>!x))return{kind:"error",code:"INVALID_EQUATION"};

  if(vars.length===0){
    if(equations.length!==1)return{kind:"error",code:"INVALID_EQUATION"};
    const a=evaluateExpression(equations[0].left,{angleMode:"DEG",ans:"0"});
    const b=evaluateExpression(equations[0].right,{angleMode:"DEG",ans:"0"});
    if(a.kind!=="value"||b.kind!=="value")return{kind:"error",code:"INVALID_EXPRESSION"};
    return{kind:"equation-check",equal:Math.abs(a.numeric-b.numeric)<EPS,left:a.numeric,right:b.numeric};
  }

  if(equations.length===1&&vars.length===1)return solveSingleEquation(equations[0].left,equations[0].right,vars[0]);

  const linear=solveLinearSystem(equations,vars);
  if(linear)return linear;
  return{kind:"error",code:"NONLINEAR_SYSTEM_NOT_YET_SUPPORTED",variables:vars};
}
