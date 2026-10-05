class EngineError extends Error {
  constructor(code){ super(code); this.code=code; }
}

const safeInt=Number.isSafeInteger;
const gcdInt=(a,b)=>{a=Math.abs(Math.trunc(a));b=Math.abs(Math.trunc(b));while(b){[a,b]=[b,a%b]}return a||1};
const norm=(n,d)=>{
  if(d===0)throw new EngineError("DIVISION_BY_ZERO");
  if(!safeInt(n)||!safeInt(d))return null;
  if(d<0){n=-n;d=-d}
  const g=gcdInt(n,d),nn=n/g,dd=d/g;
  return safeInt(nn)&&safeInt(dd)?{n:nn,d:dd}:null;
};
const addR=(a,b)=>norm(a.n*b.d+b.n*a.d,a.d*b.d);
const subR=(a,b)=>norm(a.n*b.d-b.n*a.d,a.d*b.d);
const mulR=(a,b)=>norm(a.n*b.n,a.d*b.d);
const divR=(a,b)=>norm(a.n*b.d,a.d*b.n);
const powR=(a,p)=>{
  if(!Number.isInteger(p))return null;
  if(p===0)return{n:1,d:1};
  if(p<0){const q=powR(a,-p);return q?norm(q.d,q.n):null}
  const n=a.n**p,d=a.d**p;
  return Number.isFinite(n)&&Number.isFinite(d)?norm(n,d):null;
};
const exactString=r=>r?(r.d===1?String(r.n):`${r.n}/${r.d}`):undefined;

function decimalRational(raw){
  if(/[eE]/.test(raw))return null;
  if(!raw.includes(".")){const n=Number(raw);return safeInt(n)?{n,d:1}:null}
  const [i,f=""]=raw.split("."),d=10**f.length;
  const sign=String(i).startsWith("-")?-1:1;
  const n=Number(i||"0")*d+sign*Number(f);
  return safeInt(n)&&safeInt(d)?norm(n,d):null;
}

function normalizeInput(input){
  return String(input)
    .replaceAll("×","*").replaceAll("÷","/").replaceAll("−","-")
    .replaceAll("²","^2").replaceAll("³","^3")
    .replaceAll("√","sqrt");
}

function tokenize(input){
  const out=[];let i=0;input=normalizeInput(input);
  while(i<input.length){
    const c=input[i];
    if(/\s/.test(c)){i++;continue}
    if(/[0-9.]/.test(c)){
      const s=i++;
      while(i<input.length&&/[0-9.]/.test(input[i]))i++;
      if(/[eE]/.test(input[i]||"")){
        i++;if(/[+-]/.test(input[i]||""))i++;
        const expStart=i;while(/[0-9]/.test(input[i]||""))i++;
        if(i===expStart)throw new EngineError("INVALID_EXPRESSION");
      }
      const raw=input.slice(s,i),v=Number(raw);
      if(!Number.isFinite(v))throw new EngineError("INVALID_EXPRESSION");
      out.push({t:"num",v,raw});continue;
    }
    if(/[A-Za-z_π]/.test(c)){
      const s=i++;
      while(i<input.length&&/[A-Za-z0-9_π]/.test(input[i]))i++;
      out.push({t:"id",v:input.slice(s,i)});continue;
    }
    if("+-*/^!%".includes(c)){out.push({t:"op",v:c});i++;continue}
    if(c==="("||c===")"||c===","){out.push({t:c});i++;continue}
    throw new EngineError("INVALID_EXPRESSION");
  }
  out.push({t:"eof"});return out;
}

const V=(num,rat=null)=>({num,rat});
const assertInteger=x=>{if(!Number.isInteger(x))throw new EngineError("DOMAIN_ERROR");return x};
const factorial=n=>{assertInteger(n);if(n<0||n>170)throw new EngineError("DOMAIN_ERROR");let v=1;for(let i=2;i<=n;i++)v*=i;return v};
const clampTiny=x=>Math.abs(x)<1e-15?0:x;

function combination(n,r){
  assertInteger(n);assertInteger(r);
  if(n<0||r<0||r>n)throw new EngineError("DOMAIN_ERROR");
  r=Math.min(r,n-r);let v=1;
  for(let i=1;i<=r;i++)v=v*(n-r+i)/i;
  return v;
}
function permutation(n,r){
  assertInteger(n);assertInteger(r);
  if(n<0||r<0||r>n)throw new EngineError("DOMAIN_ERROR");
  let v=1;for(let i=0;i<r;i++)v*=n-i;return v;
}
function lcmInt(a,b){
  assertInteger(a);assertInteger(b);
  if(a===0||b===0)return 0;
  return Math.abs(a/gcdInt(a,b)*b);
}
function sampleStd(values){
  if(values.length<2)throw new EngineError("DOMAIN_ERROR");
  const mean=values.reduce((s,v)=>s+v,0)/values.length;
  return Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/(values.length-1));
}
function populationStd(values){
  if(!values.length)throw new EngineError("DOMAIN_ERROR");
  const mean=values.reduce((s,v)=>s+v,0)/values.length;
  return Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/values.length);
}

class Parser {
  constructor(source,ctx){this.ts=tokenize(source);this.p=0;this.ctx=ctx}
  peek(){return this.ts[this.p]}
  take(){return this.ts[this.p++]}
  parse(){const v=this.add();if(this.peek().t!=="eof")throw new EngineError("INVALID_EXPRESSION");return v}
  add(){
    let l=this.mul();
    while(this.peek().t==="op"&&["+","-"].includes(this.peek().v)){
      const op=this.take().v,r=this.mul();
      l=V(op==="+"?l.num+r.num:l.num-r.num,l.rat&&r.rat?(op==="+"?addR(l.rat,r.rat):subR(l.rat,r.rat)):null);
    }
    return l;
  }
  factorStart(t){return t==="num"||t==="id"||t==="("}
  mul(){
    let l=this.unary();
    while(true){
      if(this.peek().t==="op"&&["*","/"].includes(this.peek().v)){
        const op=this.take().v,r=this.unary();
        if(op==="/"&&r.num===0)throw new EngineError("DIVISION_BY_ZERO");
        l=V(op==="*"?l.num*r.num:l.num/r.num,l.rat&&r.rat?(op==="*"?mulR(l.rat,r.rat):divR(l.rat,r.rat)):null);
        continue;
      }
      if(this.factorStart(this.peek().t)){
        const r=this.unary();
        l=V(l.num*r.num,l.rat&&r.rat?mulR(l.rat,r.rat):null);
        continue;
      }
      break;
    }
    return l;
  }
  power(){
    let l=this.post();
    if(this.peek().t==="op"&&this.peek().v==="^"){
      this.take();const r=this.unary(),num=Math.pow(l.num,r.num);
      if(!Number.isFinite(num))throw new EngineError("DOMAIN_ERROR");
      l=V(num,l.rat&&r.rat&&r.rat.d===1?powR(l.rat,r.rat.n):null);
    }
    return l;
  }
  unary(){
    if(this.peek().t==="op"&&["+","-"].includes(this.peek().v)){
      const o=this.take().v,v=this.unary();
      return o==="-"?V(-v.num,v.rat?{n:-v.rat.n,d:v.rat.d}:null):v;
    }
    return this.power();
  }
  post(){
    let v=this.primary();
    while(this.peek().t==="op"&&["!","%"].includes(this.peek().v)){
      const op=this.take().v;
      if(op==="%"){v=V(v.num/100,v.rat?divR(v.rat,{n:100,d:1}):null);continue}
      const n=factorial(v.num);v=V(n,safeInt(n)?{n,d:1}:null);
    }
    return v;
  }
  primary(){
    const x=this.take();
    if(x.t==="num")return V(x.v,decimalRational(x.raw));
    if(x.t==="("){const v=this.add();if(this.take().t!==")")throw new EngineError("INVALID_EXPRESSION");return v}
    if(x.t!=="id")throw new EngineError("INVALID_EXPRESSION");
    const rawId=x.v,id=rawId.toLowerCase();
    if(id==="pi"||id==="π")return V(Math.PI,null);
    if(id==="e")return V(Math.E,null);
    if(id==="ans")return V(Number(this.ctx.ans??0),decimalRational(String(this.ctx.ans??0)));
    if(Object.prototype.hasOwnProperty.call(this.ctx.variables??{},rawId))return V(Number(this.ctx.variables[rawId]),null);
    if(Object.prototype.hasOwnProperty.call(this.ctx.variables??{},id))return V(Number(this.ctx.variables[id]),null);
    if(this.take().t!=="(")throw new EngineError("INVALID_EXPRESSION");
    const args=[];
    if(this.peek().t!==")"){
      args.push(this.add());
      while(this.peek().t===","){this.take();args.push(this.add())}
    }
    if(this.take().t!==")")throw new EngineError("INVALID_EXPRESSION");
    return this.call(id,args);
  }
  call(name,args){
    const one=()=>{if(args.length!==1)throw new EngineError("INVALID_EXPRESSION");return args[0].num};
    const two=()=>{if(args.length!==2)throw new EngineError("INVALID_EXPRESSION");return[args[0].num,args[1].num]};
    const vals=()=>args.map(x=>x.num);
    const tr=x=>this.ctx.angleMode==="DEG"?x*Math.PI/180:this.ctx.angleMode==="GRAD"?x*Math.PI/200:x;
    const fr=x=>this.ctx.angleMode==="DEG"?x*180/Math.PI:this.ctx.angleMode==="GRAD"?x*200/Math.PI:x;
    switch(name){
      case"sin":return V(clampTiny(Math.sin(tr(one()))));
      case"cos":return V(clampTiny(Math.cos(tr(one()))));
      case"tan":{const a=tr(one());if(Math.abs(Math.cos(a))<1e-14)throw new EngineError("DOMAIN_ERROR");return V(clampTiny(Math.tan(a)))}
      case"asin":{const x=one();if(x<-1||x>1)throw new EngineError("DOMAIN_ERROR");return V(fr(Math.asin(x)))}
      case"acos":{const x=one();if(x<-1||x>1)throw new EngineError("DOMAIN_ERROR");return V(fr(Math.acos(x)))}
      case"atan":return V(fr(Math.atan(one())));
      case"atan2":{const[y,x]=two();return V(fr(Math.atan2(y,x)))}
      case"sinh":return V(Math.sinh(one()));
      case"cosh":return V(Math.cosh(one()));
      case"tanh":return V(Math.tanh(one()));
      case"asinh":return V(Math.asinh(one()));
      case"acosh":{const x=one();if(x<1)throw new EngineError("DOMAIN_ERROR");return V(Math.acosh(x))}
      case"atanh":{const x=one();if(Math.abs(x)>=1)throw new EngineError("DOMAIN_ERROR");return V(Math.atanh(x))}
      case"pow10":return V(Math.pow(10,one()));
      case"exp":return V(Math.exp(one()));
      case"log":{
        if(args.length===1){const x=one();if(x<=0)throw new EngineError("DOMAIN_ERROR");return V(Math.log10(x))}
        if(args.length===2){const[b,x]=two();if(b<=0||b===1||x<=0)throw new EngineError("DOMAIN_ERROR");return V(Math.log(x)/Math.log(b))}
        throw new EngineError("INVALID_EXPRESSION");
      }
      case"ln":{const x=one();if(x<=0)throw new EngineError("DOMAIN_ERROR");return V(Math.log(x))}
      case"sqrt":{const x=one();if(x<0)throw new EngineError("DOMAIN_ERROR");const n=Math.sqrt(x);return V(n,Number.isInteger(n)?{n,d:1}:null)}
      case"cbrt":return V(Math.cbrt(one()));
      case"root":{const[n,x]=two();if(n===0||(x<0&&Math.abs(n%2)!==1))throw new EngineError("DOMAIN_ERROR");return V(x<0?-Math.pow(-x,1/n):Math.pow(x,1/n))}
      case"abs":{const x=args[0];if(args.length!==1)throw new EngineError("INVALID_EXPRESSION");return V(Math.abs(x.num),x.rat?{n:Math.abs(x.rat.n),d:x.rat.d}:null)}
      case"sign":return V(Math.sign(one()));
      case"floor":return V(Math.floor(one()));
      case"ceil":return V(Math.ceil(one()));
      case"round":{
        if(args.length===1)return V(Math.round(one()));
        if(args.length===2){const[x,d]=two();assertInteger(d);const p=10**d;return V(Math.round(x*p)/p)}
        throw new EngineError("INVALID_EXPRESSION");
      }
      case"trunc":case"int":return V(Math.trunc(one()));
      case"frac":{const x=one();return V(x-Math.trunc(x))}
      case"mod":{const[a,b]=two();if(b===0)throw new EngineError("DIVISION_BY_ZERO");return V(((a%b)+b)%b)}
      case"rem":{const[a,b]=two();if(b===0)throw new EngineError("DIVISION_BY_ZERO");return V(a%b)}
      case"gcd":{const[a,b]=two();assertInteger(a);assertInteger(b);return V(gcdInt(a,b),{n:gcdInt(a,b),d:1})}
      case"lcm":{const[a,b]=two();const v=lcmInt(a,b);return V(v,safeInt(v)?{n:v,d:1}:null)}
      case"ncr":{const[n,r]=two(),v=combination(n,r);return V(v,safeInt(v)?{n:v,d:1}:null)}
      case"npr":{const[n,r]=two(),v=permutation(n,r);return V(v,safeInt(v)?{n:v,d:1}:null)}
      case"min":{if(!args.length)throw new EngineError("INVALID_EXPRESSION");return V(Math.min(...vals()))}
      case"max":{if(!args.length)throw new EngineError("INVALID_EXPRESSION");return V(Math.max(...vals()))}
      case"mean":case"avg":{if(!args.length)throw new EngineError("INVALID_EXPRESSION");const a=vals();return V(a.reduce((s,v)=>s+v,0)/a.length)}
      case"sum":{if(!args.length)throw new EngineError("INVALID_EXPRESSION");return V(vals().reduce((s,v)=>s+v,0))}
      case"prod":{if(!args.length)throw new EngineError("INVALID_EXPRESSION");return V(vals().reduce((s,v)=>s*v,1))}
      case"std":case"stdev":return V(sampleStd(vals()));
      case"stdp":return V(populationStd(vals()));
      case"hypot":{if(args.length<2)throw new EngineError("INVALID_EXPRESSION");return V(Math.hypot(...vals()))}
      case"deg":return V(one()*180/Math.PI);
      case"rad":return V(one()*Math.PI/180);
      case"grad":return V(one()*200/180);
      case"dms":{
        if(args.length!==3)throw new EngineError("INVALID_EXPRESSION");
        let[d,m,s]=vals();const sign=d<0?-1:1;d=Math.abs(d);
        if(m<0||m>=60||s<0||s>=60)throw new EngineError("DOMAIN_ERROR");
        return V(sign*(d+m/60+s/3600));
      }
      case"rand":if(args.length)throw new EngineError("INVALID_EXPRESSION");return V(Math.random());
      case"randint":{
        const[a,b]=two();assertInteger(a);assertInteger(b);if(b<a)throw new EngineError("DOMAIN_ERROR");
        return V(a+Math.floor(Math.random()*(b-a+1)));
      }
      default:throw new EngineError("UNSUPPORTED_OPERATION");
    }
  }
}


function splitTopLevelArgs(source){
  const out=[];let depth=0,start=0;
  for(let i=0;i<source.length;i++){
    const ch=source[i];
    if(ch==="(")depth++;
    else if(ch===")")depth--;
    else if(ch===","&&depth===0){out.push(source.slice(start,i).trim());start=i+1}
  }
  out.push(source.slice(start).trim());
  return out.filter(x=>x.length);
}
function specialAnalysis(source,context){
  const match=String(source).trim().match(/^(deriv|derivative|integral|sigma)\((.*)\)$/i);
  if(!match)return null;
  const fn=match[1].toLowerCase(),args=splitTopLevelArgs(match[2]);
  const evalAt=(expr,x)=>{
    const r=evaluateExpression(expr,{...context,variables:{...(context.variables??{}),X:x,x}});
    if(r.kind!=="value")throw new EngineError(r.code||"DOMAIN_ERROR");
    return r.numeric;
  };
  if(fn==="deriv"||fn==="derivative"){
    if(args.length<2||args.length>3)throw new EngineError("INVALID_EXPRESSION");
    const xr=evaluateExpression(args[1],context);if(xr.kind!=="value")throw new EngineError(xr.code);
    const x=xr.numeric,h=args[2]?Math.abs(evaluateExpression(args[2],context).numeric):Math.cbrt(Number.EPSILON)*Math.max(1,Math.abs(x));
    if(!Number.isFinite(h)||h<=0)throw new EngineError("DOMAIN_ERROR");
    const f1=evalAt(args[0],x-2*h),f2=evalAt(args[0],x-h),f3=evalAt(args[0],x+h),f4=evalAt(args[0],x+2*h);
    const value=(f1-8*f2+8*f3-f4)/(12*h);
    return{kind:"value",numeric:clampTiny(value),exact:undefined};
  }
  if(fn==="integral"){
    if(args.length!==3)throw new EngineError("INVALID_EXPRESSION");
    const ar=evaluateExpression(args[1],context),br=evaluateExpression(args[2],context);
    if(ar.kind!=="value"||br.kind!=="value")throw new EngineError("INVALID_EXPRESSION");
    let a=ar.numeric,b=br.numeric,sign=1;if(a>b){[a,b]=[b,a];sign=-1}
    const simpson=(lo,hi,fl,fm,fh)=>(hi-lo)*(fl+4*fm+fh)/6;
    const recurse=(lo,hi,fl,fm,fh,whole,tol,depth)=>{
      const mid=(lo+hi)/2,lm=(lo+mid)/2,rm=(mid+hi)/2;
      const flm=evalAt(args[0],lm),frm=evalAt(args[0],rm);
      const left=simpson(lo,mid,fl,flm,fm),right=simpson(mid,hi,fm,frm,fh);
      const delta=left+right-whole;
      if(depth<=0||Math.abs(delta)<=15*tol)return left+right+delta/15;
      return recurse(lo,mid,fl,flm,fm,left,tol/2,depth-1)+recurse(mid,hi,fm,frm,fh,right,tol/2,depth-1);
    };
    if(a===b)return{kind:"value",numeric:0,exact:"0"};
    const mid=(a+b)/2,fa=evalAt(args[0],a),fm=evalAt(args[0],mid),fb=evalAt(args[0],b);
    const value=sign*recurse(a,b,fa,fm,fb,simpson(a,b,fa,fm,fb),1e-10,18);
    return{kind:"value",numeric:clampTiny(value),exact:undefined};
  }
  if(fn==="sigma"){
    if(args.length!==3)throw new EngineError("INVALID_EXPRESSION");
    const ar=evaluateExpression(args[1],context),br=evaluateExpression(args[2],context);
    if(ar.kind!=="value"||br.kind!=="value")throw new EngineError("INVALID_EXPRESSION");
    const a=ar.numeric,b=br.numeric;if(!Number.isInteger(a)||!Number.isInteger(b)||b<a||b-a>100000)throw new EngineError("DOMAIN_ERROR");
    let total=0;for(let x=a;x<=b;x++)total+=evalAt(args[0],x);
    return{kind:"value",numeric:clampTiny(total),exact:Number.isSafeInteger(total)?String(total):undefined};
  }
  return null;
}

export function evaluateExpression(source,context={angleMode:"DEG",ans:"0",variables:{}}){
  if(!source?.trim())return{kind:"error",code:"INVALID_EXPRESSION"};
  try{
    const special=specialAnalysis(source,context);
    if(special)return special;
    const v=new Parser(source,{
      angleMode:context.angleMode??"DEG",
      ans:context.ans??"0",
      variables:context.variables??{}
    }).parse();
    if(!Number.isFinite(v.num))return{kind:"error",code:"DOMAIN_ERROR"};
    return{kind:"value",numeric:v.num,exact:exactString(v.rat)};
  }catch(e){
    if(e instanceof EngineError)return{kind:"error",code:e.code};
    return{kind:"error",code:"INVALID_EXPRESSION"};
  }
}
