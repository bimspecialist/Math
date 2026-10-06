const gcd=(a,b)=>{a=a<0n?-a:a;b=b<0n?-b:b;while(b){[a,b]=[b,a%b]}return a||1n};
const norm=(n,d)=>{if(d===0n)throw new Error("DIVISION_BY_ZERO");if(d<0n){n=-n;d=-d}const g=gcd(n,d);return{n:n/g,d:d/g}};
const add=(a,b)=>norm(a.n*b.d+b.n*a.d,a.d*b.d);
const sub=(a,b)=>norm(a.n*b.d-b.n*a.d,a.d*b.d);
const mul=(a,b)=>norm(a.n*b.n,a.d*b.d);
const div=(a,b)=>norm(a.n*b.d,a.d*b.n);
const pow=(a,p)=>{if(!Number.isInteger(p))throw new Error("INTEGER_POWER_REQUIRED");if(p===0)return{n:1n,d:1n};if(p<0){const r=pow(a,-p);return norm(r.d,r.n)}let n=1n,d=1n,bn=a.n,bd=a.d,e=BigInt(p);while(e){if(e&1n){n*=bn;d*=bd}bn*=bn;bd*=bd;e>>=1n}return norm(n,d)};
function fromDecimal(raw){
  let s=String(raw).trim(),sign=1n;if(s.startsWith("-")){sign=-1n;s=s.slice(1)}else if(s.startsWith("+"))s=s.slice(1);
  const m=s.match(/^(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/);if(!m)throw new Error("INVALID_NUMBER");
  const whole=m[1]||"0",frac=m[2]||"",exp=Number(m[3]||0);
  let digits=(whole+frac).replace(/^0+(?=\d)/,"")||"0",scale=frac.length-exp;
  let n=BigInt(digits)*sign,d=1n;
  if(scale>0)d=10n**BigInt(scale);else if(scale<0)n*=10n**BigInt(-scale);
  return norm(n,d);
}
function tokenize(source){
  const s=String(source??"").replaceAll("×","*").replaceAll("÷","/").replaceAll("−","-");
  const out=[];let i=0;
  while(i<s.length){
    const c=s[i];if(/\s/.test(c)){i++;continue}
    if(/[0-9.]/.test(c)){
      const st=i++;while(/[0-9.]/.test(s[i]||""))i++;
      if(/[eE]/.test(s[i]||"")){i++;if(/[+-]/.test(s[i]||""))i++;while(/[0-9]/.test(s[i]||""))i++}
      out.push({t:"num",v:s.slice(st,i)});continue;
    }
    if("+-*/^".includes(c)){out.push({t:"op",v:c});i++;continue}
    if("()".includes(c)){out.push({t:c});i++;continue}
    throw new Error("INVALID_EXPRESSION");
  }
  out.push({t:"eof"});return out;
}
class Parser{
  constructor(source){this.ts=tokenize(source);this.p=0}
  peek(){return this.ts[this.p]} take(){return this.ts[this.p++]}
  parse(){const v=this.add();if(this.peek().t!=="eof")throw new Error("INVALID_EXPRESSION");return v}
  add(){let v=this.mul();while(this.peek().t==="op"&&["+","-"].includes(this.peek().v)){const op=this.take().v,r=this.mul();v=op==="+"?add(v,r):sub(v,r)}return v}
  mul(){let v=this.unary();while(this.peek().t==="op"&&["*","/"].includes(this.peek().v)){const op=this.take().v,r=this.unary();v=op==="*"?mul(v,r):div(v,r)}return v}
  unary(){if(this.peek().t==="op"&&["+","-"].includes(this.peek().v)){const op=this.take().v,v=this.unary();return op==="-"?{n:-v.n,d:v.d}:v}return this.power()}
  power(){let v=this.primary();if(this.peek().t==="op"&&this.peek().v==="^"){this.take();const p=this.unary();if(p.d!==1n)throw new Error("INTEGER_POWER_REQUIRED");const pn=Number(p.n);if(!Number.isSafeInteger(pn))throw new Error("POWER_TOO_LARGE");v=pow(v,pn)}return v}
  primary(){const t=this.take();if(t.t==="num")return fromDecimal(t.v);if(t.t==="("){const v=this.add();if(this.take().t!==")")throw new Error("INVALID_EXPRESSION");return v}throw new Error("INVALID_EXPRESSION")}
}
export function rationalToDecimal(r,digits=50){
  digits=Math.max(1,Math.min(1000,Math.trunc(Number(digits)||50)));
  const sign=r.n<0n?"-":"",n=r.n<0n?-r.n:r.n,whole=n/r.d;let rem=n%r.d;
  if(rem===0n)return sign+whole.toString();
  let frac="";
  for(let i=0;i<digits;i++){rem*=10n;frac+=(rem/r.d).toString();rem%=r.d;if(rem===0n)break}
  return sign+whole.toString()+"."+frac+(rem!==0n?"…":"");
}
export function evaluateExactExpression(source,{digits=50}={}){
  const precision=Number(digits);
  if(!Number.isInteger(precision)||precision<1||precision>1000)return{kind:"error",code:"INVALID_PRECISION"};
  try{const r=new Parser(source).parse();return{kind:"exact",numerator:r.n.toString(),denominator:r.d.toString(),fraction:r.d===1n?r.n.toString():`${r.n}/${r.d}`,decimal:rationalToDecimal(r,precision),digits:precision}}
  catch(e){return{kind:"error",code:e?.message||"INVALID_EXPRESSION"}}
}
