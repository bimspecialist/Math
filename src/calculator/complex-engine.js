const EPS=1e-14;
const C=(re=0,im=0)=>({re:Number(re),im:Number(im)});
const clean=x=>Math.abs(x)<EPS?0:Number(x.toPrecision(14));
const add=(a,b)=>C(a.re+b.re,a.im+b.im);
const sub=(a,b)=>C(a.re-b.re,a.im-b.im);
const mul=(a,b)=>C(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
function div(a,b){
  const d=b.re*b.re+b.im*b.im;
  if(d<EPS)throw new Error("DIVISION_BY_ZERO");
  return C((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d);
}
const abs=z=>Math.hypot(z.re,z.im);
const arg=z=>Math.atan2(z.im,z.re);
const expc=z=>{const e=Math.exp(z.re);return C(e*Math.cos(z.im),e*Math.sin(z.im))};
function logc(z){
  const r=abs(z);if(r<EPS)throw new Error("DOMAIN_ERROR");
  return C(Math.log(r),arg(z));
}
function powc(a,b){return expc(mul(b,logc(a)))}
function sqrtc(z){
  if(Math.abs(z.im)<EPS&&z.re>=0)return C(Math.sqrt(z.re),0);
  const r=abs(z),re=Math.sqrt(Math.max(0,(r+z.re)/2)),im=Math.sign(z.im||1)*Math.sqrt(Math.max(0,(r-z.re)/2));
  return C(re,im);
}
const sinc=z=>div(sub(expc(C(-z.im,z.re)),expc(C(z.im,-z.re))),C(0,2));
const cosc=z=>div(add(expc(C(-z.im,z.re)),expc(C(z.im,-z.re))),C(2,0));
const tanc=z=>div(sinc(z),cosc(z));
const sinhc=z=>div(sub(expc(z),expc(C(-z.re,-z.im))),C(2,0));
const coshc=z=>div(add(expc(z),expc(C(-z.re,-z.im))),C(2,0));
const tanhc=z=>div(sinhc(z),coshc(z));

function normalize(source){
  return String(source??"").replaceAll("×","*").replaceAll("÷","/").replaceAll("−","-").replaceAll("²","^2").replaceAll("³","^3").replaceAll("√","sqrt");
}
function tokenize(source){
  const s=normalize(source),out=[];let i=0;
  while(i<s.length){
    const ch=s[i];
    if(/\s/.test(ch)){i++;continue}
    if(/[0-9.]/.test(ch)){
      const start=i++;while(/[0-9.]/.test(s[i]||""))i++;
      if(/[eE]/.test(s[i]||"")){i++;if(/[+-]/.test(s[i]||""))i++;const p=i;while(/[0-9]/.test(s[i]||""))i++;if(i===p)throw new Error("INVALID_EXPRESSION")}
      const raw=s.slice(start,i),v=Number(raw);if(!Number.isFinite(v))throw new Error("INVALID_EXPRESSION");
      out.push({t:"num",v});continue;
    }
    if(/[A-Za-z_π]/.test(ch)){
      const start=i++;while(/[A-Za-z0-9_π]/.test(s[i]||""))i++;
      out.push({t:"id",v:s.slice(start,i)});continue;
    }
    if("+-*/^".includes(ch)){out.push({t:"op",v:ch});i++;continue}
    if("(),".includes(ch)){out.push({t:ch});i++;continue}
    throw new Error("INVALID_EXPRESSION");
  }
  out.push({t:"eof"});return out;
}
class Parser{
  constructor(source){this.ts=tokenize(source);this.p=0}
  peek(){return this.ts[this.p]}
  take(){return this.ts[this.p++]}
  parse(){const z=this.add();if(this.peek().t!=="eof")throw new Error("INVALID_EXPRESSION");return z}
  add(){let z=this.mul();while(this.peek().t==="op"&&["+","-"].includes(this.peek().v)){const op=this.take().v,r=this.mul();z=op==="+"?add(z,r):sub(z,r)}return z}
  start(t){return t==="num"||t==="id"||t==="("}
  mul(){let z=this.unary();while(true){if(this.peek().t==="op"&&["*","/"].includes(this.peek().v)){const op=this.take().v,r=this.unary();z=op==="*"?mul(z,r):div(z,r);continue}if(this.start(this.peek().t)){z=mul(z,this.unary());continue}break}return z}
  unary(){if(this.peek().t==="op"&&["+","-"].includes(this.peek().v)){const op=this.take().v,z=this.unary();return op==="-"?C(-z.re,-z.im):z}return this.power()}
  power(){let z=this.primary();if(this.peek().t==="op"&&this.peek().v==="^"){this.take();z=powc(z,this.unary())}return z}
  primary(){
    const t=this.take();
    if(t.t==="num")return C(t.v,0);
    if(t.t==="("){const z=this.add();if(this.take().t!==")")throw new Error("INVALID_EXPRESSION");return z}
    if(t.t!=="id")throw new Error("INVALID_EXPRESSION");
    const id=t.v.toLowerCase();
    if(id==="i"||id==="j")return C(0,1);
    if(id==="pi"||id==="π")return C(Math.PI,0);
    if(id==="e")return C(Math.E,0);
    if(this.take().t!=="(")throw new Error("INVALID_EXPRESSION");
    const args=[];if(this.peek().t!==")"){args.push(this.add());while(this.peek().t===","){this.take();args.push(this.add())}}
    if(this.take().t!==")")throw new Error("INVALID_EXPRESSION");
    return this.call(id,args);
  }
  call(name,args){
    const one=()=>{if(args.length!==1)throw new Error("INVALID_EXPRESSION");return args[0]};
    const two=()=>{if(args.length!==2)throw new Error("INVALID_EXPRESSION");return args};
    switch(name){
      case"complex":{const[a,b]=two();if(Math.abs(a.im)>EPS||Math.abs(b.im)>EPS)throw new Error("DOMAIN_ERROR");return C(a.re,b.re)}
      case"re":return C(one().re,0);
      case"im":return C(one().im,0);
      case"conj":{const z=one();return C(z.re,-z.im)}
      case"abs":return C(abs(one()),0);
      case"arg":return C(arg(one()),0);
      case"sqrt":return sqrtc(one());
      case"exp":return expc(one());
      case"ln":case"log":return logc(one());
      case"sin":return sinc(one());
      case"cos":return cosc(one());
      case"tan":return tanc(one());
      case"sinh":return sinhc(one());
      case"cosh":return coshc(one());
      case"tanh":return tanhc(one());
      case"polar":{const[r,theta]=two();if(Math.abs(r.im)>EPS||Math.abs(theta.im)>EPS)throw new Error("DOMAIN_ERROR");return C(r.re*Math.cos(theta.re),r.re*Math.sin(theta.re))}
      default:throw new Error("UNSUPPORTED_OPERATION");
    }
  }
}
export function formatComplex(value){
  const re=clean(value.re),im=clean(value.im);
  if(im===0)return String(re);
  if(re===0)return im===1?"i":im===-1?"-i":`${im}i`;
  const sign=im<0?"-":"+";
  const mag=Math.abs(im)===1?"i":`${Math.abs(im)}i`;
  return `${re}${sign}${mag}`;
}
export function evaluateComplexExpression(source){
  if(!String(source??"").trim())return{kind:"error",code:"INVALID_EXPRESSION"};
  try{
    const z=new Parser(source).parse();
    if(!Number.isFinite(z.re)||!Number.isFinite(z.im))return{kind:"error",code:"DOMAIN_ERROR"};
    return{kind:"complex",re:clean(z.re),im:clean(z.im),display:formatComplex(z)};
  }catch(e){
    return{kind:"error",code:["DIVISION_BY_ZERO","DOMAIN_ERROR","UNSUPPORTED_OPERATION","INVALID_EXPRESSION"].includes(e?.message)?e.message:"INVALID_EXPRESSION"};
  }
}
