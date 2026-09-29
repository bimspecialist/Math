const BASES=new Set([2,8,10,16]);
export function parseInteger(text,base=10){
  base=Number(base);if(!BASES.has(base))throw new Error("UNSUPPORTED_BASE");
  const s=String(text??"").trim().replaceAll("_","");
  if(!s)throw new Error("EMPTY_INPUT");
  const neg=s.startsWith("-"),body=neg?s.slice(1):s;
  const valid=base===2?/^[01]+$/i:base===8?/^[0-7]+$/i:base===10?/^[0-9]+$/i:/^[0-9a-f]+$/i;
  if(!valid.test(body))throw new Error("INVALID_INTEGER");
  let n=0n;const chars=body.toLowerCase();
  for(const ch of chars){const d=BigInt(parseInt(ch,16));if(d>=BigInt(base))throw new Error("INVALID_INTEGER");n=n*BigInt(base)+d}
  return neg?-n:n;
}
export function formatInteger(value,base=10){
  base=Number(base);if(!BASES.has(base))throw new Error("UNSUPPORTED_BASE");
  return BigInt(value).toString(base).toUpperCase();
}
export function bitwise(op,a,b=0n,{wordSize=64}={}){
  a=BigInt(a);b=BigInt(b);
  switch(op){
    case"and":return a&b;
    case"or":return a|b;
    case"xor":return a^b;
    case"shl":return a<<b;
    case"shr":return a>>b;
    case"not":{
      const bits=BigInt(wordSize),mask=(1n<<bits)-1n;
      return (~a)&mask;
    }
    default:throw new Error("UNSUPPORTED_OPERATION");
  }
}
export function describeInteger(value){
  const n=BigInt(value);
  return{bin:formatInteger(n,2),oct:formatInteger(n,8),dec:formatInteger(n,10),hex:formatInteger(n,16)};
}
