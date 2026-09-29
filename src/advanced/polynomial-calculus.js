const EPS=1e-12;
const clean=n=>Math.abs(n)<EPS?0:Number(n.toPrecision(14));

function add(a,b){
  const out=new Map(a);
  for(const [e,c] of b)out.set(e,clean((out.get(e)??0)+c));
  for(const [e,c] of [...out])if(Math.abs(c)<EPS)out.delete(e);
  return out;
}
function scale(a,k){return new Map([...a].map(([e,c])=>[e,clean(c*k)]).filter(([,c])=>Math.abs(c)>=EPS))}
function multiply(a,b){
  const out=new Map();
  for(const [ea,ca] of a)for(const [eb,cb] of b)out.set(ea+eb,clean((out.get(ea+eb)??0)+ca*cb));
  for(const [e,c] of [...out])if(Math.abs(c)<EPS)out.delete(e);
  return out;
}
function power(a,n){
  if(!Number.isInteger(n)||n<0||n>20)throw new Error("UNSUPPORTED_POLYNOMIAL_POWER");
  let out=new Map([[0,1]]),base=a;
  while(n){if(n&1)out=multiply(out,base);n>>=1;if(n)base=multiply(base,base)}
  return out;
}

function tokenize(source){
  const tokens=[];let i=0;
  while(i<source.length){
    const ch=source[i];
    if(/\s/.test(ch)){i++;continue}
    if(/[0-9.]/.test(ch)){
      let j=i+1;while(j<source.length&&/[0-9.]/.test(source[j]))j++;
      const raw=source.slice(i,j),value=Number(raw);
      if(!Number.isFinite(value)||!/^((\d+\.?\d*)|(\.\d+))$/.test(raw))throw new Error("INVALID_POLYNOMIAL");
      tokens.push({type:"number",value});i=j;continue;
    }
    if(/[A-Za-z]/.test(ch)){
      let j=i+1;while(j<source.length&&/[A-Za-z0-9_]/.test(source[j]))j++;
      tokens.push({type:"identifier",value:source.slice(i,j)});i=j;continue;
    }
    if("+-*^()".includes(ch)){tokens.push({type:ch,value:ch});i++;continue}
    throw new Error("INVALID_POLYNOMIAL");
  }
  return tokens;
}

export function parsePolynomial(source,variable="x"){
  const tokens=tokenize(String(source??""));let pos=0;
  const peek=()=>tokens[pos],take=type=>{const t=tokens[pos];if(!t||t.type!==type)throw new Error("INVALID_POLYNOMIAL");pos++;return t};

  function parseExpression(){
    let out=parseTerm();
    while(peek()?.type==="+"||peek()?.type==="-"){
      const op=tokens[pos++].type,rhs=parseTerm();
      out=add(out,op==="+"?rhs:scale(rhs,-1));
    }
    return out;
  }
  function startsPrimary(t){return t&&(t.type==="number"||t.type==="identifier"||t.type==="(")}
  function parseTerm(){
    let out=parseUnary();
    while(peek()?.type==="*"||startsPrimary(peek())){
      if(peek()?.type==="*")pos++;
      out=multiply(out,parseUnary());
    }
    return out;
  }
  function parseUnary(){
    if(peek()?.type==="+"){pos++;return parseUnary()}
    if(peek()?.type==="-"){pos++;return scale(parseUnary(),-1)}
    return parsePower();
  }
  function parsePower(){
    let out=parsePrimary();
    if(peek()?.type==="^"){
      pos++;const sign=peek()?.type==="-"?(pos++,-1):1;
      const n=take("number").value*sign;
      out=power(out,n);
    }
    return out;
  }
  function parsePrimary(){
    const t=peek();
    if(!t)throw new Error("INVALID_POLYNOMIAL");
    if(t.type==="number"){pos++;return new Map([[0,t.value]])}
    if(t.type==="identifier"){
      pos++;
      if(t.value!==variable)throw new Error("UNSUPPORTED_SYMBOL");
      return new Map([[1,1]]);
    }
    if(t.type==="("){pos++;const out=parseExpression();take(")");return out}
    throw new Error("INVALID_POLYNOMIAL");
  }

  const poly=parseExpression();
  if(pos!==tokens.length)throw new Error("INVALID_POLYNOMIAL");
  return poly;
}

export function differentiatePolynomial(poly){
  const out=new Map();
  for(const [e,c] of poly)if(e>0)out.set(e-1,clean(c*e));
  return out;
}
export function integratePolynomial(poly){
  const out=new Map();
  for(const [e,c] of poly)out.set(e+1,clean(c/(e+1)));
  return out;
}

function formatNumber(n){
  n=clean(n);
  if(Number.isInteger(n))return String(n);
  const s=String(n);
  return s;
}
export function formatPolynomial(poly,variable="x"){
  const terms=[...poly.entries()].filter(([,c])=>Math.abs(c)>=EPS).sort((a,b)=>b[0]-a[0]);
  if(!terms.length)return"0";
  return terms.map(([e,c],index)=>{
    const negative=c<0,abs=Math.abs(c);
    let body;
    if(e===0)body=formatNumber(abs);
    else{
      const coeff=Math.abs(abs-1)<EPS?"":formatNumber(abs)+"*";
      body=coeff+variable+(e===1?"":"^"+e);
    }
    if(index===0)return negative?"-"+body:body;
    return (negative?" - ":" + ")+body;
  }).join("");
}

export function runPolynomialCalculus(operation,source,variable="x"){
  try{
    const poly=parsePolynomial(source,variable);
    if(operation==="derivative")return formatPolynomial(differentiatePolynomial(poly),variable);
    if(operation==="integral")return formatPolynomial(integratePolynomial(poly),variable)+" + C";
    throw new Error("UNSUPPORTED_OPERATION");
  }catch{
    return null;
  }
}
