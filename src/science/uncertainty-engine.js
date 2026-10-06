const sq=x=>x*x;
const finite=(x,code="INVALID_VALUE")=>{x=Number(x);if(!Number.isFinite(x))throw new Error(code);return x};
const M=(value,uncertainty=0)=>({value:finite(value),uncertainty:Math.abs(finite(uncertainty))});
export function measurement(value,uncertainty=0){return M(value,uncertainty)}
export function addMeasurements(a,b,correlation=0){
  a=M(a.value,a.uncertainty);b=M(b.value,b.uncertainty);correlation=finite(correlation);
  if(Math.abs(correlation)>1)throw new Error("INVALID_CORRELATION");
  return M(a.value+b.value,Math.sqrt(Math.max(0,sq(a.uncertainty)+sq(b.uncertainty)+2*correlation*a.uncertainty*b.uncertainty)));
}
export function subtractMeasurements(a,b,correlation=0){
  a=M(a.value,a.uncertainty);b=M(b.value,b.uncertainty);correlation=finite(correlation);
  if(Math.abs(correlation)>1)throw new Error("INVALID_CORRELATION");
  return M(a.value-b.value,Math.sqrt(Math.max(0,sq(a.uncertainty)+sq(b.uncertainty)-2*correlation*a.uncertainty*b.uncertainty)));
}
export function multiplyMeasurements(a,b,correlation=0){
  a=M(a.value,a.uncertainty);b=M(b.value,b.uncertainty);correlation=finite(correlation);
  if(Math.abs(correlation)>1)throw new Error("INVALID_CORRELATION");
  const value=a.value*b.value;
  const t1=b.value*a.uncertainty,t2=a.value*b.uncertainty;
  return M(value,Math.sqrt(Math.max(0,sq(t1)+sq(t2)+2*correlation*t1*t2)));
}
export function divideMeasurements(a,b,correlation=0){
  a=M(a.value,a.uncertainty);b=M(b.value,b.uncertainty);correlation=finite(correlation);
  if(b.value===0)throw new Error("DIVISION_BY_ZERO");
  if(Math.abs(correlation)>1)throw new Error("INVALID_CORRELATION");
  const value=a.value/b.value,da=1/b.value,db=-a.value/(b.value*b.value);
  return M(value,Math.sqrt(Math.max(0,sq(da*a.uncertainty)+sq(db*b.uncertainty)+2*correlation*da*db*a.uncertainty*b.uncertainty)));
}
export function powerMeasurement(a,p){
  a=M(a.value,a.uncertainty);p=finite(p);
  const value=a.value**p;if(!Number.isFinite(value))throw new Error("DOMAIN_ERROR");
  const derivative=p===0?0:p*(a.value**(p-1));
  return M(value,Math.abs(derivative)*a.uncertainty);
}
export function unaryMeasurement(a,fn){
  a=M(a.value,a.uncertainty);fn=String(fn).toLowerCase();
  let value,derivative;
  switch(fn){
    case"sin":value=Math.sin(a.value);derivative=Math.cos(a.value);break;
    case"cos":value=Math.cos(a.value);derivative=-Math.sin(a.value);break;
    case"tan":value=Math.tan(a.value);derivative=1/sq(Math.cos(a.value));break;
    case"exp":value=Math.exp(a.value);derivative=value;break;
    case"ln":if(a.value<=0)throw new Error("DOMAIN_ERROR");value=Math.log(a.value);derivative=1/a.value;break;
    case"log10":if(a.value<=0)throw new Error("DOMAIN_ERROR");value=Math.log10(a.value);derivative=1/(a.value*Math.LN10);break;
    case"sqrt":if(a.value<0)throw new Error("DOMAIN_ERROR");value=Math.sqrt(a.value);derivative=value===0?Infinity:1/(2*value);break;
    default:throw new Error("UNSUPPORTED_OPERATION");
  }
  if(!Number.isFinite(value)||!Number.isFinite(derivative))throw new Error("DOMAIN_ERROR");
  return M(value,Math.abs(derivative)*a.uncertainty);
}
export function propagateIndependent(fn,variables){
  if(typeof fn!=="function"||!Array.isArray(variables)||!variables.length)throw new Error("INVALID_INPUT");
  const xs=variables.map(v=>M(v.value,v.uncertainty)),base=fn(xs.map(v=>v.value));
  if(!Number.isFinite(base))throw new Error("DOMAIN_ERROR");
  let variance=0;
  for(let i=0;i<xs.length;i++){
    const x=xs[i],h=Math.cbrt(Number.EPSILON)*Math.max(1,Math.abs(x.value));
    const p=xs.map(v=>v.value),m=p.slice();p[i]+=h;m[i]-=h;
    const fp=fn(p),fm=fn(m);if(!Number.isFinite(fp)||!Number.isFinite(fm))throw new Error("DOMAIN_ERROR");
    const derivative=(fp-fm)/(2*h);variance+=sq(derivative*x.uncertainty);
  }
  return M(base,Math.sqrt(variance));
}
export function significantFigures(value,digits=3){
  value=finite(value);digits=Math.max(1,Math.min(15,Math.trunc(Number(digits)||3)));
  if(value===0)return"0";
  return Number(value.toPrecision(digits)).toString();
}
export function formatMeasurement(m,{uncertaintyDigits=2}={}){
  m=M(m.value,m.uncertainty);uncertaintyDigits=Math.max(1,Math.min(5,Math.trunc(Number(uncertaintyDigits)||2)));
  if(m.uncertainty===0)return String(m.value);
  const exponent=Math.floor(Math.log10(m.uncertainty)),places=Math.max(0,-exponent+uncertaintyDigits-1),scale=10**places;
  const u=Math.round(m.uncertainty*scale)/scale,v=Math.round(m.value*scale)/scale;
  return`${v} ± ${u}`;
}
