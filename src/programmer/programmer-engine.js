const BASES=new Set([2,8,10,16]);
const WORD_SIZES=new Set([8,16,32,64]);

function validWordSize(wordSize){
  const n=Number(wordSize);
  if(!WORD_SIZES.has(n))throw new Error("UNSUPPORTED_WORD_SIZE");
  return n;
}

function stripPrefix(body,base){
  if(base===16&&/^0x/i.test(body))return body.slice(2);
  if(base===2&&/^0b/i.test(body))return body.slice(2);
  if(base===8&&/^0o/i.test(body))return body.slice(2);
  return body;
}

export function parseInteger(text,base=10){
  base=Number(base);if(!BASES.has(base))throw new Error("UNSUPPORTED_BASE");
  let s=String(text??"").trim().replaceAll("_","");
  if(!s)throw new Error("EMPTY_INPUT");
  const neg=s.startsWith("-");if(neg)s=s.slice(1);
  s=stripPrefix(s,base);
  if(!s)throw new Error("INVALID_INTEGER");
  const valid=base===2?/^[01]+$/i:base===8?/^[0-7]+$/i:base===10?/^[0-9]+$/i:/^[0-9a-f]+$/i;
  if(!valid.test(s))throw new Error("INVALID_INTEGER");
  let n=0n;const chars=s.toLowerCase();
  for(const ch of chars){const d=BigInt(parseInt(ch,16));if(d>=BigInt(base))throw new Error("INVALID_INTEGER");n=n*BigInt(base)+d}
  return neg?-n:n;
}

export function formatInteger(value,base=10){
  base=Number(base);if(!BASES.has(base))throw new Error("UNSUPPORTED_BASE");
  return BigInt(value).toString(base).toUpperCase();
}

export function wordMask(wordSize=64){
  const bits=BigInt(validWordSize(wordSize));
  return(1n<<bits)-1n;
}

export function toUnsignedWord(value,wordSize=64){
  const mask=wordMask(wordSize);
  return BigInt(value)&mask;
}

export function toSignedWord(value,wordSize=64){
  const size=validWordSize(wordSize),bits=BigInt(size),unsigned=toUnsignedWord(value,size);
  const signBit=1n<<(bits-1n);
  return unsigned&signBit?unsigned-(1n<<bits):unsigned;
}

function validateShift(value,wordSize){
  const shift=BigInt(value),size=BigInt(validWordSize(wordSize));
  if(shift<0n||shift>=size)throw new Error("INVALID_SHIFT");
  return shift;
}

export function bitwise(op,a,b=0n,{wordSize=64,signed=false}={}){
  const size=validWordSize(wordSize),mask=wordMask(size);
  const ua=toUnsignedWord(a,size),ub=toUnsignedWord(b,size);
  switch(op){
    case"and":return(ua&ub)&mask;
    case"or":return(ua|ub)&mask;
    case"xor":return(ua^ub)&mask;
    case"shl":{
      const shift=validateShift(b,size);
      return(ua<<shift)&mask;
    }
    case"shr":{
      const shift=validateShift(b,size);
      if(signed)return toUnsignedWord(toSignedWord(a,size)>>shift,size);
      return ua>>shift;
    }
    case"not":return(~ua)&mask;
    default:throw new Error("UNSUPPORTED_OPERATION");
  }
}

export function describeInteger(value,{wordSize=64}={}){
  const size=validWordSize(wordSize),unsigned=toUnsignedWord(value,size),signed=toSignedWord(unsigned,size);
  const bin=unsigned.toString(2).toUpperCase().padStart(size,"0");
  const hex=unsigned.toString(16).toUpperCase().padStart(Math.ceil(size/4),"0");
  const oct=unsigned.toString(8).toUpperCase().padStart(Math.ceil(size/3),"0");
  return{
    bin,
    oct,
    dec:signed.toString(10),
    signedDec:signed.toString(10),
    unsignedDec:unsigned.toString(10),
    hex
  };
}
