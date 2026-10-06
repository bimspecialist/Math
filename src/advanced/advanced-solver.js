import { evaluateExpression } from "../calculator/math-engine.js";
import { runPolynomialCalculus, parsePolynomial, formatPolynomial } from "./polynomial-calculus.js";

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

function evalNumeric(source,variables=[],values=[],angleMode="DEG"){
  return evaluateExpression(substitute(source,variables,values),{angleMode,ans:"0"});
}

function differenceFunction(left,right,variables,angleMode="RAD"){
  return values=>{
    const a=evalNumeric(left,variables,values,angleMode),b=evalNumeric(right,variables,values,angleMode);
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

function polynomialDifference(left,right,variable){
  try{
    const a=parsePolynomial(left,variable),b=parsePolynomial(right,variable),out=new Map(a);
    for(const [e,v] of b)out.set(e,(out.get(e)??0)-v);
    for(const [e,v] of [...out])if(Math.abs(v)<1e-12)out.delete(e);
    return out;
  }catch{return null}
}
const cx=(re=0,im=0)=>({re,im});
const cxSub=(a,b)=>cx(a.re-b.re,a.im-b.im);
const cxMul=(a,b)=>cx(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
function cxDiv(a,b){
  const d=b.re*b.re+b.im*b.im;
  if(d<1e-30)return null;
  return cx((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d);
}
const cxAbs=z=>Math.hypot(z.re,z.im);
function evalPolynomialComplex(coeffs,z){
  let out=cx(coeffs[0],0);
  for(let i=1;i<coeffs.length;i++)out=cxSub(cxMul(out,z),cx(-coeffs[i],0));
  return out;
}
function formatComplexRoot(z){
  const re=Math.abs(z.re)<1e-9?0:Number(z.re.toPrecision(12));
  const im=Math.abs(z.im)<1e-9?0:Number(z.im.toPrecision(12));
  if(im===0)return re;
  const mag=Math.abs(im)===1?"i":`${Math.abs(im)}i`;
  if(re===0)return im<0?"-"+mag:mag;
  return `${re}${im<0?"-":"+"}${mag}`;
}
function solveParsedPolynomial(poly){
  if(!poly)return null;
  const degree=Math.max(0,...poly.keys());
  if(degree===0){
    const c=poly.get(0)??0;
    return Math.abs(c)<EPS?{all:true}:{none:true};
  }
  if(degree>8)return null;
  const coeffs=Array.from({length:degree+1},(_,i)=>poly.get(degree-i)??0);
  const lead=coeffs[0];
  if(Math.abs(lead)<EPS)return null;
  for(let i=0;i<coeffs.length;i++)coeffs[i]/=lead;
  if(degree===1)return{roots:[clean(-coeffs[1])],degree:1};
  if(degree===2)return quadraticRoots({a:1,b:coeffs[1],c:coeffs[2]});
  const radius=1+Math.max(...coeffs.slice(1).map(Math.abs));
  let roots=Array.from({length:degree},(_,k)=>{
    const theta=2*Math.PI*(k+.35)/degree;
    return cx(radius*Math.cos(theta),radius*Math.sin(theta));
  });
  for(let iter=0;iter<600;iter++){
    let maxDelta=0;
    const next=roots.map((root,i)=>{
      let denom=cx(1,0);
      for(let j=0;j<roots.length;j++)if(i!==j)denom=cxMul(denom,cxSub(root,roots[j]));
      if(cxAbs(denom)<1e-18)denom=cxMul(denom,cx(1,1e-6));
      const delta=cxDiv(evalPolynomialComplex(coeffs,root),denom);
      if(!delta)return root;
      maxDelta=Math.max(maxDelta,cxAbs(delta));
      return cxSub(root,delta);
    });
    roots=next;
    if(maxDelta<1e-12)break;
  }
  const scale=1+coeffs.reduce((s,v)=>s+Math.abs(v),0);
  if(roots.some(z=>cxAbs(evalPolynomialComplex(coeffs,z))>1e-6*scale))return null;
  roots=roots.map(z=>({re:Math.abs(z.re)<1e-9?0:z.re,im:Math.abs(z.im)<1e-9?0:z.im}))
    .sort((a,b)=>Math.abs(a.im)-Math.abs(b.im)||a.re-b.re||a.im-b.im);
  return{roots:roots.map(formatComplexRoot),degree,complex:roots.some(z=>z.im!==0)};
}

function solveSingleEquation(left,right,variable,angleMode="RAD"){
  const parsed=solveParsedPolynomial(polynomialDifference(left,right,variable));
  if(parsed){
    if(parsed.all)return{kind:"identity",variables:[variable]};
    if(parsed.none)return{kind:"error",code:"NO_SOLUTION",variables:[variable]};
    return{kind:"solution-set",variable,solutions:parsed.roots,degree:parsed.degree,complex:Boolean(parsed.complex),method:parsed.degree>2?"durand-kerner":"closed-form"};
  }
  const f=differenceFunction(left,right,[variable],angleMode);
  const poly=inferQuadratic(x=>f([x]));
  if(poly){
    const solved=quadraticRoots(poly);
    if(solved.all)return{kind:"identity",variables:[variable]};
    if(solved.none)return{kind:"error",code:"NO_SOLUTION",variables:[variable]};
    return{kind:"solution-set",variable,solutions:solved.roots,degree:solved.degree,complex:Boolean(solved.complex)};
  }
  return{kind:"error",code:"NON_POLYNOMIAL_SOLVER_PENDING",variables:[variable]};
}

function inferLinearEquation(left,right,variables,angleMode="RAD"){
  const f=differenceFunction(left,right,variables,angleMode);
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

function solveLinearSystem(equations,variables,angleMode="RAD"){
  const rows=[];
  for(const {left,right} of equations){
    const lin=inferLinearEquation(left,right,variables,angleMode);
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

function solveNumericLinear(a,b){
  const n=b.length,m=a.map((row,i)=>[...row,b[i]]);
  for(let col=0;col<n;col++){
    let p=col;
    for(let r=col+1;r<n;r++)if(Math.abs(m[r][col])>Math.abs(m[p][col]))p=r;
    if(Math.abs(m[p][col])<1e-12)return null;
    [m[col],m[p]]=[m[p],m[col]];
    const div=m[col][col];for(let j=col;j<=n;j++)m[col][j]/=div;
    for(let r=0;r<n;r++){
      if(r===col)continue;
      const q=m[r][col];
      for(let j=col;j<=n;j++)m[r][j]-=q*m[col][j];
    }
  }
  return m.map(r=>r[n]);
}

function nonlinearSystemFunctions(equations,variables,angleMode="RAD"){
  return equations.map(({left,right})=>differenceFunction(left,right,variables,angleMode));
}

function residualNorm(fs,x){
  const values=fs.map(fn=>fn(x));
  if(values.some(v=>!Number.isFinite(v)))return{norm:Infinity,values};
  return{norm:Math.sqrt(values.reduce((s,v)=>s+v*v,0)),values};
}

function jacobian(fs,x){
  const n=x.length,j=[];
  for(let i=0;i<fs.length;i++){
    const row=[];
    for(let k=0;k<n;k++){
      const h=1e-6*Math.max(1,Math.abs(x[k]));
      const xp=x.slice(),xm=x.slice();xp[k]+=h;xm[k]-=h;
      const fp=fs[i](xp),fm=fs[i](xm);
      row.push((fp-fm)/(2*h));
    }
    j.push(row);
  }
  return j;
}

function nonlinearSeeds(n){
  const base=[-10,-5,-2,-1,0,1,2,5,10],out=[];
  const build=(prefix)=>{
    if(prefix.length===n){out.push(prefix);return}
    for(const v of base)build([...prefix,v]);
  };
  build([]);
  return out;
}

function samePoint(a,b){return a.every((v,i)=>Math.abs(v-b[i])<1e-6)}

function solveNonlinearSystem(equations,variables,angleMode="RAD"){
  if(equations.length!==variables.length||variables.length<2||variables.length>2)return null;
  const fs=nonlinearSystemFunctions(equations,variables,angleMode),roots=[];
  for(const seed of nonlinearSeeds(variables.length)){
    let x=seed.slice(),ok=false;
    for(let iter=0;iter<60;iter++){
      const r=residualNorm(fs,x);
      if(r.norm<1e-9){ok=true;break}
      const j=jacobian(fs,x);
      if(j.some(row=>row.some(v=>!Number.isFinite(v))))break;
      const dx=solveNumericLinear(j,r.values.map(v=>-v));
      if(!dx)break;
      const next=x.map((v,i)=>v+dx[i]);
      if(next.some(v=>!Number.isFinite(v)||Math.abs(v)>1e9))break;
      const step=Math.sqrt(dx.reduce((s,v)=>s+v*v,0));
      x=next;
      if(step<1e-11){ok=residualNorm(fs,x).norm<1e-8;break}
    }
    if(!ok&&residualNorm(fs,x).norm>=1e-7)continue;
    x=x.map(clean);
    if(!roots.some(r=>samePoint(r,x)))roots.push(x);
  }
  if(!roots.length)return{kind:"error",code:"NO_NUMERIC_SOLUTION",variables};
  roots.sort((a,b)=>{for(let i=0;i<a.length;i++){if(Math.abs(a[i]-b[i])>1e-8)return a[i]-b[i]}return 0});
  return{
    kind:"system-solution-set",
    variables,
    solutions:roots.map(point=>Object.fromEntries(variables.map((v,i)=>[v,point[i]])))
  };
}

function splitTopLevelArgs(source){
  const out=[];let current="",depth=0;
  for(const ch of String(source)){
    if(ch==="("||ch==="["||ch==="{")depth++;
    if(ch===")"||ch==="]"||ch==="}")depth--;
    if(ch===","&&depth===0){out.push(current.trim());current="";continue}
    current+=ch;
  }
  if(current.trim())out.push(current.trim());
  return out;
}

function elementaryCalculus(operation,source,variable){
  const compact=String(source).replace(/\s+/g,"");
  const lower=compact.toLowerCase(),v=variable.toLowerCase();
  if(operation==="derivative"){
    if(lower==="sin("+v+")")return "cos("+variable+")";
    if(lower==="cos("+v+")")return "-sin("+variable+")";
    if(lower==="exp("+v+")")return "exp("+variable+")";
    if(lower==="ln("+v+")")return "1/"+variable;
  }
  if(operation==="integral"){
    if(lower==="sin("+v+")")return "-cos("+variable+") + C";
    if(lower==="cos("+v+")")return "sin("+variable+") + C";
    if(lower==="exp("+v+")")return "exp("+variable+") + C";
    if(lower==="1/"+v)return "ln(abs("+variable+")) + C";
  }
  return null;
}

function estimateTwoSidedLimit(expression,variable,point,angleMode="RAD"){
  const hs=[1e-1,5e-2,1e-2,5e-3,1e-3,5e-4,1e-4,5e-5,1e-5,5e-6,1e-6];
  const left=[],right=[];
  for(const h of hs){
    const lv=evalNumeric(expression,[variable],[point-h],angleMode);
    const rv=evalNumeric(expression,[variable],[point+h],angleMode);
    if(lv.kind!=="value"||rv.kind!=="value"||!Number.isFinite(lv.numeric)||!Number.isFinite(rv.numeric))continue;
    left.push(lv.numeric);right.push(rv.numeric);
  }
  if(left.length<4)return null;
  const l=left.at(-1),r=right.at(-1);
  const scale=Math.max(1,Math.abs(l),Math.abs(r));
  if(Math.abs(l)>1e8||Math.abs(r)>1e8||Math.abs(l-r)>1e-5*scale)return null;
  const l4=left.slice(-4),r4=right.slice(-4),avgs=l4.map((v,i)=>0.5*(v+r4[i]));
  const last=avgs.at(-1),spread=Math.max(...avgs.map(v=>Math.abs(v-last)));
  if(spread>1e-5*Math.max(1,Math.abs(last)))return null;
  return clean(last);
}

function numericRootFunction(equation,variable,angleMode="RAD"){
  const parts=String(equation).split("=");
  if(parts.length===1)return values=>{
    const r=evalNumeric(parts[0],[variable],values,angleMode);
    return r.kind==="value"?r.numeric:NaN;
  };
  if(parts.length===2&&parts[0].trim()&&parts[1].trim())return values=>{
    const a=evalNumeric(parts[0].trim(),[variable],values,angleMode);
    const b=evalNumeric(parts[1].trim(),[variable],values,angleMode);
    if(a.kind!=="value"||b.kind!=="value")return NaN;
    return a.numeric-b.numeric;
  };
  return null;
}

function solveNumericRootNewton(equation,variable,guess,angleMode="RAD"){
  const f=numericRootFunction(equation,variable,angleMode);
  if(!f||!Number.isFinite(guess))return null;
  let x=guess;
  for(let i=0;i<80;i++){
    const fx=f([x]);
    if(!Number.isFinite(fx))return null;
    if(Math.abs(fx)<1e-10)return{value:clean(x),residual:clean(fx),method:"newton",iterations:i};
    const h=1e-6*Math.max(1,Math.abs(x));
    const fp=f([x+h]),fm=f([x-h]);
    if(!Number.isFinite(fp)||!Number.isFinite(fm))return null;
    const d=(fp-fm)/(2*h);
    if(!Number.isFinite(d)||Math.abs(d)<1e-12)return null;
    const next=x-fx/d;
    if(!Number.isFinite(next)||Math.abs(next)>1e12)return null;
    if(Math.abs(next-x)<1e-12*Math.max(1,Math.abs(next))){
      x=next;
      const final=f([x]);
      return Number.isFinite(final)&&Math.abs(final)<1e-8?{value:clean(x),residual:clean(final),method:"newton",iterations:i+1}:null;
    }
    x=next;
  }
  const final=f([x]);
  return Number.isFinite(final)&&Math.abs(final)<1e-8?{value:clean(x),residual:clean(final),method:"newton",iterations:80}:null;
}

function solveNumericRootBracket(equation,variable,min,max,angleMode="RAD"){
  const f=numericRootFunction(equation,variable,angleMode);
  if(!f||!Number.isFinite(min)||!Number.isFinite(max)||!(min<max))return null;
  let a=min,b=max,fa=f([a]),fb=f([b]);
  if(!Number.isFinite(fa)||!Number.isFinite(fb))return null;
  if(Math.abs(fa)<1e-10)return{value:clean(a),residual:clean(fa),method:"bisection",iterations:0};
  if(Math.abs(fb)<1e-10)return{value:clean(b),residual:clean(fb),method:"bisection",iterations:0};
  if(fa*fb>0)return null;
  for(let i=0;i<120;i++){
    const m=(a+b)/2,fm=f([m]);
    if(!Number.isFinite(fm))return null;
    if(Math.abs(fm)<1e-10||Math.abs(b-a)<1e-12*Math.max(1,Math.abs(m)))return{value:clean(m),residual:clean(fm),method:"bisection",iterations:i+1};
    if(fa*fm<=0){b=m;fb=fm}else{a=m;fa=fm}
  }
  const m=(a+b)/2,fm=f([m]);
  return Number.isFinite(fm)?{value:clean(m),residual:clean(fm),method:"bisection",iterations:120}:null;
}

function solveNumericRootFromGuess(equation,variable,guess,angleMode="RAD"){
  const direct=solveNumericRootNewton(equation,variable,guess,angleMode);
  if(direct)return direct;
  const f=numericRootFunction(equation,variable,angleMode);
  if(!f)return null;
  let radius=Math.max(0.5,Math.abs(guess)*0.25);
  for(let attempt=0;attempt<12;attempt++){
    const min=guess-radius,max=guess+radius;
    const fa=f([min]),fb=f([max]);
    if(Number.isFinite(fa)&&Number.isFinite(fb)&&fa*fb<=0){
      const bracketed=solveNumericRootBracket(equation,variable,min,max,angleMode);
      if(bracketed)return{...bracketed,method:"hybrid",bracket:[clean(min),clean(max)]};
    }
    radius*=2;
  }
  return null;
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

export function solveAdvancedInput(source,{angleMode="RAD"}={}){
  source=normalize(source);
  angleMode=String(angleMode??"RAD").toUpperCase();
  if(angleMode!=="RAD"&&angleMode!=="DEG")return{kind:"error",code:"INVALID_ANGLE_MODE"};
  const nsolveCall=source.match(/^nsolve\((.*)\)$/i);
  if(nsolveCall){
    const args=splitTopLevelArgs(nsolveCall[1]);
    if((args.length!==3&&args.length!==4)||!/^[A-Za-z]$/.test(args[1]))return{kind:"error",code:"INVALID_NUMERIC_SOLVE"};
    const variable=args[1];
    let solved=null;
    if(args.length===3){
      const guess=Number(args[2]);
      if(!Number.isFinite(guess))return{kind:"error",code:"INVALID_NUMERIC_SOLVE",variables:[variable]};
      solved=solveNumericRootFromGuess(args[0],variable,guess,angleMode);
    }else{
      const min=Number(args[2]),max=Number(args[3]);
      if(!Number.isFinite(min)||!Number.isFinite(max)||!(min<max))return{kind:"error",code:"INVALID_NUMERIC_SOLVE",variables:[variable]};
      solved=solveNumericRootBracket(args[0],variable,min,max,angleMode);
    }
    if(!solved)return{kind:"error",code:"NO_NUMERIC_ROOT",variables:[variable]};
    return{kind:"numeric-root",variable,value:solved.value,residual:solved.residual,method:solved.method,iterations:solved.iterations,angleMode,bracket:solved.bracket};
  }
  const limitCall=source.match(/^limit\((.*)\)$/i);
  if(limitCall){
    const args=splitTopLevelArgs(limitCall[1]);
    if(args.length!==3||!/^[A-Za-z]$/.test(args[1]))return{kind:"error",code:"INVALID_LIMIT"};
    const variable=args[1],point=Number(args[2]);
    if(!Number.isFinite(point))return{kind:"error",code:"INVALID_LIMIT"};
    const value=estimateTwoSidedLimit(args[0],variable,point,angleMode);
    if(value===null)return{kind:"error",code:"LIMIT_DOES_NOT_EXIST",variables:[variable]};
    return{kind:"limit",variable,point,value,angleMode};
  }
  const transform=source.match(/^(expand|simplify)\((.*)\)$/i);
  if(transform){
    const variables=[...new Set((transform[2].match(/\b[A-Za-z]\b/g)||[]).filter(v=>v.toLowerCase()!=="e"))];
    const variable=variables[0]??"x";
    if(variables.length>1)return{kind:"error",code:"SYMBOLIC_TRANSFORM_UNSUPPORTED",variables};
    try{
      const expression=formatPolynomial(parsePolynomial(transform[2],variable),variable);
      return{kind:"symbolic-transform",operation:transform[1].toLowerCase(),variable,expression};
    }catch{
      return{kind:"error",code:"SYMBOLIC_TRANSFORM_UNSUPPORTED",variables:variables.length?variables:[variable]};
    }
  }
  const calculus=source.match(/^(diff|differentiate|integrate)\((.*),\s*([A-Za-z])\)$/i);
  if(calculus){
    const operation=/^integrate$/i.test(calculus[1])?"integral":"derivative";
    const variable=calculus[3];
    let expression=runPolynomialCalculus(operation,calculus[2],variable);
    if(expression===null)expression=elementaryCalculus(operation,calculus[2],variable);
    if(expression!==null)return{kind:"symbolic-calculus",operation,variable,expression};
    return{kind:"error",code:"SYMBOLIC_CALCULUS_UNSUPPORTED",variables:[variable]};
  }
  if(!source)return{kind:"error",code:"EMPTY_INPUT"};
  const vars=variableList(source);
  const hasEquals=source.includes("=");

  if(!hasEquals){
    if(vars.length===0)return evaluateExpression(source,{angleMode,ans:"0"});
    if(vars.length===1){
      const variable=vars[0],poly=inferQuadratic(x=>{
        const r=evalNumeric(source,[variable],[x],angleMode);return r.kind==="value"?r.numeric:NaN;
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
    const a=evaluateExpression(equations[0].left,{angleMode,ans:"0"});
    const b=evaluateExpression(equations[0].right,{angleMode,ans:"0"});
    if(a.kind!=="value"||b.kind!=="value")return{kind:"error",code:"INVALID_EXPRESSION"};
    return{kind:"equation-check",equal:Math.abs(a.numeric-b.numeric)<EPS,left:a.numeric,right:b.numeric};
  }

  if(equations.length===1&&vars.length===1)return solveSingleEquation(equations[0].left,equations[0].right,vars[0],angleMode);

  const linear=solveLinearSystem(equations,vars,angleMode);
  if(linear)return linear;
  const nonlinear=solveNonlinearSystem(equations,vars,angleMode);
  if(nonlinear)return nonlinear;
  return{kind:"error",code:"NONLINEAR_SYSTEM_NOT_YET_SUPPORTED",variables:vars};
}
