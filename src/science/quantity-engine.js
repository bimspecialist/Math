const DIMS=["L","M","T","I","TH","N","J"];
const dim=(L=0,M=0,T=0,I=0,TH=0,N=0,J=0)=>Object.freeze([L,M,T,I,TH,N,J]);
const addDim=(a,b)=>a.map((v,i)=>v+b[i]);
const subDim=(a,b)=>a.map((v,i)=>v-b[i]);
const mulDim=(a,p)=>a.map(v=>v*p);
const sameDim=(a,b)=>a.every((v,i)=>v===b[i]);

const U=(factor,dims,label)=>Object.freeze({factor,dims,label});
export const SCIENTIFIC_UNITS=Object.freeze({
  "1":U(1,dim(),""),
  m:U(1,dim(1),"m"), km:U(1e3,dim(1),"km"), cm:U(1e-2,dim(1),"cm"), mm:U(1e-3,dim(1),"mm"), um:U(1e-6,dim(1),"um"), nm:U(1e-9,dim(1),"nm"),
  in:U(0.0254,dim(1),"in"), ft:U(0.3048,dim(1),"ft"), yd:U(0.9144,dim(1),"yd"), mi:U(1609.344,dim(1),"mi"),
  kg:U(1,dim(0,1),"kg"), g:U(1e-3,dim(0,1),"g"), mg:U(1e-6,dim(0,1),"mg"), lb:U(0.45359237,dim(0,1),"lb"),
  s:U(1,dim(0,0,1),"s"), ms:U(1e-3,dim(0,0,1),"ms"), min:U(60,dim(0,0,1),"min"), h:U(3600,dim(0,0,1),"h"), day:U(86400,dim(0,0,1),"day"),
  A:U(1,dim(0,0,0,1),"A"), K:U(1,dim(0,0,0,0,1),"K"), mol:U(1,dim(0,0,0,0,0,1),"mol"), cd:U(1,dim(0,0,0,0,0,0,1),"cd"),
  Hz:U(1,dim(0,0,-1),"Hz"),
  N:U(1,dim(1,1,-2),"N"), kN:U(1e3,dim(1,1,-2),"kN"),
  Pa:U(1,dim(-1,1,-2),"Pa"), kPa:U(1e3,dim(-1,1,-2),"kPa"), MPa:U(1e6,dim(-1,1,-2),"MPa"), bar:U(1e5,dim(-1,1,-2),"bar"), atm:U(101325,dim(-1,1,-2),"atm"), psi:U(6894.757293168,dim(-1,1,-2),"psi"),
  J:U(1,dim(2,1,-2),"J"), kJ:U(1e3,dim(2,1,-2),"kJ"), MJ:U(1e6,dim(2,1,-2),"MJ"), eV:U(1.602176634e-19,dim(2,1,-2),"eV"),
  W:U(1,dim(2,1,-3),"W"), kW:U(1e3,dim(2,1,-3),"kW"), MW:U(1e6,dim(2,1,-3),"MW"),
  C:U(1,dim(0,0,1,1),"C"), V:U(1,dim(2,1,-3,-1),"V"), ohm:U(1,dim(2,1,-3,-2),"ohm"), S:U(1,dim(-2,-1,3,2),"S"),
  F:U(1,dim(-2,-1,4,2),"F"), H:U(1,dim(2,1,-2,-2),"H"), Wb:U(1,dim(2,1,-2,-1),"Wb"), T:U(1,dim(0,1,-2,-1),"T"),
  lm:U(1,dim(0,0,0,0,0,0,1),"lm"), lx:U(1,dim(-2,0,0,0,0,0,1),"lx"),
  rad:U(1,dim(),"rad"), deg:U(Math.PI/180,dim(),"deg"),
  L:U(1e-3,dim(3),"L"), mL:U(1e-6,dim(3),"mL"),
  mph:U(0.44704,dim(1,0,-1),"mph"), knot:U(1852/3600,dim(1,0,-1),"knot")
});

const Q=(value,dims=dim())=>({value,dims});
const mulQ=(a,b)=>Q(a.value*b.value,addDim(a.dims,b.dims));
const divQ=(a,b)=>{if(b.value===0)throw new Error("DIVISION_BY_ZERO");return Q(a.value/b.value,subDim(a.dims,b.dims))};
const addQ=(a,b,sign=1)=>{if(!sameDim(a.dims,b.dims))throw new Error("DIMENSION_MISMATCH");return Q(a.value+sign*b.value,a.dims.slice())};
const powQ=(a,p)=>{if(!Number.isInteger(p)&&a.dims.some(v=>v!==0))throw new Error("NONINTEGER_DIMENSION_POWER");return Q(a.value**p,mulDim(a.dims,p))};

function tokenize(input){
  const s=String(input??"").replaceAll("×","*").replaceAll("÷","/").replaceAll("−","-");
  const out=[];let i=0;
  while(i<s.length){
    const c=s[i];
    if(/\s/.test(c)){i++;continue}
    if(/[0-9.]/.test(c)){
      const st=i++;while(/[0-9.]/.test(s[i]||""))i++;
      if(/[eE]/.test(s[i]||"")){i++;if(/[+-]/.test(s[i]||""))i++;const p=i;while(/[0-9]/.test(s[i]||""))i++;if(i===p)throw new Error("INVALID_EXPRESSION")}
      const raw=s.slice(st,i),v=Number(raw);if(!Number.isFinite(v))throw new Error("INVALID_EXPRESSION");
      out.push({t:"num",v});continue;
    }
    if(/[A-Za-z]/.test(c)){
      const st=i++;while(/[A-Za-z0-9]/.test(s[i]||""))i++;
      out.push({t:"id",v:s.slice(st,i)});continue;
    }
    if("+-*/^".includes(c)){out.push({t:"op",v:c});i++;continue}
    if("()".includes(c)){out.push({t:c});i++;continue}
    throw new Error("INVALID_EXPRESSION");
  }
  out.push({t:"eof"});return out;
}
class Parser{
  constructor(source){this.ts=tokenize(source);this.p=0}
  peek(){return this.ts[this.p]}
  take(){return this.ts[this.p++]}
  parse(){const q=this.add();if(this.peek().t!=="eof")throw new Error("INVALID_EXPRESSION");return q}
  add(){let q=this.mul();while(this.peek().t==="op"&&["+","-"].includes(this.peek().v)){const op=this.take().v,r=this.mul();q=addQ(q,r,op==="+"?1:-1)}return q}
  start(t){return t==="num"||t==="id"||t==="("}
  mul(){let q=this.power();while(true){if(this.peek().t==="op"&&["*","/"].includes(this.peek().v)){const op=this.take().v,r=this.power();q=op==="*"?mulQ(q,r):divQ(q,r);continue}if(this.start(this.peek().t)){q=mulQ(q,this.power());continue}break}return q}
  power(){let q=this.unary();if(this.peek().t==="op"&&this.peek().v==="^"){this.take();const p=this.unary();if(p.dims.some(v=>v!==0))throw new Error("DIMENSIONAL_EXPONENT");q=powQ(q,p.value)}return q}
  unary(){if(this.peek().t==="op"&&["+","-"].includes(this.peek().v)){const op=this.take().v,q=this.unary();return op==="-"?Q(-q.value,q.dims):q}return this.primary()}
  primary(){
    const t=this.take();
    if(t.t==="num")return Q(t.v);
    if(t.t==="("){const q=this.add();if(this.take().t!==")")throw new Error("INVALID_EXPRESSION");return q}
    if(t.t==="id"){
      const u=SCIENTIFIC_UNITS[t.v];if(!u)throw new Error("UNKNOWN_UNIT");
      return Q(u.factor,u.dims.slice());
    }
    throw new Error("INVALID_EXPRESSION");
  }
}
export function dimensionSignature(dims){
  const parts=[];for(let i=0;i<DIMS.length;i++)if(dims[i])parts.push(DIMS[i]+(dims[i]===1?"":`^${dims[i]}`));
  return parts.join(" ")||"1";
}
export function evaluateQuantityExpression(source){
  try{
    const q=new Parser(source).parse();
    if(!Number.isFinite(q.value))return{kind:"error",code:"DOMAIN_ERROR"};
    return{kind:"quantity",siValue:q.value,dims:q.dims,dimension:dimensionSignature(q.dims)};
  }catch(e){return{kind:"error",code:e?.message||"INVALID_EXPRESSION"}}
}
export function convertQuantity(quantity,targetUnit){
  if(quantity?.kind!=="quantity")return{kind:"error",code:"INVALID_QUANTITY"};
  const u=SCIENTIFIC_UNITS[targetUnit];if(!u)return{kind:"error",code:"UNKNOWN_UNIT"};
  if(!sameDim(quantity.dims,u.dims))return{kind:"error",code:"DIMENSION_MISMATCH"};
  return{kind:"quantity-conversion",value:quantity.siValue/u.factor,unit:targetUnit,dimension:dimensionSignature(quantity.dims)};
}
export function evaluateAndConvertQuantity(source,targetUnit){
  const q=evaluateQuantityExpression(source);return q.kind==="error"?q:convertQuantity(q,targetUnit);
}
