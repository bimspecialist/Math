import { evaluateExpression } from "../calculator/math-engine.js";

const clone=v=>Array.isArray(v)?v.map(clone):(v&&typeof v==="object"?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,clone(x)])):v);
const isMatrix=v=>Array.isArray(v)&&v.every(Array.isArray);
const isComplex=v=>Boolean(v&&typeof v==="object"&&v.__mathlabComplex===true);
const complex=(re=0,im=0)=>({__mathlabComplex:true,re:Number(re),im:Number(im)});
const toComplex=value=>isComplex(value)?value:complex(Number(value),0);
function normalizeScalar(value){
  if(isComplex(value)){
    const re=Math.abs(value.re)<1e-12?0:Number(value.re.toPrecision(14));
    const im=Math.abs(value.im)<1e-12?0:Number(value.im.toPrecision(14));
    return im===0?re:complex(re,im);
  }
  return Object.is(value,-0)?0:value;
}
function scalarAdd(a,b){a=toComplex(a);b=toComplex(b);return normalizeScalar(complex(a.re+b.re,a.im+b.im))}
function scalarSub(a,b){a=toComplex(a);b=toComplex(b);return normalizeScalar(complex(a.re-b.re,a.im-b.im))}
function scalarMul(a,b){a=toComplex(a);b=toComplex(b);return normalizeScalar(complex(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re))}
function scalarDiv(a,b){
  a=toComplex(a);b=toComplex(b);const d=b.re*b.re+b.im*b.im;
  if(d===0)throw new Error("DIVISION_BY_ZERO");
  return normalizeScalar(complex((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d));
}
function scalarAbs(value){const z=toComplex(value);return Math.hypot(z.re,z.im)}
function scalarConj(value){const z=toComplex(value);return normalizeScalar(complex(z.re,-z.im))}
function scalarAngle(value){const z=toComplex(value);return Math.atan2(z.im,z.re)}
function scalarExp(value){const z=toComplex(value),e=Math.exp(z.re);return normalizeScalar(complex(e*Math.cos(z.im),e*Math.sin(z.im)))}
function scalarLog(value){
  const z=toComplex(value),m=Math.hypot(z.re,z.im);
  if(m===0)throw new Error("DOMAIN_ERROR");
  return normalizeScalar(complex(Math.log(m),Math.atan2(z.im,z.re)));
}
function scalarPow(a,b){
  if(!isComplex(a)&&!isComplex(b)&&a>=0)return a**b;
  const base=toComplex(a),expn=toComplex(b);
  const logged=toComplex(scalarLog(base));
  return scalarExp(complex(expn.re*logged.re-expn.im*logged.im,expn.re*logged.im+expn.im*logged.re));
}
function scalarSqrt(value){return scalarPow(value,0.5)}
function scalarSin(value){
  const z=toComplex(value);
  return normalizeScalar(complex(Math.sin(z.re)*Math.cosh(z.im),Math.cos(z.re)*Math.sinh(z.im)));
}
function scalarCos(value){
  const z=toComplex(value);
  return normalizeScalar(complex(Math.cos(z.re)*Math.cosh(z.im),-Math.sin(z.re)*Math.sinh(z.im)));
}
const MAX_RANGE_ITEMS=10000;
const MAX_LOOP_ITERATIONS=10000;
const scopeMetadata=new WeakMap();
function cloneRecord(record={}){
  const out={};for(const [key,value] of Object.entries(record))out[key]=clone(value);return out;
}
function normalizeRuntimeState(state={}){
  const persistents={};
  for(const [fn,values] of Object.entries(state.persistents??{}))persistents[fn]=cloneRecord(values);
  return{globals:cloneRecord(state.globals??{}),persistents};
}
function scopeFor(workspace){return scopeMetadata.get(workspace)}
function syncGlobalsIntoWorkspace(workspace){
  const meta=scopeFor(workspace);if(!meta)return;
  for(const name of meta.globalNames)if(Object.prototype.hasOwnProperty.call(meta.runtimeState.globals,name))workspace[name]=clone(meta.runtimeState.globals[name]);
}
function syncScopeState(workspace){
  const meta=scopeFor(workspace);if(!meta)return;
  for(const name of meta.globalNames)if(Object.prototype.hasOwnProperty.call(workspace,name))meta.runtimeState.globals[name]=clone(workspace[name]);
  if(meta.currentFunction){
    const bucket=meta.runtimeState.persistents[meta.currentFunction]??={};
    for(const name of meta.persistentNames)if(Object.prototype.hasOwnProperty.call(workspace,name))bucket[name]=clone(workspace[name]);
  }
}

function stripOuterParens(source){
  let text=String(source??"").trim();
  while(text.startsWith("(")&&text.endsWith(")")){
    let depth=0,wraps=true;
    for(let i=0;i<text.length;i++){
      if(text[i]==="(")depth++;
      else if(text[i]===")")depth--;
      if(depth===0&&i<text.length-1){wraps=false;break}
      if(depth<0){wraps=false;break}
    }
    if(!wraps||depth!==0)break;
    text=text.slice(1,-1).trim();
  }
  return text;
}

function splitTopLevel(source,separator){
  const out=[];let current="",depth=0;
  for(const ch of String(source)){
    if(ch==="["||ch==="(")depth++;
    if(ch==="]"||ch===")")depth--;
    if(ch===separator&&depth===0){out.push(current.trim());current="";continue}
    current+=ch;
  }
  out.push(current.trim());
  return out;
}

function numericExpression(source,workspace){
  let s=String(source).trim();
  const names=Object.keys(workspace).sort((a,b)=>b.length-a.length);
  for(const name of names){
    const value=workspace[name];
    if(typeof value!=="number")continue;
    s=s.replace(new RegExp("\\b"+name+"\\b","g"),`(${value})`);
  }
  const ans=typeof workspace.ans==="number"?String(workspace.ans):"0";
  const r=evaluateExpression(s,{angleMode:"RAD",ans});
  if(r.kind!=="value")throw new Error(r.code||"INVALID_EXPRESSION");
  return r.numeric;
}

function colonValues(source,workspace){
  const text=stripOuterParens(source);
  const parts=splitTopLevel(text,":");
  if(parts.length<2||parts.length>3||parts.some(x=>!x))return null;
  const start=numericExpression(parts[0],workspace);
  const step=parts.length===3?numericExpression(parts[1],workspace):1;
  const end=numericExpression(parts.at(-1),workspace);
  if(![start,step,end].every(Number.isFinite))throw new Error("INVALID_RANGE");
  if(step===0)throw new Error("ZERO_RANGE_STEP");
  const values=[];
  const tolerance=Math.max(1,Math.abs(start),Math.abs(end))*1e-12;
  if(step>0){
    for(let value=start;value<=end+tolerance;value+=step){
      if(values.length>=MAX_RANGE_ITEMS)throw new Error("RANGE_TOO_LARGE");
      values.push(Math.abs(value)<1e-12?0:Number(value.toPrecision(14)));
    }
  }else{
    for(let value=start;value>=end-tolerance;value+=step){
      if(values.length>=MAX_RANGE_ITEMS)throw new Error("RANGE_TOO_LARGE");
      values.push(Math.abs(value)<1e-12?0:Number(value.toPrecision(14)));
    }
  }
  return values;
}

function splitMatrixRowTokens(source){
  const out=[];let current="",depth=0;
  const push=()=>{if(current.trim()){out.push(current.trim());current=""}};
  for(let i=0;i<source.length;i++){
    const ch=source[i];
    if(ch==="["||ch==="(")depth++;
    else if(ch==="]"||ch===")")depth--;
    if(depth===0&&(ch===","||/\s/.test(ch))){push();continue}
    current+=ch;
  }
  push();
  return out;
}
function asConcatMatrix(value){
  if(typeof value==="number"||isComplex(value))return[[clone(value)]];
  if(isMatrix(value))return clone(value);
  if(Array.isArray(value))return[value.slice()];
  throw new Error("INVALID_MATRIX");
}
function horizontalConcat(parts){
  if(!parts.length)throw new Error("INVALID_MATRIX");
  const rows=parts[0].length;
  if(parts.some(p=>p.length!==rows))throw new Error("CONCAT_DIMENSION_MISMATCH");
  return Array.from({length:rows},(_,r)=>parts.flatMap(p=>p[r]));
}
function parseMatrix(source,workspace,functions={}){
  const inner=source.trim().slice(1,-1).trim();
  if(!inner)return[];
  const rowGroups=splitTopLevel(inner,";").filter(Boolean).map(group=>{
    const tokens=splitMatrixRowTokens(group);
    if(!tokens.length)throw new Error("INVALID_MATRIX");
    const blocks=tokens.map(token=>{
      const range=colonValues(token,workspace);
      if(range)return[range];
      return asConcatMatrix(evalValue(token,workspace,functions));
    });
    return horizontalConcat(blocks);
  });
  const width=rowGroups[0]?.[0]?.length??0;
  if(!width||rowGroups.some(group=>group.some(row=>row.length!==width)))throw new Error("CONCAT_DIMENSION_MISMATCH");
  return rowGroups.flat();
}

function determinant(m){
  if(!isMatrix(m)||m.length===0||m.some(r=>r.length!==m.length))throw new Error("SQUARE_MATRIX_REQUIRED");
  if(m.length===1)return m[0][0];
  if(m.length===2)return m[0][0]*m[1][1]-m[0][1]*m[1][0];
  return m[0].reduce((sum,v,col)=>{
    const minor=m.slice(1).map(row=>row.filter((_,j)=>j!==col));
    return sum+(col%2? -1:1)*v*determinant(minor);
  },0);
}

const transpose=m=>{
  if(!isMatrix(m)||!m.length)return[];
  return m[0].map((_,c)=>m.map(r=>r[c]));
};

const flatten=value=>Array.isArray(value)?(isMatrix(value)?value.flat():value.slice()):[value];

function splitArgs(source){
  const out=[];let current="",depth=0;
  for(const ch of source){
    if(ch==="["||ch==="(")depth++;
    if(ch==="]"||ch===")")depth--;
    if(ch===","&&depth===0){out.push(current.trim());current="";continue}
    current+=ch;
  }
  if(current.trim()||source.trim()==="")out.push(current.trim());
  return out.filter(x=>x.length);
}

function matrixShape(m){
  if(!isMatrix(m)||!m.length||!m[0]?.length)throw new Error("INVALID_MATRIX");
  const cols=m[0].length;if(m.some(r=>r.length!==cols))throw new Error("INVALID_MATRIX");
  return[m.length,cols];
}

function matrixMultiply(a,b){
  const [ar,ac]=matrixShape(a),[br,bc]=matrixShape(b);
  if(ac!==br)throw new Error("MATRIX_DIMENSION_MISMATCH");
  return Array.from({length:ar},(_,i)=>Array.from({length:bc},(_,j)=>{
    let sum=0;for(let k=0;k<ac;k++)sum=scalarAdd(sum,scalarMul(a[i][k],b[k][j]));return normalizeScalar(sum);
  }));
}
function sameShape(a,b){
  const [ar,ac]=matrixShape(a),[br,bc]=matrixShape(b);
  return ar===br&&ac===bc;
}
function mapMatrix(m,fn){return m.map((row,r)=>row.map((value,c)=>fn(value,r,c)))}
function matrixElementwise(a,b,fn){
  const scalarA=typeof a==="number"||isComplex(a),scalarB=typeof b==="number"||isComplex(b);
  if(scalarA&&scalarB)return normalizeScalar(fn(a,b));
  if(scalarA&&isMatrix(b))return mapMatrix(b,v=>normalizeScalar(fn(a,v)));
  if(isMatrix(a)&&scalarB)return mapMatrix(a,v=>normalizeScalar(fn(v,b)));
  if(isMatrix(a)&&isMatrix(b)){
    const [ar,ac]=matrixShape(a),[br,bc]=matrixShape(b);
    if((ar!==br&&ar!==1&&br!==1)||(ac!==bc&&ac!==1&&bc!==1))throw new Error("MATRIX_DIMENSION_MISMATCH");
    const rows=Math.max(ar,br),cols=Math.max(ac,bc);
    return Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>{
      const av=a[ar===1?0:r][ac===1?0:c],bv=b[br===1?0:r][bc===1?0:c];
      return normalizeScalar(fn(av,bv));
    }));
  }
  throw new Error("INVALID_MATRIX_OPERATION");
}
function matrixAdd(a,b){return matrixElementwise(a,b,scalarAdd)}
function matrixSubtract(a,b){return matrixElementwise(a,b,scalarSub)}
function matrixScale(m,k){return mapMatrix(m,v=>scalarMul(v,k))}
function matrixPower(m,power){
  const [rows,cols]=matrixShape(m);
  if(rows!==cols)throw new Error("SQUARE_MATRIX_REQUIRED");
  if(!Number.isInteger(power))throw new Error("INTEGER_MATRIX_POWER_REQUIRED");
  if(power===0)return identity(rows);
  if(power<0)return matrixPower(inverse(m),-power);
  let result=identity(rows),base=clone(m),n=power;
  while(n>0){
    if(n%2===1)result=matrixMultiply(result,base);
    n=Math.floor(n/2);
    if(n>0)base=matrixMultiply(base,base);
  }
  return result;
}
function matrixRightDivide(a,b){
  const scalarA=typeof a==="number"||isComplex(a),scalarB=typeof b==="number"||isComplex(b);
  if(scalarA&&scalarB)return scalarDiv(a,b);
  if(isMatrix(a)&&scalarB)return matrixScale(a,scalarDiv(1,b));
  if(scalarA&&isMatrix(b))return matrixScale(inverse(b),a);
  if(isMatrix(a)&&isMatrix(b))return matrixMultiply(a,inverse(b));
  throw new Error("INVALID_MATRIX_OPERATION");
}
function scalarTruth(value){
  if(typeof value!=="number"||!Number.isFinite(value))throw new Error("SCALAR_LOGICAL_REQUIRED");
  return value!==0;
}
function comparisonValue(op,a,b){
  if(op==="==")return a===b?1:0;
  if(op==="~=")return a!==b?1:0;
  if(op==="<")return a<b?1:0;
  if(op==="<=")return a<=b?1:0;
  if(op===">")return a>b?1:0;
  if(op===">=")return a>=b?1:0;
  if(op==="&")return (a!==0&&b!==0)?1:0;
  if(op==="|")return (a!==0||b!==0)?1:0;
  throw new Error("INVALID_LOGICAL_OPERATION");
}
function binaryLogicalOperation(op,left,right){
  if(op==="&&")return scalarTruth(left)&&scalarTruth(right)?1:0;
  if(op==="||")return scalarTruth(left)||scalarTruth(right)?1:0;
  if(typeof left==="number"&&typeof right==="number")return comparisonValue(op,left,right);
  return matrixElementwise(left,right,(a,b)=>comparisonValue(op,a,b));
}
function binaryArrayOperation(op,left,right){
  if(op==="+")return matrixAdd(left,right);
  if(op==="-")return matrixSubtract(left,right);
  if(op===".*")return matrixElementwise(left,right,scalarMul);
  if(op==="./")return matrixElementwise(left,right,scalarDiv);
  if(op===".^")return matrixElementwise(left,right,scalarPow);
  if(op==="*"){
    const scalarLeft=typeof left==="number"||isComplex(left),scalarRight=typeof right==="number"||isComplex(right);
    if(scalarLeft&&scalarRight)return scalarMul(left,right);
    if(scalarLeft&&isMatrix(right))return matrixScale(right,left);
    if(isMatrix(left)&&scalarRight)return matrixScale(left,right);
    if(isMatrix(left)&&isMatrix(right))return matrixMultiply(left,right);
  }
  if(op==="/")return matrixRightDivide(left,right);
  if(op==="\\")return matrixLeftDivide(left,right);
  if(op==="^"){
    if((typeof left==="number"||isComplex(left))&&(typeof right==="number"||isComplex(right)))return scalarPow(left,right);
    if(isMatrix(left)&&typeof right==="number")return matrixPower(left,right);
    throw new Error("INVALID_MATRIX_POWER");
  }
  throw new Error("INVALID_MATRIX_OPERATION");
}
function stripTranspose(source){
  const text=String(source).trim();
  if(text.endsWith(".'"))return{source:text.slice(0,-2).trim(),transpose:true};
  if(text.endsWith("'"))return{source:text.slice(0,-1).trim(),transpose:true};
  return{source:text,transpose:false};
}
function findTopLevelOperator(source,operators){
  let depth=0;
  for(let i=source.length-1;i>=0;i--){
    const ch=source[i];
    if(ch==="]"||ch===")")depth++;
    else if(ch==="["||ch==="(")depth--;
    if(depth!==0)continue;
    for(const op of operators){
      const start=i-op.length+1;
      if(start<0)continue;
      if(source.slice(start,i+1)!==op)continue;
      if(op==="+"||op==="-"){
        if(start===0)continue;
        const before=source.slice(0,start).trimEnd();
        const previous=before.at(-1)??"";
        if(!previous||"([,:+-*/^".includes(previous))continue;
        if(/[eE]$/.test(before))continue;
      }
      return{index:start,op};
    }
  }
  return null;
}

function inverse(m){
  const [rows,cols]=matrixShape(m);if(rows!==cols)throw new Error("SQUARE_MATRIX_REQUIRED");
  const n=rows,a=m.map((row,i)=>[...row,...Array.from({length:n},(_,j)=>i===j?1:0)]);
  for(let col=0;col<n;col++){
    let pivot=col;
    for(let r=col+1;r<n;r++)if(Math.abs(a[r][col])>Math.abs(a[pivot][col]))pivot=r;
    if(Math.abs(a[pivot][col])<1e-12)throw new Error("SINGULAR_MATRIX");
    [a[col],a[pivot]]=[a[pivot],a[col]];
    const div=a[col][col];for(let j=0;j<2*n;j++)a[col][j]/=div;
    for(let r=0;r<n;r++){
      if(r===col)continue;
      const factor=a[r][col];
      for(let j=0;j<2*n;j++)a[r][j]-=factor*a[col][j];
    }
  }
  return a.map(row=>row.slice(n).map(v=>Math.abs(v)<1e-12?0:Number(v.toPrecision(14))));
}

function trace(m){
  const [rows,cols]=matrixShape(m);if(rows!==cols)throw new Error("SQUARE_MATRIX_REQUIRED");
  return m.reduce((sum,row,i)=>sum+row[i],0);
}

function eigenvalues2(m){
  const [rows,cols]=matrixShape(m);
  if(rows!==2||cols!==2)throw new Error("EIGEN_2X2_REAL_ONLY");
  const a=m[0][0],b=m[0][1],c=m[1][0],d=m[1][1];
  const tr=a+d,det=a*d-b*c,disc=tr*tr-4*det;
  if(disc<-1e-12)throw new Error("COMPLEX_EIGENVALUES_NOT_SUPPORTED");
  const s=Math.sqrt(Math.max(0,disc));
  const vals=[(tr-s)/2,(tr+s)/2].map(v=>Math.abs(v)<1e-12?0:Number(v.toPrecision(14)));
  return vals;
}

function normalizeVector(v){
  const norm=Math.hypot(...v);
  if(norm<1e-12)throw new Error("EIGENVECTOR_FAILURE");
  let out=v.map(x=>x/norm);
  const first=out.find(x=>Math.abs(x)>1e-12);
  if(first<0)out=out.map(x=>-x);
  return out.map(x=>Math.abs(x)<1e-12?0:Number(x.toPrecision(14)));
}

function eigenvectorFor2(m,lambda){
  const a=m[0][0]-lambda,b=m[0][1],c=m[1][0],d=m[1][1]-lambda;
  let v;
  if(Math.abs(a)+Math.abs(b)>=Math.abs(c)+Math.abs(d))v=Math.abs(b)>Math.abs(a)?[1,-a/b]:[-b/a,1];
  else v=Math.abs(d)>Math.abs(c)?[1,-c/d]:[-d/c,1];
  if(!v.every(Number.isFinite))v=[1,0];
  return normalizeVector(v);
}

function eigenvectors2(m){
  return eigenvalues2(m).map(value=>({value,vector:eigenvectorFor2(m,value)}));
}

function isSymmetricMatrix(m,tolerance=1e-10){
  const [rows,cols]=matrixShape(m);
  if(rows!==cols)return false;
  for(let i=0;i<rows;i++)for(let j=i+1;j<cols;j++)if(Math.abs(m[i][j]-m[j][i])>tolerance)return false;
  return true;
}

function jacobiEigenSymmetric(m){
  const [n,cols]=matrixShape(m);
  if(n!==cols)throw new Error("SQUARE_MATRIX_REQUIRED");
  if(n<2||n>10||!isSymmetricMatrix(m))throw new Error("EIGEN_REAL_SYMMETRIC_ONLY");
  const a=m.map(row=>row.slice());
  const vectors=identity(n);
  const maxIterations=Math.max(40,25*n*n);
  for(let iteration=0;iteration<maxIterations;iteration++){
    let p=0,q=1,max=Math.abs(a[0][1]??0);
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
      const value=Math.abs(a[i][j]);
      if(value>max){max=value;p=i;q=j}
    }
    if(max<1e-12)break;
    const phi=0.5*Math.atan2(2*a[p][q],a[q][q]-a[p][p]);
    const cos=Math.cos(phi),sin=Math.sin(phi);
    for(let k=0;k<n;k++){
      if(k===p||k===q)continue;
      const akp=a[k][p],akq=a[k][q];
      a[k][p]=a[p][k]=cos*akp-sin*akq;
      a[k][q]=a[q][k]=sin*akp+cos*akq;
    }
    const app=a[p][p],aqq=a[q][q],apq=a[p][q];
    a[p][p]=cos*cos*app-2*sin*cos*apq+sin*sin*aqq;
    a[q][q]=sin*sin*app+2*sin*cos*apq+cos*cos*aqq;
    a[p][q]=a[q][p]=0;
    for(let k=0;k<n;k++){
      const vkp=vectors[k][p],vkq=vectors[k][q];
      vectors[k][p]=cos*vkp-sin*vkq;
      vectors[k][q]=sin*vkp+cos*vkq;
    }
  }
  const pairs=Array.from({length:n},(_,i)=>({
    value:Math.abs(a[i][i])<1e-12?0:Number(a[i][i].toPrecision(14)),
    vector:normalizeVector(vectors.map(row=>row[i]))
  })).sort((x,y)=>x.value-y.value);
  return pairs;
}

function eigenvalues(m){
  const [rows,cols]=matrixShape(m);
  if(rows===2&&cols===2&&!isSymmetricMatrix(m))return eigenvalues2(m);
  if(rows===2&&cols===2)return jacobiEigenSymmetric(m).map(item=>item.value);
  if(rows===cols&&rows>=3&&rows<=10&&isSymmetricMatrix(m))return jacobiEigenSymmetric(m).map(item=>item.value);
  throw new Error("EIGEN_REAL_SYMMETRIC_ONLY");
}

function eigenvectors(m){
  const [rows,cols]=matrixShape(m);
  if(rows===2&&cols===2&&!isSymmetricMatrix(m))return eigenvectors2(m);
  if(rows===cols&&rows>=2&&rows<=10&&isSymmetricMatrix(m))return jacobiEigenSymmetric(m);
  throw new Error("EIGEN_REAL_SYMMETRIC_ONLY");
}

function matrixRank(value){
  if(!isMatrix(value))throw new Error("MATRIX_REQUIRED");
  const a=value.map(row=>row.slice());
  const rows=a.length,cols=a[0]?.length??0,tolerance=1e-10;
  let rank=0,pivotRow=0;
  for(let col=0;col<cols&&pivotRow<rows;col++){
    let pivot=pivotRow;
    for(let r=pivotRow+1;r<rows;r++)if(Math.abs(a[r][col])>Math.abs(a[pivot][col]))pivot=r;
    if(Math.abs(a[pivot][col])<=tolerance)continue;
    [a[pivotRow],a[pivot]]=[a[pivot],a[pivotRow]];
    const div=a[pivotRow][col];
    for(let j=col;j<cols;j++)a[pivotRow][j]/=div;
    for(let r=0;r<rows;r++){
      if(r===pivotRow)continue;
      const factor=a[r][col];
      if(Math.abs(factor)<=tolerance)continue;
      for(let j=col;j<cols;j++)a[r][j]-=factor*a[pivotRow][j];
    }
    rank++;pivotRow++;
  }
  return rank;
}

function realMatrix(value){
  if(!isMatrix(value))throw new Error("MATRIX_REQUIRED");
  const matrix=value.map(row=>row.map(Number));
  if(matrix.some(row=>row.some(v=>!Number.isFinite(v))))throw new Error("REAL_MATRIX_REQUIRED");
  return matrix;
}

function luDecomposition(value){
  const a=realMatrix(value),[n,cols]=matrixShape(a);
  if(n!==cols)throw new Error("SQUARE_MATRIX_REQUIRED");
  const U=a.map(row=>row.slice()),L=identity(n),P=identity(n),tol=1e-12;
  for(let k=0;k<n;k++){
    let pivot=k;
    for(let r=k+1;r<n;r++)if(Math.abs(U[r][k])>Math.abs(U[pivot][k]))pivot=r;
    if(Math.abs(U[pivot][k])<tol)throw new Error("SINGULAR_MATRIX");
    if(pivot!==k){
      [U[k],U[pivot]]=[U[pivot],U[k]];
      [P[k],P[pivot]]=[P[pivot],P[k]];
      for(let j=0;j<k;j++)[L[k][j],L[pivot][j]]=[L[pivot][j],L[k][j]];
    }
    for(let i=k+1;i<n;i++){
      const factor=U[i][k]/U[k][k];
      L[i][k]=factor;
      U[i][k]=0;
      for(let j=k+1;j<n;j++)U[i][j]-=factor*U[k][j];
    }
  }
  const clean=m=>m.map(row=>row.map(v=>Math.abs(v)<1e-12?0:Number(v.toPrecision(14))));
  return{L:clean(L),U:clean(U),P:clean(P)};
}

function qrDecomposition(value){
  const a=realMatrix(value),[m,n]=matrixShape(a);
  if(m<n)throw new Error("QR_ROWS_MUST_EXCEED_COLS");
  const columns=Array.from({length:n},(_,j)=>a.map(row=>row[j]));
  const qColumns=[],R=Array.from({length:n},()=>Array(n).fill(0));
  for(let j=0;j<n;j++){
    let v=columns[j].slice();
    for(let i=0;i<j;i++){
      const rij=qColumns[i].reduce((sum,x,k)=>sum+x*columns[j][k],0);
      R[i][j]=rij;
      v=v.map((x,k)=>x-rij*qColumns[i][k]);
    }
    const norm=Math.hypot(...v);
    if(norm<1e-12)throw new Error("RANK_DEFICIENT_MATRIX");
    R[j][j]=norm;
    qColumns.push(v.map(x=>x/norm));
  }
  const Q=Array.from({length:m},(_,i)=>Array.from({length:n},(_,j)=>qColumns[j][i]));
  const clean=m=>m.map(row=>row.map(v=>Math.abs(v)<1e-12?0:Number(v.toPrecision(14))));
  return{Q:clean(Q),R:clean(R)};
}

function leastSquaresSolve(aValue,bValue){
  const a=realMatrix(aValue),b=realMatrix(bValue);
  const [m,n]=matrixShape(a),[br]=matrixShape(b);
  if(br!==m)throw new Error("MATRIX_DIMENSION_MISMATCH");
  if(m===n)return solveLinearMatrix(a,b);
  if(m>n){
    const {Q,R}=qrDecomposition(a);
    return solveLinearMatrix(R,matrixMultiply(transpose(Q),b));
  }
  return matrixMultiply(pseudoInverse(a),b);
}

function pseudoInverse(value){
  const a=realMatrix(value),[m,n]=matrixShape(a);
  if(m===n)return inverse(a);
  if(m>n){
    const {Q,R}=qrDecomposition(a);
    const invR=solveLinearMatrix(R,identity(n));
    return matrixMultiply(invR,transpose(Q));
  }
  const at=transpose(a),aat=matrixMultiply(a,at);
  const invAat=solveLinearMatrix(aat,identity(m));
  return matrixMultiply(at,invAat);
}

function matrixLeftDivide(left,right){
  const scalarLeft=typeof left==="number",scalarRight=typeof right==="number";
  if(scalarLeft&&scalarRight){
    if(left===0)throw new Error("DIVISION_BY_ZERO");
    return right/left;
  }
  if(!isMatrix(left)||!isMatrix(right))throw new Error("INVALID_MATRIX_OPERATION");
  return leastSquaresSolve(left,right);
}

function choleskyDecomposition(value){
  const a=realMatrix(value),[n,cols]=matrixShape(a);
  if(n!==cols)throw new Error("SQUARE_MATRIX_REQUIRED");
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(Math.abs(a[i][j]-a[j][i])>1e-10)throw new Error("POSITIVE_DEFINITE_REQUIRED");
  const L=Array.from({length:n},()=>Array(n).fill(0));
  for(let i=0;i<n;i++){
    for(let j=0;j<=i;j++){
      let sum=0;
      for(let k=0;k<j;k++)sum+=L[i][k]*L[j][k];
      if(i===j){
        const d=a[i][i]-sum;
        if(d<=1e-12)throw new Error("POSITIVE_DEFINITE_REQUIRED");
        L[i][j]=Math.sqrt(d);
      }else L[i][j]=(a[i][j]-sum)/L[j][j];
    }
  }
  return transpose(L).map(row=>row.map(v=>Math.abs(v)<1e-12?0:Number(v.toPrecision(14))));
}

function reducedRowEchelon(value){
  const a=realMatrix(value).map(row=>row.slice()),rows=a.length,cols=a[0]?.length??0,tol=1e-10;
  let lead=0;
  for(let r=0;r<rows&&lead<cols;r++){
    let pivot=r;
    while(lead<cols){
      pivot=r;
      for(let i=r+1;i<rows;i++)if(Math.abs(a[i][lead])>Math.abs(a[pivot][lead]))pivot=i;
      if(Math.abs(a[pivot][lead])>tol)break;
      lead++;
    }
    if(lead>=cols)break;
    [a[r],a[pivot]]=[a[pivot],a[r]];
    const div=a[r][lead];
    for(let j=0;j<cols;j++)a[r][j]/=div;
    for(let i=0;i<rows;i++){
      if(i===r)continue;
      const factor=a[i][lead];
      if(Math.abs(factor)<=tol)continue;
      for(let j=0;j<cols;j++)a[i][j]-=factor*a[r][j];
    }
    lead++;
  }
  return a.map(row=>row.map(v=>Math.abs(v)<1e-10?0:Number(v.toPrecision(14))));
}

function covariance(valueA,valueB=valueA){
  const a=numericValues(valueA),b=numericValues(valueB);
  if(a.length!==b.length)throw new Error("VECTOR_LENGTH_MISMATCH");
  if(a.length<2)return 0;
  const meanA=a.reduce((s,v)=>s+v,0)/a.length,meanB=b.reduce((s,v)=>s+v,0)/b.length;
  const result=a.reduce((sum,v,i)=>sum+(v-meanA)*(b[i]-meanB),0)/(a.length-1);
  return Math.abs(result)<1e-12?0:Number(result.toPrecision(14));
}

function correlation(valueA,valueB){
  const cov=covariance(valueA,valueB);
  const sa=Math.sqrt(variance(valueA)),sb=Math.sqrt(variance(valueB));
  if(sa<1e-15||sb<1e-15)throw new Error("ZERO_VARIANCE");
  const result=cov/(sa*sb);
  if(Math.abs(result)<1e-12)return 0;
  if(Math.abs(result-1)<1e-12)return 1;
  if(Math.abs(result+1)<1e-12)return -1;
  return Number(result.toPrecision(14));
}

function polynomialFit(xValue,yValue,degreeValue){
  const x=numericValues(xValue),y=numericValues(yValue),degree=Number(degreeValue);
  if(x.length!==y.length)throw new Error("VECTOR_LENGTH_MISMATCH");
  if(!Number.isInteger(degree)||degree<0||degree>=x.length||degree>8)throw new Error("INVALID_POLYNOMIAL_DEGREE");
  const order=degree+1;
  const normal=Array.from({length:order},(_,r)=>Array.from({length:order},(_,col)=>x.reduce((sum,v)=>sum+v**(2*degree-r-col),0)));
  const rhs=Array.from({length:order},(_,r)=>[x.reduce((sum,v,i)=>sum+y[i]*v**(degree-r),0)]);
  return [solveLinearMatrix(normal,rhs).map(row=>row[0])];
}

function polynomialValue(coefficients,value){
  const coeffs=numericValues(coefficients);
  return mapNumericLike(value,x=>coeffs.reduce((acc,c)=>acc*x+c,0));
}

function polynomialDerivative(value){
  const coeffs=numericValues(value);
  if(coeffs.length<=1)return[[0]];
  const degree=coeffs.length-1;
  return[coeffs.slice(0,-1).map((v,i)=>normalizeScalar(v*(degree-i)))];
}

function polynomialIntegral(value,constant=0){
  const coeffs=numericValues(value),k=Number(constant);
  if(!Number.isFinite(k))throw new Error("INVALID_INTEGRATION_CONSTANT");
  const degree=coeffs.length;
  return[[...coeffs.map((v,i)=>normalizeScalar(v/(degree-i))),normalizeScalar(k)]];
}

function rootMeanSquare(value){
  const values=flatten(value);
  if(!values.length)throw new Error("EMPTY_DATA");
  const meanSquare=values.reduce((sum,v)=>sum+scalarAbs(v)**2,0)/values.length;
  return normalizeScalar(Math.sqrt(meanSquare));
}

function detrendSignal(value){
  const y=numericValues(value);
  if(!y.length)return[[]];
  if(y.length===1)return[[0]];
  const n=y.length,meanX=(n-1)/2,meanY=y.reduce((a,b)=>a+b,0)/n;
  let numerator=0,denominator=0;
  for(let i=0;i<n;i++){const dx=i-meanX;numerator+=dx*(y[i]-meanY);denominator+=dx*dx}
  const slope=denominator===0?0:numerator/denominator,intercept=meanY-slope*meanX;
  return[y.map((v,i)=>normalizeScalar(v-(intercept+slope*i)))];
}

function deconvolveSignals(dividendValue,divisorValue){
  const dividend=flatten(dividendValue).map(clone),divisor=flatten(divisorValue).map(clone);
  if(!divisor.length||scalarAbs(divisor[0])<1e-15)throw new Error("INVALID_DIVISOR");
  if(!dividend.length)return{quotient:[[]],remainder:[[]]};
  if(dividend.length<divisor.length)return{quotient:[[0]],remainder:[dividend.map(normalizeScalar)]};
  const remainder=dividend.map(clone),qLength=dividend.length-divisor.length+1,quotient=Array(qLength).fill(0);
  for(let i=0;i<qLength;i++){
    const factor=scalarDiv(remainder[i],divisor[0]);
    quotient[i]=normalizeScalar(factor);
    for(let j=0;j<divisor.length;j++)remainder[i+j]=normalizeScalar(scalarSub(remainder[i+j],scalarMul(factor,divisor[j])));
  }
  const tail=remainder.slice(qLength).map(normalizeScalar);
  return{quotient:[quotient.map(normalizeScalar)],remainder:[tail.length?tail:[0]]};
}

function trapezoidalIntegral(xValue,yValue=null){
  const y=numericValues(yValue??xValue);
  if(y.length<2)return 0;
  if(yValue===null){
    return Number(y.slice(0,-1).reduce((sum,v,i)=>sum+(v+y[i+1])/2,0).toPrecision(14));
  }
  const x=numericValues(xValue);
  if(x.length!==y.length)throw new Error("VECTOR_LENGTH_MISMATCH");
  let total=0;
  for(let i=0;i<x.length-1;i++)total+=(x[i+1]-x[i])*(y[i]+y[i+1])/2;
  return Math.abs(total)<1e-12?0:Number(total.toPrecision(14));
}

function cumulativeTrapezoid(xValue,yValue=null){
  const y=numericValues(yValue??xValue);
  const out=[0];
  if(y.length<2)return rowVector(out);
  if(yValue===null){
    for(let i=0;i<y.length-1;i++)out.push(out.at(-1)+(y[i]+y[i+1])/2);
  }else{
    const x=numericValues(xValue);
    if(x.length!==y.length)throw new Error("VECTOR_LENGTH_MISMATCH");
    for(let i=0;i<x.length-1;i++)out.push(out.at(-1)+(x[i+1]-x[i])*(y[i]+y[i+1])/2);
  }
  return rowVector(out.map(v=>Math.abs(v)<1e-12?0:Number(v.toPrecision(14))));
}

function numericalGradient(value,spacing=1){
  const y=numericValues(value),h=Number(spacing);
  if(!Number.isFinite(h)||h===0)throw new Error("INVALID_SPACING");
  if(y.length===1)return[[0]];
  const out=Array(y.length);
  out[0]=(y[1]-y[0])/h;
  out[y.length-1]=(y.at(-1)-y.at(-2))/h;
  for(let i=1;i<y.length-1;i++)out[i]=(y[i+1]-y[i-1])/(2*h);
  return rowVector(out.map(v=>Math.abs(v)<1e-12?0:Number(v.toPrecision(14))));
}

function linearInterpolate(xValue,yValue,queryValue){
  const x=numericValues(xValue),y=numericValues(yValue);
  if(x.length!==y.length||x.length<2)throw new Error("VECTOR_LENGTH_MISMATCH");
  for(let i=1;i<x.length;i++)if(!(x[i]>x[i-1]))throw new Error("X_MUST_BE_STRICTLY_INCREASING");
  const interpolate=q=>{
    if(q<x[0]||q>x.at(-1))throw new Error("INTERPOLATION_OUT_OF_RANGE");
    if(q===x.at(-1))return y.at(-1);
    let lo=0,hi=x.length-1;
    while(hi-lo>1){const mid=Math.floor((lo+hi)/2);if(x[mid]<=q)lo=mid;else hi=mid}
    const t=(q-x[lo])/(x[lo+1]-x[lo]);
    const result=y[lo]+t*(y[lo+1]-y[lo]);
    return Math.abs(result)<1e-12?0:Number(result.toPrecision(14));
  };
  return mapNumericLike(queryValue,interpolate);
}

function numericDerivative(handle,x,h,functions){
  if(!isFunctionHandle(handle))throw new Error("FUNCTION_HANDLE_REQUIRED");
  x=Number(x);h=h===undefined?Math.max(1e-6,Math.abs(x)*1e-5):Number(h);
  if(!Number.isFinite(x)||!Number.isFinite(h)||h<=0)throw new Error("INVALID_STEP_SIZE");
  const f1=Number(invokeFunctionHandleValues(handle,[x+h],functions));
  const f0=Number(invokeFunctionHandleValues(handle,[x-h],functions));
  if(!Number.isFinite(f1)||!Number.isFinite(f0))throw new Error("INVALID_FUNCTION_VALUE");
  const result=(f1-f0)/(2*h);
  return Math.abs(result)<1e-12?0:Number(result.toPrecision(14));
}

function simpsonIntegral(handle,a,b,n,functions){
  if(!isFunctionHandle(handle))throw new Error("FUNCTION_HANDLE_REQUIRED");
  a=Number(a);b=Number(b);n=n===undefined?200:Number(n);
  if(!Number.isFinite(a)||!Number.isFinite(b)||!Number.isInteger(n)||n<2||n>10000)throw new Error("INVALID_SAMPLE_COUNT");
  if(n%2)n++;
  const h=(b-a)/n;
  let total=Number(invokeFunctionHandleValues(handle,[a],functions))+Number(invokeFunctionHandleValues(handle,[b],functions));
  if(!Number.isFinite(total))throw new Error("INVALID_FUNCTION_VALUE");
  for(let i=1;i<n;i++){
    const value=Number(invokeFunctionHandleValues(handle,[a+i*h],functions));
    if(!Number.isFinite(value))throw new Error("INVALID_FUNCTION_VALUE");
    total+=(i%2?4:2)*value;
  }
  const result=total*h/3;
  return Math.abs(result)<1e-12?0:Number(result.toPrecision(14));
}

function findZero(handle,start,tolerance,functions){
  if(!isFunctionHandle(handle))throw new Error("FUNCTION_HANDLE_REQUIRED");
  const values=numericValues(start),tol=tolerance===undefined?1e-10:Number(tolerance);
  if(!Number.isFinite(tol)||tol<=0)throw new Error("INVALID_TOLERANCE");
  let a,b;
  const fn=x=>{
    const value=Number(invokeFunctionHandleValues(handle,[x],functions));
    if(!Number.isFinite(value))throw new Error("INVALID_FUNCTION_VALUE");
    return value;
  };
  if(values.length===2){[a,b]=values}
  else if(values.length===1){
    const x0=values[0];let step=Math.max(1,Math.abs(x0)*0.1);
    a=x0-step;b=x0+step;
    let fa=fn(a),fb=fn(b),tries=0;
    while(fa*fb>0&&tries++<30){step*=1.7;a=x0-step;b=x0+step;fa=fn(a);fb=fn(b)}
    if(fa*fb>0)throw new Error("ROOT_NOT_BRACKETED");
  }else throw new Error("INVALID_ROOT_START");
  let fa=fn(a),fb=fn(b);
  if(Math.abs(fa)<=tol)return a;
  if(Math.abs(fb)<=tol)return b;
  if(fa*fb>0)throw new Error("ROOT_NOT_BRACKETED");
  for(let i=0;i<200;i++){
    const mid=(a+b)/2,fm=fn(mid);
    if(Math.abs(fm)<=tol||Math.abs(b-a)<=tol*Math.max(1,Math.abs(mid)))return Math.abs(mid)<1e-12?0:Number(mid.toPrecision(14));
    if(fa*fm<=0){b=mid;fb=fm}else{a=mid;fa=fm}
  }
  throw new Error("ROOT_DID_NOT_CONVERGE");
}

function rk4Solve(handle,tspan,y0,steps,functions){
  if(!isFunctionHandle(handle))throw new Error("FUNCTION_HANDLE_REQUIRED");
  const span=numericValues(tspan);
  if(span.length!==2)throw new Error("INVALID_TIME_SPAN");
  const start=span[0],end=span[1],initial=Number(y0),count=steps===undefined?100:Number(steps);
  if(!Number.isFinite(initial)||!Number.isInteger(count)||count<1||count>10000)throw new Error("INVALID_SAMPLE_COUNT");
  const h=(end-start)/count,out=[[start,initial]];
  const f=(t,y)=>{
    const value=Number(invokeFunctionHandleValues(handle,[t,y],functions));
    if(!Number.isFinite(value))throw new Error("INVALID_FUNCTION_VALUE");
    return value;
  };
  let t=start,y=initial;
  for(let i=0;i<count;i++){
    const k1=f(t,y),k2=f(t+h/2,y+h*k1/2),k3=f(t+h/2,y+h*k2/2),k4=f(t+h,y+h*k3);
    y+=h*(k1+2*k2+2*k3+k4)/6;t=start+(i+1)*h;
    out.push([Number(t.toPrecision(14)),Math.abs(y)<1e-12?0:Number(y.toPrecision(14))]);
  }
  return out;
}

function evaluatePolynomialComplex(coefficients,z){
  let value=complex(0,0);
  for(const coefficient of coefficients)value=toComplex(scalarAdd(scalarMul(value,z),coefficient));
  return normalizeScalar(value);
}

function polynomialRoots(coefficients){
  const c=numericValues(coefficients);
  while(c.length>1&&Math.abs(c[0])<1e-15)c.shift();
  if(c.length<2)return[[]];
  const degree=c.length-1;
  if(degree>20)throw new Error("POLYNOMIAL_DEGREE_TOO_LARGE");
  if(degree===1)return[[-c[1]/c[0]]];
  const lead=c[0],monic=c.map(v=>v/lead);
  if(degree===2){
    const [a,b,d]=c,disc=b*b-4*a*d;
    const s=scalarSqrt(disc),twoA=2*a;
    const roots=[scalarDiv(scalarSub(-b,s),twoA),scalarDiv(scalarAdd(-b,s),twoA)]
      .map(normalizeScalar)
      .sort((x,y)=>{const a=toComplex(x),b=toComplex(y);return a.re-b.re||a.im-b.im});
    return[roots];
  }
  const radius=1+Math.max(...monic.slice(1).map(Math.abs));
  let roots=Array.from({length:degree},(_,k)=>{
    const angle=2*Math.PI*(k+0.25)/degree;
    return complex(radius*Math.cos(angle),radius*Math.sin(angle));
  });
  for(let iteration=0;iteration<600;iteration++){
    let maxDelta=0;
    const next=roots.map((root,i)=>{
      let denominator=complex(1,0);
      for(let j=0;j<roots.length;j++)if(j!==i)denominator=toComplex(scalarMul(denominator,scalarSub(root,roots[j])));
      if(scalarAbs(denominator)<1e-18)denominator=complex(1e-12,1e-12*(i+1));
      const correction=scalarDiv(evaluatePolynomialComplex(monic,root),denominator);
      maxDelta=Math.max(maxDelta,scalarAbs(correction));
      return toComplex(scalarSub(root,correction));
    });
    roots=next;
    if(maxDelta<1e-11)break;
    if(iteration===599)throw new Error("ROOTS_DID_NOT_CONVERGE");
  }
  const cleaned=roots.map(normalizeScalar).sort((x,y)=>{
    const a=toComplex(x),b=toComplex(y);
    const ar=Math.abs(a.re)<1e-9?0:a.re,br=Math.abs(b.re)<1e-9?0:b.re;
    const ai=Math.abs(a.im)<1e-9?0:a.im,bi=Math.abs(b.im)<1e-9?0:b.im;
    return ar-br||ai-bi;
  });
  return[cleaned];
}

function convolveSignals(aValue,bValue){
  const a=flatten(aValue),b=flatten(bValue);
  if(!a.length||!b.length)return[[]];
  if(a.length+b.length>4097)throw new Error("SIGNAL_TOO_LARGE");
  const out=Array(a.length+b.length-1).fill(0);
  for(let i=0;i<a.length;i++)for(let j=0;j<b.length;j++)out[i+j]=scalarAdd(out[i+j],scalarMul(a[i],b[j]));
  return[out.map(normalizeScalar)];
}

function shiftSignal(value,inverse=false){
  const data=flatten(value);
  if(!data.length)return[[]];
  const split=inverse?Math.ceil(data.length/2):Math.floor(data.length/2);
  return[[...data.slice(split),...data.slice(0,split)].map(clone)];
}

function movingMean(value,windowValue){
  const data=flatten(value),window=Number(windowValue);
  if(!Number.isInteger(window)||window<1||window>data.length)throw new Error("INVALID_WINDOW_SIZE");
  return[data.map((_,i)=>{
    const half=Math.floor(window/2),left=Math.max(0,i-half),right=Math.min(data.length,i+(window-half));
    let sum=0;
    for(let j=left;j<right;j++)sum=scalarAdd(sum,data[j]);
    return normalizeScalar(scalarDiv(sum,right-left));
  })];
}

function crossCorrelation(aValue,bValue=aValue){
  const a=flatten(aValue),b=flatten(bValue);
  if(!a.length||!b.length)return[[]];
  const reversed=b.slice().reverse().map(scalarConj);
  return convolveSignals(a,reversed);
}

function discreteFourierTransform(value,inverse=false){
  const input=flatten(value);
  if(!input.length||input.length>1024)throw new Error("INVALID_FFT_SIZE");
  const n=input.length,sign=inverse?1:-1;
  const out=Array.from({length:n},(_,k)=>{
    let sum=complex(0,0);
    for(let t=0;t<n;t++){
      const angle=sign*2*Math.PI*k*t/n;
      sum=toComplex(scalarAdd(sum,scalarMul(input[t],complex(Math.cos(angle),Math.sin(angle)))));
    }
    if(inverse)sum=toComplex(scalarDiv(sum,n));
    return normalizeScalar(sum);
  });
  return[out];
}

function complexParts(value,part){
  return mapNumericLike(value,z=>{
    const c=toComplex(z);
    if(part==="real")return c.re;
    if(part==="imag")return c.im;
    if(part==="conj")return scalarConj(c);
    if(part==="angle")return scalarAngle(c);
    return scalarAbs(c);
  });
}

function solveLinearMatrix(a,b){
  const [n,cols]=matrixShape(a),[br,bc]=matrixShape(b);
  if(n!==cols)throw new Error("SQUARE_MATRIX_REQUIRED");
  if(br!==n)throw new Error("MATRIX_DIMENSION_MISMATCH");
  const m=a.map((row,i)=>[...row,...b[i]]);
  for(let col=0;col<n;col++){
    let pivot=col;
    for(let r=col+1;r<n;r++)if(Math.abs(m[r][col])>Math.abs(m[pivot][col]))pivot=r;
    if(Math.abs(m[pivot][col])<1e-12)throw new Error("SINGULAR_MATRIX");
    [m[col],m[pivot]]=[m[pivot],m[col]];
    const div=m[col][col];for(let j=col;j<n+bc;j++)m[col][j]/=div;
    for(let r=0;r<n;r++){
      if(r===col)continue;
      const factor=m[r][col];
      if(Math.abs(factor)<1e-15)continue;
      for(let j=col;j<n+bc;j++)m[r][j]-=factor*m[col][j];
    }
  }
  return m.map(row=>row.slice(n).map(v=>Math.abs(v)<1e-12?0:Number(v.toPrecision(14))));
}

function identity(rows,cols=rows){
  rows=Number(rows);cols=Number(cols);
  if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||cols<1||rows>100||cols>100)throw new Error("INVALID_MATRIX_SIZE");
  return Array.from({length:rows},(_,i)=>Array.from({length:cols},(_,j)=>i===j?1:0));
}

function zeros(rows,cols=rows){
  rows=Number(rows);cols=Number(cols);
  if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||cols<1||rows>100||cols>100)throw new Error("INVALID_MATRIX_SIZE");
  return Array.from({length:rows},()=>Array(cols).fill(0));
}

function ones(rows,cols=rows){
  rows=Number(rows);cols=Number(cols);
  if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||cols<1||rows>100||cols>100)throw new Error("INVALID_MATRIX_SIZE");
  return Array.from({length:rows},()=>Array(cols).fill(1));
}

function linspace(start,end,count){
  start=Number(start);end=Number(end);count=Number(count);
  if(!Number.isFinite(start)||!Number.isFinite(end)||!Number.isInteger(count)||count<2||count>10000)throw new Error("INVALID_SAMPLE_COUNT");
  const step=(end-start)/(count-1);
  return Array.from({length:count},(_,i)=>i===count-1?end:Number((start+i*step).toPrecision(14)));
}

function diagonal(value){
  if(!isMatrix(value))throw new Error("INVALID_MATRIX");
  const [rows,cols]=matrixShape(value);
  if(rows===1||cols===1){
    const values=linearColumnMajor(value);
    return Array.from({length:values.length},(_,r)=>Array.from({length:values.length},(_,c)=>r===c?values[r]:0));
  }
  const n=Math.min(rows,cols);
  return Array.from({length:n},(_,i)=>[value[i][i]]);
}

function euclideanNorm(value){
  const values=flatten(value).map(Number);
  if(values.some(v=>!Number.isFinite(v)))throw new Error("INVALID_VALUE");
  return Math.sqrt(values.reduce((sum,v)=>sum+v*v,0));
}

function numericValues(value){
  const values=flatten(value).map(Number);
  if(!values.length||values.some(v=>!Number.isFinite(v)))throw new Error("INVALID_VALUE");
  return values;
}
function numericValuesAllowNaN(value){
  const values=flatten(value).map(Number);
  if(!values.length)throw new Error("INVALID_VALUE");
  return values;
}
function rowVector(values){return[values]}
function cumulative(values,fn,seed){
  const out=[];let acc=seed;
  for(const value of values){acc=fn(acc,value);out.push(acc)}
  return rowVector(out);
}
function difference(values){
  if(values.length<2)return[[]];
  return rowVector(values.slice(1).map((value,i)=>value-values[i]));
}
function uniqueSorted(values){return rowVector([...new Set(values)].sort((a,b)=>a-b))}
function logicalSelectorIndices(source,workspace,functions,max){
  const text=String(source).trim();
  if(!/[<>=~&|]/.test(text))return null;
  const mask=evalValue(text,workspace,functions);
  const values=linearColumnMajor(mask);
  if(values.length!==max)throw new Error("LOGICAL_INDEX_SIZE_MISMATCH");
  return values.map((value,i)=>Number(value)!==0?i:null).filter(i=>i!==null);
}
function normalizeNumericResult(value){return normalizeScalar(value)}
function mapNumericLike(value,fn){
  const apply=x=>normalizeScalar(fn(x));
  if(typeof value==="number"||isComplex(value))return apply(value);
  if(isMatrix(value))return value.map(row=>row.map(apply));
  if(Array.isArray(value))return value.map(apply);
  throw new Error("INVALID_VALUE");
}
function findLinearIndices(value){
  const values=linearColumnMajor(value);
  const out=[];
  values.forEach((v,i)=>{if(Number(v)!==0)out.push(i+1)});
  return[out];
}

function median(value){
  const values=numericValues(value).slice().sort((a,b)=>a-b);
  const mid=Math.floor(values.length/2);
  return values.length%2?values[mid]:(values[mid-1]+values[mid])/2;
}

function variance(value){
  const values=numericValues(value);
  if(values.length<2)return 0;
  const mean=values.reduce((a,b)=>a+b,0)/values.length;
  return values.reduce((sum,v)=>sum+(v-mean)**2,0)/(values.length-1);
}

function dimensionSlices(value,dim){
  if(!isMatrix(value))throw new Error("MATRIX_REQUIRED");
  const dimension=Number(dim);
  if(!Number.isInteger(dimension)||(dimension!==1&&dimension!==2))throw new Error("INVALID_DIMENSION");
  const matrix=value.map(row=>row.map(Number));
  if(matrix.some(row=>row.some(v=>!Number.isFinite(v))))throw new Error("INVALID_VALUE");
  if(dimension===1){
    const cols=matrix[0]?.length??0;
    return{dimension,slices:Array.from({length:cols},(_,col)=>matrix.map(row=>row[col]))};
  }
  return{dimension,slices:matrix.map(row=>row.slice())};
}

function reduceByDimension(value,dim,reducer){
  const {dimension,slices}=dimensionSlices(value,dim);
  const reduced=slices.map(slice=>normalizeScalar(reducer(slice)));
  return dimension===1?[reduced]:reduced.map(v=>[v]);
}

function rebuildDimensionSlices(dimension,slices){
  if(dimension===2)return slices.map(slice=>slice.map(normalizeScalar));
  const rows=slices[0]?.length??0;
  if(rows===0)return[];
  return Array.from({length:rows},(_,row)=>slices.map(slice=>normalizeScalar(slice[row])));
}

function transformByDimension(value,dim,transformer){
  const {dimension,slices}=dimensionSlices(value,dim);
  return rebuildDimensionSlices(dimension,slices.map(slice=>transformer(slice.slice())));
}

function cumulativeValues(values,fn,seed){
  const out=[];let acc=seed;
  for(const value of values){acc=fn(acc,value);out.push(normalizeScalar(acc))}
  return out;
}

function differenceOrder(values,order=1){
  const n=Number(order);
  if(!Number.isInteger(n)||n<0)throw new Error("INVALID_DIFFERENCE_ORDER");
  let out=values.slice();
  for(let k=0;k<n;k++){
    if(out.length<2)return[];
    out=out.slice(1).map((value,i)=>normalizeScalar(value-out[i]));
  }
  return out;
}

function medianValues(values){
  const sorted=values.slice().sort((a,b)=>a-b),mid=Math.floor(sorted.length/2);
  return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
}

function varianceValues(values){
  if(values.length<2)return 0;
  const mean=values.reduce((a,b)=>a+b,0)/values.length;
  return values.reduce((sum,v)=>sum+(v-mean)**2,0)/(values.length-1);
}

function percentileMidpoint(value,pct){
  const values=numericValues(value).slice().sort((a,b)=>a-b);
  const p=Number(pct);
  if(!Number.isFinite(p)||p<0||p>100)throw new Error("INVALID_PERCENTILE");
  if(values.length===1)return values[0];
  const first=50/values.length;
  const last=100-first;
  if(p<=first)return values[0];
  if(p>=last)return values.at(-1);
  const position=(p/100)*values.length+0.5;
  const lower=Math.floor(position),upper=Math.ceil(position);
  if(lower===upper)return values[lower-1];
  const fraction=position-lower;
  const result=values[lower-1]+(values[upper-1]-values[lower-1])*fraction;
  return Math.abs(result)<1e-12?0:Number(result.toPrecision(14));
}

function quantileMidpoint(value,q){
  const quantile=Number(q);
  if(!Number.isFinite(quantile)||quantile<0||quantile>1)throw new Error("INVALID_QUANTILE");
  return percentileMidpoint(value,quantile*100);
}

function dot(a,b){
  const av=numericValues(a),bv=numericValues(b);
  if(av.length!==bv.length)throw new Error("VECTOR_DIMENSION_MISMATCH");
  return av.reduce((sum,v,i)=>sum+v*bv[i],0);
}

function cross(a,b){
  const av=numericValues(a),bv=numericValues(b);
  if(av.length!==3||bv.length!==3)throw new Error("CROSS_REQUIRES_3D");
  return[
    av[1]*bv[2]-av[2]*bv[1],
    av[2]*bv[0]-av[0]*bv[2],
    av[0]*bv[1]-av[1]*bv[0]
  ].map(v=>Math.abs(v)<1e-12?0:Number(v.toPrecision(14)));
}

function reshape(value,rows,cols){
  rows=Number(rows);cols=Number(cols);
  if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||cols<1||rows>100||cols>100)throw new Error("INVALID_MATRIX_SIZE");
  const values=linearColumnMajor(value).map(Number);
  if(values.length!==rows*cols||values.some(v=>!Number.isFinite(v)))throw new Error("RESHAPE_SIZE_MISMATCH");
  return Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>values[c*rows+r]));
}

function matrixValue(value){
  if(typeof value==="number"||isComplex(value))return[[clone(value)]];
  if(!isMatrix(value))throw new Error("MATRIX_REQUIRED");
  return clone(value);
}

function repeatMatrix(value,rowCopies,colCopies){
  const m=matrixValue(value),[rows,cols]=matrixShape(m);
  rowCopies=Number(rowCopies);colCopies=Number(colCopies);
  if(!Number.isInteger(rowCopies)||!Number.isInteger(colCopies)||rowCopies<1||colCopies<1||rows*rowCopies>100||cols*colCopies>100)throw new Error("INVALID_MATRIX_SIZE");
  return Array.from({length:rows*rowCopies},(_,r)=>
    Array.from({length:cols*colCopies},(_,col)=>clone(m[r%rows][col%cols]))
  );
}

function flipLeftRight(value){
  return matrixValue(value).map(row=>row.slice().reverse().map(clone));
}

function flipUpDown(value){
  return matrixValue(value).slice().reverse().map(row=>row.map(clone));
}

function rotate90(value,count=1){
  let m=matrixValue(value),k=Number(count);
  if(!Number.isInteger(k))throw new Error("INVALID_ROTATION_COUNT");
  k=((k%4)+4)%4;
  for(let n=0;n<k;n++)m=flipUpDown(transpose(m));
  return m;
}

function kroneckerProduct(aValue,bValue){
  const a=matrixValue(aValue),b=matrixValue(bValue);
  const [ar,ac]=matrixShape(a),[br,bc]=matrixShape(b);
  if(ar*br>100||ac*bc>100)throw new Error("INVALID_MATRIX_SIZE");
  return Array.from({length:ar*br},(_,r)=>Array.from({length:ac*bc},(_,col)=>{
    const av=a[Math.floor(r/br)][Math.floor(col/bc)];
    const bv=b[r%br][col%bc];
    return normalizeScalar(scalarMul(av,bv));
  }));
}

function blockDiagonal(values){
  if(!values.length)throw new Error("INVALID_ARGUMENT_COUNT");
  const blocks=values.map(matrixValue);
  const shapes=blocks.map(matrixShape);
  const totalRows=shapes.reduce((s,x)=>s+x[0],0),totalCols=shapes.reduce((s,x)=>s+x[1],0);
  if(totalRows>100||totalCols>100)throw new Error("INVALID_MATRIX_SIZE");
  const out=Array.from({length:totalRows},()=>Array(totalCols).fill(0));
  let rowOffset=0,colOffset=0;
  blocks.forEach((block,i)=>{
    const [rows,cols]=shapes[i];
    for(let r=0;r<rows;r++)for(let col=0;col<cols;col++)out[rowOffset+r][colOffset+col]=clone(block[r][col]);
    rowOffset+=rows;colOffset+=cols;
  });
  return out;
}

function linearColumnMajor(m){
  if(!isMatrix(m))return[m];
  const rows=m.length,cols=m[0]?.length??0,out=[];
  for(let c=0;c<cols;c++)for(let r=0;r<rows;r++)out.push(m[r][c]);
  return out;
}

function parseIndexSpec(source,workspace,max){
  let text=String(source).trim();
  if(text===":")return Array.from({length:max},(_,i)=>i);
  text=text.replace(/\bend\b/g,String(max));
  const range=colonValues(text,workspace);
  const values=range??[numericExpression(text,workspace)];
  return values.map(value=>{
    if(!Number.isInteger(value)||value<1||value>max)throw new Error("INDEX_OUT_OF_RANGE");
    return value-1;
  });
}
function parseAssignmentIndexSpec(source,workspace,max){
  let text=String(source).trim();
  if(text===":")return Array.from({length:max},(_,i)=>i);
  text=text.replace(/\bend\b/g,String(max));
  const range=colonValues(text,workspace);
  const values=range??[numericExpression(text,workspace)];
  return values.map(value=>{
    if(!Number.isInteger(value)||value<1)throw new Error("INDEX_OUT_OF_RANGE");
    if(value>10000)throw new Error("ARRAY_GROWTH_LIMIT");
    return value-1;
  });
}
function ensureMatrixSize(matrix,rows,cols){
  const result=clone(matrix);
  const currentCols=result[0]?.length??0;
  while(result.length<rows)result.push(Array(currentCols).fill(0));
  const targetCols=Math.max(cols,currentCols);
  for(const row of result)while(row.length<targetCols)row.push(0);
  return result;
}
function deleteIndexedValues(value,args,workspace){
  const [rows,cols]=matrixShape(value);
  if(args.length===1){
    if(rows!==1&&cols!==1)throw new Error("LINEAR_DELETE_REQUIRES_VECTOR");
    const max=rows*cols,indices=parseIndexSpec(args[0],workspace,max).sort((a,b)=>b-a);
    const values=linearColumnMajor(value);
    for(const index of indices)values.splice(index,1);
    if(!values.length)return[];
    return rows===1?[values]:values.map(v=>[v]);
  }
  const rowAll=args[0].trim()===":",colAll=args[1].trim()===":";
  if(rowAll===colAll)throw new Error("DELETE_REQUIRES_FULL_ROW_OR_COLUMN");
  if(colAll){
    const remove=new Set(parseIndexSpec(args[0],workspace,rows));
    const out=value.filter((_,r)=>!remove.has(r)).map(row=>row.slice());
    return out.length?out:[];
  }
  const remove=new Set(parseIndexSpec(args[1],workspace,cols));
  const out=value.map(row=>row.filter((_,c)=>!remove.has(c)));
  return out[0]?.length?out:[];
}

function indexWorkspaceValue(value,argSource,workspace,functions={}){
  if(!Array.isArray(value))throw new Error("INDEXING_REQUIRES_ARRAY");
  const args=splitArgs(argSource);
  if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");
  if(args.length===1){
    const linear=linearColumnMajor(value);
    const logical=logicalSelectorIndices(args[0],workspace,functions,linear.length);
    const indices=logical??parseIndexSpec(args[0],workspace,linear.length);
    const picked=indices.map(i=>linear[i]);
    return picked.length===1?picked[0]:[picked];
  }
  const [rows,cols]=matrixShape(value);
  const ri=parseIndexSpec(args[0],workspace,rows),ci=parseIndexSpec(args[1],workspace,cols);
  if(ri.length===1&&ci.length===1)return value[ri[0]][ci[0]];
  return ri.map(r=>ci.map(c=>value[r][c]));
}
function valueForAssignment(rhs,rows,cols){
  if(typeof rhs==="number")return Array.from({length:rows},()=>Array(cols).fill(rhs));
  if(!isMatrix(rhs))throw new Error("INDEX_ASSIGNMENT_SHAPE_MISMATCH");
  const [rr,rc]=matrixShape(rhs);
  if(rr!==rows||rc!==cols)throw new Error("INDEX_ASSIGNMENT_SHAPE_MISMATCH");
  return rhs;
}
function assignWorkspaceIndex(value,argSource,rhs,workspace,functions={}){
  if(!isMatrix(value)||!value.length)throw new Error("INDEXING_REQUIRES_ARRAY");
  const args=splitArgs(argSource);
  if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");
  if(Array.isArray(rhs)&&rhs.length===0)return deleteIndexedValues(value,args,workspace);
  if(args.length===1){
    const [rows,cols]=matrixShape(value),max=rows*cols;
    const logical=logicalSelectorIndices(args[0],workspace,functions,max);
    const indices=logical??parseAssignmentIndexSpec(args[0],workspace,max);
    const replacement=typeof rhs==="number"?Array(indices.length).fill(rhs):linearColumnMajor(rhs);
    if(replacement.length!==indices.length)throw new Error("INDEX_ASSIGNMENT_SHAPE_MISMATCH");
    const needed=Math.max(max,...indices.map(i=>i+1));
    let result=clone(value);
    if(needed>max){
      if(rows===1)result=ensureMatrixSize(result,1,needed);
      else if(cols===1)result=ensureMatrixSize(result,needed,1);
      else result=ensureMatrixSize(result,rows,Math.ceil(needed/rows));
    }
    indices.forEach((linearIndex,k)=>{
      const currentRows=result.length;
      const row=linearIndex%currentRows,col=Math.floor(linearIndex/currentRows);
      result[row][col]=replacement[k];
    });
    return result;
  }
  const [rows,cols]=matrixShape(value);
  const ri=parseAssignmentIndexSpec(args[0],workspace,rows),ci=parseAssignmentIndexSpec(args[1],workspace,cols);
  const maxRow=Math.max(...ri)+1,maxCol=Math.max(...ci)+1;
  const result=ensureMatrixSize(value,Math.max(rows,maxRow),Math.max(cols,maxCol));
  const replacement=valueForAssignment(rhs,ri.length,ci.length);
  ri.forEach((r,rr)=>ci.forEach((c,cc)=>{result[r][c]=replacement[rr][cc]}));
  return result;
}
function stripInlineComment(line){
  let depth=0;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==="["||ch==="(")depth++;
    else if(ch==="]"||ch===")")depth--;
    else if(ch==="%"&&depth===0)return line.slice(0,i);
  }
  return line;
}
function splitStatements(line){
  const out=[];let current="",depth=0;
  for(let i=0;i<line.length;i++){
    const ch=line[i];
    if(ch==="["||ch==="(")depth++;
    else if(ch==="]"||ch===")")depth--;
    if(ch===";"&&depth===0){
      if(current.trim())out.push({source:current.trim(),suppressed:true});
      current="";continue;
    }
    current+=ch;
  }
  if(current.trim())out.push({source:current.trim(),suppressed:false});
  return out;
}
function blockOpener(line){
  const text=stripInlineComment(line).trim().toLowerCase();
  return /^(if\b|for\b|while\b|switch\b|try\b)/.test(text);
}
function parseUserFunctions(script){
  const lines=String(script??"").split(/\r?\n/);
  const functions={},body=[];
  for(let i=0;i<lines.length;i++){
    const raw=lines[i].trim();
    const header=raw.match(/^function\s+(?:(\[[^\]]+\]|[A-Za-z][A-Za-z0-9_]*)\s*=\s*)?([A-Za-z][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*$/i);
    if(!header){body.push(lines[i]);continue}
    const outputs=!header[1]?[]:(header[1].startsWith("[")?header[1].slice(1,-1).split(",").map(x=>x.trim()).filter(Boolean):[header[1]]);
    const name=header[2],params=header[3].split(",").map(x=>x.trim()).filter(Boolean);
    const fnLines=[];let foundEnd=false,depth=0;
    for(i=i+1;i<lines.length;i++){
      const trimmed=stripInlineComment(lines[i]).trim().toLowerCase();
      if(trimmed==="end"){
        if(depth===0){foundEnd=true;break}
        depth--;fnLines.push(lines[i]);continue;
      }
      if(blockOpener(lines[i]))depth++;
      fnLines.push(lines[i]);
    }
    if(!foundEnd)throw new Error("FUNCTION_END_REQUIRED");
    functions[name.toLowerCase()]={name,outputs,params,body:fnLines.join("\n")};
  }
  return{functions,script:body.join("\n")};
}
function findBlockEnd(lines,start){
  let depth=0;
  for(let i=start+1;i<lines.length;i++){
    const text=stripInlineComment(lines[i]).trim().toLowerCase();
    if(blockOpener(lines[i])){depth++;continue}
    if(text==="end"){
      if(depth===0)return i;
      depth--;
    }
  }
  throw new Error("BLOCK_END_REQUIRED");
}
function splitIfBranches(lines,start,end){
  const head=stripInlineComment(lines[start]).trim();
  const branches=[];let branchStart=start+1,currentCondition=head.replace(/^if\s+/i,"").trim(),depth=0;
  for(let i=start+1;i<end;i++){
    const raw=stripInlineComment(lines[i]).trim();
    const lower=raw.toLowerCase();
    if(blockOpener(lines[i])){depth++;continue}
    if(lower==="end"){depth--;continue}
    if(depth===0&&/^elseif\b/i.test(raw)){
      branches.push({condition:currentCondition,lines:lines.slice(branchStart,i),offset:branchStart});
      currentCondition=raw.replace(/^elseif\s+/i,"").trim();branchStart=i+1;
    }else if(depth===0&&lower==="else"){
      branches.push({condition:currentCondition,lines:lines.slice(branchStart,i),offset:branchStart});
      currentCondition=null;branchStart=i+1;
    }
  }
  branches.push({condition:currentCondition,lines:lines.slice(branchStart,end),offset:branchStart});
  return branches;
}
function splitSwitchCases(lines,start,end){
  const cases=[];let depth=0,current=null,branchStart=start+1;
  for(let i=start+1;i<end;i++){
    const raw=stripInlineComment(lines[i]).trim(),lower=raw.toLowerCase();
    if(blockOpener(lines[i])){depth++;continue}
    if(lower==="end"){depth--;continue}
    if(depth===0&&/^case\b/i.test(raw)){
      if(current)cases.push({...current,lines:lines.slice(branchStart,i)});
      current={expression:raw.replace(/^case\s+/i,"").trim(),otherwise:false,offset:i+1};branchStart=i+1;
    }else if(depth===0&&lower==="otherwise"){
      if(current)cases.push({...current,lines:lines.slice(branchStart,i)});
      current={expression:null,otherwise:true,offset:i+1};branchStart=i+1;
    }
  }
  if(current)cases.push({...current,lines:lines.slice(branchStart,end)});
  return cases;
}
function splitTryCatch(lines,start,end){
  let depth=0,catchIndex=-1,catchName="";
  for(let i=start+1;i<end;i++){
    const raw=stripInlineComment(lines[i]).trim(),lower=raw.toLowerCase();
    if(blockOpener(lines[i])){depth++;continue}
    if(lower==="end"){depth--;continue}
    if(depth===0&&/^catch(?:\s+|$)/i.test(raw)){
      catchIndex=i;catchName=raw.replace(/^catch\s*/i,"").trim();break;
    }
  }
  return catchIndex<0?{tryLines:lines.slice(start+1,end),catchLines:null,tryOffset:start+1,catchOffset:end,catchName:""}:{
    tryLines:lines.slice(start+1,catchIndex),catchLines:lines.slice(catchIndex+1,end),
    tryOffset:start+1,catchOffset:catchIndex+1,catchName
  };
}
function switchMatches(selector,candidate){
  if(typeof selector!=="number")throw new Error("SWITCH_SCALAR_REQUIRED");
  if(typeof candidate==="number")return selector===candidate;
  if(Array.isArray(candidate))return flatten(candidate).some(value=>Number(value)===selector);
  return false;
}

export function describeMathLabValue(value){
  if(isFunctionHandle(value))return{size:"1×1",className:"function_handle",preview:value.named?"@"+value.named:"@("+value.params.join(",")+") "+value.expression};
  if(isComplex(value))return{size:"1×1",className:"complex",preview:`${value.re}${value.im<0?"":"+"}${value.im}i`};
  if(typeof value==="number")return{size:"1×1",className:"double",preview:String(value)};
  if(isMatrix(value)){
    const rows=value.length,cols=value[0]?.length??0;
    const hasComplex=value.some(row=>row.some(isComplex));
    const previewValue=v=>isComplex(v)?`${v.re}${v.im<0?"":"+"}${v.im}i`:String(v);
    return{size:`${rows}×${cols}`,className:hasComplex?"complex":"double",preview:rows===1?"["+value[0].map(previewValue).join(", ")+"]":`[${rows}×${cols} ${hasComplex?"complex":"double"}]`};
  }
  if(Array.isArray(value)){
    return{size:`1×${value.length}`,className:value.every(x=>x&&typeof x==="object")?"struct":"double",preview:`[1×${value.length}]`};
  }
  return{size:"1×1",className:typeof value,preview:String(value)};
}

const MATHLAB_FUNCTIONS=new Set([
  "det","transpose","inv","inverse","pinv","matmul","trace","eig","eigvec","rank","lu","qr","chol","rref","solve","linsolve","lstsq",
  "eye","zeros","ones","linspace","diag","norm","sum","mean","median","min","max",
  "var","variance","std","cov","corr","corrcoef","prctile","percentile","quantile","dot","cross","reshape","repmat","fliplr","flipud","rot90","kron","blkdiag",
  "polyfit","polyval","polyder","polyint","deconv","roots","complex","real","imag","conj","angle","fft","ifft","fftshift","ifftshift","conv","xcorr","movmean","rms","detrend","trapz","cumtrapz","gradient","interp1","derivative","integral","fzero","rk4","ode4",
  "numel","rows","cols","size","length","abs","sqrt","sin","cos","tan","exp","log",
  "any","all","find","mod","prod","cumsum","cumprod","diff","sort","unique",
  "round","floor","ceil","fix","sign","rem","isfinite","isnan","isempty","feval","arrayfun"
]);
function isFunctionHandle(value){return Boolean(value&&typeof value==="object"&&value.__mathlabFunctionHandle===true)}
function createFunctionHandle(source,workspace){
  const text=String(source).trim();
  const named=text.match(/^@([A-Za-z][A-Za-z0-9_]*)$/);
  if(named)return{__mathlabFunctionHandle:true,named:named[1],params:null,expression:null,closure:{}};
  const match=text.match(/^@\(([^)]*)\)\s*(.+)$/);
  if(!match)return null;
  const params=match[1].split(",").map(x=>x.trim()).filter(Boolean);
  if(params.some(p=>!/^[A-Za-z][A-Za-z0-9_]*$/.test(p)))throw new Error("INVALID_FUNCTION_HANDLE");
  const closure={};
  for(const [key,value] of Object.entries(workspace))closure[key]=clone(value);
  return{__mathlabFunctionHandle:true,named:null,params,expression:match[2].trim(),closure};
}
function invokeFunctionHandle(handle,argSources,callerWorkspace,functions){
  const values=argSources.map(source=>clone(evalValue(source,callerWorkspace,functions)));
  return invokeFunctionHandleValues(handle,values,functions);
}
function invokeFunctionHandleValues(handle,args,functions){
  if(handle.named){
    const local={};args.forEach((value,i)=>{local["__arg"+i]=clone(value)});
    return evalCommand(handle.named+"("+args.map((_,i)=>"__arg"+i).join(",")+")",local,functions);
  }
  if(args.length!==handle.params.length)throw new Error("INVALID_ARGUMENT_COUNT");
  const local={};
  for(const [key,value] of Object.entries(handle.closure??{}))local[key]=clone(value);
  handle.params.forEach((param,i)=>{local[param]=clone(args[i])});
  return evalValue(handle.expression,local,functions);
}
function invokeUserFunction(fn,argSources,callerWorkspace,functions,requestedOutputs=1){
  if(argSources.length!==fn.params.length)throw new Error("INVALID_ARGUMENT_COUNT");
  const local={nargin:argSources.length,nargout:requestedOutputs};
  fn.params.forEach((param,i)=>{local[param]=clone(evalValue(argSources[i],callerWorkspace,functions))});
  const callerMeta=scopeFor(callerWorkspace);
  const result=runMathLabScript(fn.body,local,{functions,isFunction:true,runtimeState:callerMeta?.runtimeState,currentFunction:fn.name});
  if(!result.ok)throw new Error(result.error?.message??"FUNCTION_EXECUTION_ERROR");
  const values=fn.outputs.map(output=>{
    if(!Object.prototype.hasOwnProperty.call(result.workspace,output))throw new Error("FUNCTION_OUTPUT_NOT_ASSIGNED");
    return clone(result.workspace[output]);
  });
  return{values,workspace:result.workspace};
}

function evalValue(source,workspace,functions={}){
  const stripped=stripOuterParens(source);
  const transposeInfo=stripTranspose(stripped);
  if(transposeInfo.transpose){
    const value=evalValue(transposeInfo.source,workspace,functions);
    if(typeof value==="number")return value;
    if(!isMatrix(value))throw new Error("INVALID_MATRIX_OPERATION");
    return transpose(value);
  }
  const text=transposeInfo.source;
  const anonymous=createFunctionHandle(text,workspace);
  if(anonymous)return anonymous;
  for(const operators of [["||"],["&&"],["|"],["&"],["==","~=",">=","<=",">","<"]]){
    const match=findTopLevelOperator(text,operators);
    if(match){
      const leftText=text.slice(0,match.index).trim();
      const rightText=text.slice(match.index+match.op.length).trim();
      if(!leftText||!rightText)continue;
      return binaryLogicalOperation(match.op,evalValue(leftText,workspace,functions),evalValue(rightText,workspace,functions));
    }
  }
  if(text.startsWith("~")&&!text.startsWith("~=")){
    const value=evalValue(text.slice(1),workspace,functions);
    if(typeof value==="number")return value===0?1:0;
    return mapNumericLike(value,x=>x===0?1:0);
  }
  for(const operators of [["+","-"],[".*","./","*","/","\\"],[".^","^"]]){
    const match=findTopLevelOperator(text,operators);
    if(match){
      const leftText=text.slice(0,match.index).trim();
      const rightText=text.slice(match.index+match.op.length).trim();
      if(!leftText||!rightText)continue;
      return binaryArrayOperation(match.op,evalValue(leftText,workspace,functions),evalValue(rightText,workspace,functions));
    }
  }
  if(Object.prototype.hasOwnProperty.call(workspace,text))return clone(workspace[text]);
  if(text.startsWith("[")&&text.endsWith("]"))return parseMatrix(text,workspace,functions);
  const range=colonValues(text,workspace);
  if(range)return[range];
  const nestedCall=text.match(/^([A-Za-z][A-Za-z0-9_]*)\((.*)\)$/);
  if(nestedCall&&Object.prototype.hasOwnProperty.call(workspace,nestedCall[1])){
    const target=workspace[nestedCall[1]];
    if(isFunctionHandle(target))return invokeFunctionHandle(target,splitArgs(nestedCall[2]),workspace,functions);
    return indexWorkspaceValue(target,nestedCall[2],workspace,functions);
  }
  if(nestedCall&&functions[nestedCall[1].toLowerCase()]){
    const fn=functions[nestedCall[1].toLowerCase()];
    if(!fn.outputs.length)throw new Error("FUNCTION_HAS_NO_OUTPUT");
    return invokeUserFunction(fn,splitArgs(nestedCall[2]),workspace,functions,1).values[0];
  }
  if(nestedCall&&MATHLAB_FUNCTIONS.has(nestedCall[1].toLowerCase()))return evalCommand(text,workspace,functions);
  return numericExpression(text,workspace);
}

function evalCommand(expr,workspace,functions={}){
  const text=expr.trim();
  if(text.startsWith("[")&&text.endsWith("]"))return parseMatrix(text,workspace,functions);
  const call=text.match(/^([A-Za-z][A-Za-z0-9_]*)\((.*)\)$/);
  if(call&&Object.prototype.hasOwnProperty.call(workspace,call[1])){
    const target=workspace[call[1]];
    if(isFunctionHandle(target))return invokeFunctionHandle(target,splitArgs(call[2]),workspace,functions);
    return indexWorkspaceValue(target,call[2],workspace,functions);
  }
  if(call&&functions[call[1].toLowerCase()])return evalValue(text,workspace,functions);
  if(call){
    const fn=call[1].toLowerCase(),args=splitArgs(call[2]).map(x=>evalValue(x,workspace,functions));
    if(fn==="det"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return determinant(args[0])}
    if(fn==="transpose"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return transpose(args[0])}
    if(fn==="inv"||fn==="inverse"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return inverse(args[0])}
    if(fn==="pinv"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return pseudoInverse(args[0])}
    if(fn==="matmul"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return matrixMultiply(args[0],args[1])}
    if(fn==="trace"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return trace(args[0])}
    if(fn==="eig"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return eigenvalues(args[0])}
    if(fn==="eigvec"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return eigenvectors(args[0])}
    if(fn==="rank"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return matrixRank(args[0])}
    if(fn==="lu"||fn==="qr")throw new Error("MULTIPLE_OUTPUTS_REQUIRED")
    if(fn==="chol"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return choleskyDecomposition(args[0])}
    if(fn==="rref"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return reducedRowEchelon(args[0])}
    if(fn==="solve"||fn==="linsolve"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return solveLinearMatrix(args[0],args[1])}
    if(fn==="lstsq"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return leastSquaresSolve(args[0],args[1])}
    if(fn==="eye"){if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");return identity(args[0],args[1]??args[0])}
    if(fn==="zeros"){if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");return zeros(args[0],args[1]??args[0])}
    if(fn==="ones"){if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");return ones(args[0],args[1]??args[0])}
    if(fn==="linspace"){if(args.length!==3)throw new Error("INVALID_ARGUMENT_COUNT");return linspace(args[0],args[1],args[2])}
    if(fn==="diag"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return diagonal(args[0])}
    if(fn==="norm"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return euclideanNorm(args[0])}
    if(fn==="sum"){
      if(args.length===1)return numericValues(args[0]).reduce((a,b)=>a+b,0);
      if(args.length===2)return reduceByDimension(args[0],args[1],values=>values.reduce((a,b)=>a+b,0));
      throw new Error("INVALID_ARGUMENT_COUNT");
    }
    if(fn==="mean"){
      if(args.length===1){const a=numericValues(args[0]);return a.reduce((x,y)=>x+y,0)/a.length}
      if(args.length===2)return reduceByDimension(args[0],args[1],values=>values.reduce((a,b)=>a+b,0)/values.length);
      throw new Error("INVALID_ARGUMENT_COUNT");
    }
    if(fn==="median"){
      if(args.length===1)return median(args[0]);
      if(args.length===2)return reduceByDimension(args[0],args[1],medianValues);
      throw new Error("INVALID_ARGUMENT_COUNT");
    }
    if(fn==="min"){
      if(args.length===1)return Math.min(...numericValues(args[0]));
      if(args.length===2)return reduceByDimension(args[0],args[1],values=>Math.min(...values));
      throw new Error("INVALID_ARGUMENT_COUNT");
    }
    if(fn==="max"){
      if(args.length===1)return Math.max(...numericValues(args[0]));
      if(args.length===2)return reduceByDimension(args[0],args[1],values=>Math.max(...values));
      throw new Error("INVALID_ARGUMENT_COUNT");
    }
    if(fn==="var"||fn==="variance"){
      if(args.length===1)return variance(args[0]);
      if(args.length===2)return reduceByDimension(args[0],args[1],varianceValues);
      throw new Error("INVALID_ARGUMENT_COUNT");
    }
    if(fn==="std"){
      if(args.length===1)return Math.sqrt(variance(args[0]));
      if(args.length===2)return reduceByDimension(args[0],args[1],values=>Math.sqrt(varianceValues(values)));
      throw new Error("INVALID_ARGUMENT_COUNT");
    }
    if(fn==="cov"){if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");return covariance(args[0],args[1]??args[0])}
    if(fn==="corr"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return correlation(args[0],args[1])}
    if(fn==="corrcoef"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");const r=correlation(args[0],args[1]);return [[1,r],[r,1]]}
    if(fn==="prctile"||fn==="percentile"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return percentileMidpoint(args[0],args[1])}
    if(fn==="quantile"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return quantileMidpoint(args[0],args[1])}
    if(fn==="dot"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return dot(args[0],args[1])}
    if(fn==="cross"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return cross(args[0],args[1])}
    if(fn==="reshape"){if(args.length!==3)throw new Error("INVALID_ARGUMENT_COUNT");return reshape(args[0],args[1],args[2])}
    if(fn==="repmat"){if(args.length!==3)throw new Error("INVALID_ARGUMENT_COUNT");return repeatMatrix(args[0],args[1],args[2])}
    if(fn==="fliplr"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return flipLeftRight(args[0])}
    if(fn==="flipud"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return flipUpDown(args[0])}
    if(fn==="rot90"){if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");return rotate90(args[0],args[1]??1)}
    if(fn==="kron"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return kroneckerProduct(args[0],args[1])}
    if(fn==="blkdiag"){return blockDiagonal(args)}
    if(fn==="polyfit"){if(args.length!==3)throw new Error("INVALID_ARGUMENT_COUNT");return polynomialFit(args[0],args[1],args[2])}
    if(fn==="polyval"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return polynomialValue(args[0],args[1])}
    if(fn==="polyder"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return polynomialDerivative(args[0])}
    if(fn==="polyint"){if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");return polynomialIntegral(args[0],args[1]??0)}
    if(fn==="deconv"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return deconvolveSignals(args[0],args[1]).quotient}
    if(fn==="roots"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return polynomialRoots(args[0])}
    if(fn==="complex"){if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");return normalizeScalar(complex(args[0],args[1]??0))}
    if(fn==="real"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return complexParts(args[0],"real")}
    if(fn==="imag"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return complexParts(args[0],"imag")}
    if(fn==="conj"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return complexParts(args[0],"conj")}
    if(fn==="angle"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return complexParts(args[0],"angle")}
    if(fn==="fft"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return discreteFourierTransform(args[0],false)}
    if(fn==="ifft"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return discreteFourierTransform(args[0],true)}
    if(fn==="fftshift"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return shiftSignal(args[0],false)}
    if(fn==="ifftshift"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return shiftSignal(args[0],true)}
    if(fn==="conv"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return convolveSignals(args[0],args[1])}
    if(fn==="xcorr"){if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");return crossCorrelation(args[0],args[1]??args[0])}
    if(fn==="movmean"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return movingMean(args[0],args[1])}
    if(fn==="rms"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return rootMeanSquare(args[0])}
    if(fn==="detrend"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return detrendSignal(args[0])}
    if(fn==="trapz"){if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");return trapezoidalIntegral(args[0],args[1]??null)}
    if(fn==="cumtrapz"){if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");return cumulativeTrapezoid(args[0],args[1]??null)}
    if(fn==="gradient"){if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");return numericalGradient(args[0],args[1]??1)}
    if(fn==="interp1"){if(args.length!==3)throw new Error("INVALID_ARGUMENT_COUNT");return linearInterpolate(args[0],args[1],args[2])}
    if(fn==="derivative"){if(args.length<2||args.length>3)throw new Error("INVALID_ARGUMENT_COUNT");return numericDerivative(args[0],args[1],args[2],functions)}
    if(fn==="integral"){if(args.length<3||args.length>4)throw new Error("INVALID_ARGUMENT_COUNT");return simpsonIntegral(args[0],args[1],args[2],args[3],functions)}
    if(fn==="fzero"){if(args.length<2||args.length>3)throw new Error("INVALID_ARGUMENT_COUNT");return findZero(args[0],args[1],args[2],functions)}
    if(fn==="rk4"||fn==="ode4"){if(args.length<3||args.length>4)throw new Error("INVALID_ARGUMENT_COUNT");return rk4Solve(args[0],args[1],args[2],args[3],functions)}
    if(fn==="numel"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return flatten(args[0]).length}
    if(fn==="rows"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return isMatrix(args[0])?args[0].length:1}
    if(fn==="cols"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return isMatrix(args[0])?(args[0][0]?.length??0):1}
    if(fn==="size"){
      if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");
      const arg=args[0],shape=isMatrix(arg)?[arg.length,arg[0]?.length??0]:[1,Array.isArray(arg)?arg.length:1];
      if(args.length===1)return shape;
      const dim=Number(args[1]);if(!Number.isInteger(dim)||dim<1)throw new Error("INVALID_DIMENSION");
      return shape[dim-1]??1;
    }
    if(fn==="length"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");const arg=args[0];if(isMatrix(arg))return Math.max(arg.length,arg[0]?.length??0);return Array.isArray(arg)?arg.length:1}
    if(fn==="abs"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],scalarAbs)}
    if(fn==="sqrt"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],scalarSqrt)}
    if(fn==="sin"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],scalarSin)}
    if(fn==="cos"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],scalarCos)}
    if(fn==="tan"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],x=>scalarDiv(scalarSin(x),scalarCos(x)))}
    if(fn==="exp"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],scalarExp)}
    if(fn==="log"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],scalarLog)}
    if(fn==="any"){
      if(args.length===1)return numericValues(args[0]).some(x=>x!==0)?1:0;
      if(args.length===2)return reduceByDimension(args[0],args[1],values=>values.some(x=>x!==0)?1:0);
      throw new Error("INVALID_ARGUMENT_COUNT");
    }
    if(fn==="all"){
      if(args.length===1)return numericValues(args[0]).every(x=>x!==0)?1:0;
      if(args.length===2)return reduceByDimension(args[0],args[1],values=>values.every(x=>x!==0)?1:0);
      throw new Error("INVALID_ARGUMENT_COUNT");
    }
    if(fn==="find"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return findLinearIndices(args[0])}
    if(fn==="mod"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return matrixElementwise(args[0],args[1],(a,b)=>{if(b===0)throw new Error("DIVISION_BY_ZERO");return ((a%b)+b)%b})}
    if(fn==="rem"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return matrixElementwise(args[0],args[1],(a,b)=>{if(b===0)throw new Error("DIVISION_BY_ZERO");return a%b})}
    if(fn==="prod"){
      if(args.length===1)return numericValues(args[0]).reduce((a,b)=>a*b,1);
      if(args.length===2)return reduceByDimension(args[0],args[1],values=>values.reduce((a,b)=>a*b,1));
      throw new Error("INVALID_ARGUMENT_COUNT");
    }
    if(fn==="cumsum"){
      if(args.length===1)return cumulative(numericValues(args[0]),(a,b)=>a+b,0);
      if(args.length===2)return transformByDimension(args[0],args[1],values=>cumulativeValues(values,(a,b)=>a+b,0));
      throw new Error("INVALID_ARGUMENT_COUNT");
    }
    if(fn==="cumprod"){
      if(args.length===1)return cumulative(numericValues(args[0]),(a,b)=>a*b,1);
      if(args.length===2)return transformByDimension(args[0],args[1],values=>cumulativeValues(values,(a,b)=>a*b,1));
      throw new Error("INVALID_ARGUMENT_COUNT");
    }
    if(fn==="diff"){
      if(args.length===1)return difference(numericValues(args[0]));
      if(args.length===2)return rowVector(differenceOrder(numericValues(args[0]),args[1]));
      if(args.length===3)return transformByDimension(args[0],args[2],values=>differenceOrder(values,args[1]));
      throw new Error("INVALID_ARGUMENT_COUNT");
    }
    if(fn==="sort"){
      if(args.length===1)return rowVector(numericValues(args[0]).slice().sort((a,b)=>a-b));
      if(args.length===2)return transformByDimension(args[0],args[1],values=>values.sort((a,b)=>a-b));
      throw new Error("INVALID_ARGUMENT_COUNT");
    }
    if(fn==="unique"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return uniqueSorted(numericValues(args[0]))}
    if(fn==="round"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],Math.round)}
    if(fn==="floor"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],Math.floor)}
    if(fn==="ceil"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],Math.ceil)}
    if(fn==="fix"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],Math.trunc)}
    if(fn==="sign"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],Math.sign)}
    if(fn==="isfinite"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],x=>Number.isFinite(x)?1:0)}
    if(fn==="isnan"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],x=>Number.isNaN(x)?1:0)}
    if(fn==="isempty"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return Array.isArray(args[0])&&flatten(args[0]).length===0?1:0}
    if(fn==="feval"){
      if(args.length<1||!isFunctionHandle(args[0]))throw new Error("FUNCTION_HANDLE_REQUIRED");
      return invokeFunctionHandleValues(args[0],args.slice(1),functions);
    }
    if(fn==="arrayfun"){
      if(args.length!==2||!isFunctionHandle(args[0]))throw new Error("FUNCTION_HANDLE_REQUIRED");
      return mapNumericLike(args[1],value=>invokeFunctionHandleValues(args[0],[value],functions));
    }
    return numericExpression(text,workspace);
  }
  return evalValue(text,workspace,functions);
}

function executeSimpleStatement(source,suppressed,context,lineNumber){
  const {workspace,functions,outputs,events,options}=context;
  syncGlobalsIntoWorkspace(workspace);
  const raw=source+(suppressed?";":"");
  const globalDecl=source.match(/^global\s+(.+)$/i);
  if(globalDecl){
    const meta=scopeFor(workspace),names=globalDecl[1].split(/\s+/).filter(Boolean);
    for(const name of names){
      if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(name))throw new Error("INVALID_VARIABLE_NAME");
      meta.globalNames.add(name);
      if(Object.prototype.hasOwnProperty.call(meta.runtimeState.globals,name))workspace[name]=clone(meta.runtimeState.globals[name]);
      else meta.runtimeState.globals[name]=clone(Object.prototype.hasOwnProperty.call(workspace,name)?workspace[name]:[]);
    }
    syncGlobalsIntoWorkspace(workspace);return;
  }
  const persistentDecl=source.match(/^persistent\s+(.+)$/i);
  if(persistentDecl){
    const meta=scopeFor(workspace);
    if(!meta?.currentFunction)throw new Error("PERSISTENT_OUTSIDE_FUNCTION");
    const bucket=meta.runtimeState.persistents[meta.currentFunction]??={};
    for(const name of persistentDecl[1].split(/\s+/).filter(Boolean)){
      if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(name))throw new Error("INVALID_VARIABLE_NAME");
      meta.persistentNames.add(name);
      workspace[name]=Object.prototype.hasOwnProperty.call(bucket,name)?clone(bucket[name]):[];
    }
    return;
  }
  const command=source.match(/^(clear|clc|who|whos)(?:\s+(.*))?$/i);
  if(command){
    const cmd=command[1].toLowerCase(),arg=(command[2]??"").trim();
    if(cmd==="clc"){events.push({type:"clear-output",line:lineNumber});return}
    if(cmd==="clear"){
      const meta=scopeFor(workspace),lowerArg=arg.toLowerCase();
      if(!arg){for(const key of Object.keys(workspace))delete workspace[key]}
      else if(lowerArg==="all"){
        for(const key of Object.keys(workspace))delete workspace[key];
        meta.runtimeState.globals={};meta.runtimeState.persistents={};
        meta.globalNames.clear();meta.persistentNames.clear();
      }else if(lowerArg==="functions")meta.runtimeState.persistents={};
      else if(lowerArg==="global"||lowerArg.startsWith("global ")){
        const names=arg.split(/\s+/).slice(1);
        if(!names.length){meta.runtimeState.globals={};meta.globalNames.clear()}
        else for(const name of names){delete meta.runtimeState.globals[name];meta.globalNames.delete(name);delete workspace[name]}
      }else for(const key of arg.split(/\s+/).filter(Boolean))delete workspace[key];
      events.push({type:"workspace-changed",line:lineNumber});return;
    }
    const names=Object.keys(workspace).sort();
    if(cmd==="who")outputs.push({line:lineNumber,source:raw,name:"",value:names.join("    ")||"(none)",kind:"who"});
    else outputs.push({line:lineNumber,source:raw,name:"",value:names.map(name=>({name,...describeMathLabValue(workspace[name])})),kind:"whos"});
    return;
  }
  const multiAssignment=source.match(/^\[([^\]]+)\]\s*=\s*([A-Za-z][A-Za-z0-9_]*)\((.*)\)$/);
  if(multiAssignment&&["lu","qr"].includes(multiAssignment[2].toLowerCase())){
    const name=multiAssignment[2].toLowerCase(),targets=multiAssignment[1].split(",").map(x=>x.trim()).filter(Boolean);
    const argSources=splitArgs(multiAssignment[3]);
    if(argSources.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");
    const matrix=evalValue(argSources[0],workspace,functions);
    let values;
    if(name==="lu"){
      if(targets.length<2||targets.length>3)throw new Error("INVALID_OUTPUT_COUNT");
      const result=luDecomposition(matrix);
      values=targets.length===2?[matrixMultiply(transpose(result.P),result.L),result.U]:[result.L,result.U,result.P];
    }else{
      if(targets.length!==2)throw new Error("INVALID_OUTPUT_COUNT");
      const result=qrDecomposition(matrix);values=[result.Q,result.R];
    }
    targets.forEach((target,i)=>{workspace[target]=clone(values[i])});
    syncScopeState(workspace);
    if(!suppressed&&!options.isFunction)outputs.push({line:lineNumber,source:raw,name:targets.join(","),value:targets.map(t=>clone(workspace[t]))});
    return;
  }
  if(multiAssignment&&multiAssignment[2].toLowerCase()==="deconv"){
    const targets=multiAssignment[1].split(",").map(x=>x.trim()).filter(Boolean);
    if(targets.length>2)throw new Error("TOO_MANY_OUTPUTS");
    const argSources=splitArgs(multiAssignment[3]);
    if(argSources.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");
    const result=deconvolveSignals(
      evalValue(argSources[0],workspace,functions),
      evalValue(argSources[1],workspace,functions)
    );
    const values=[result.quotient,result.remainder];
    targets.forEach((target,i)=>{workspace[target]=clone(values[i])});
    syncScopeState(workspace);
    if(!suppressed&&!options.isFunction)outputs.push({line:lineNumber,source:raw,name:targets.join(","),value:targets.map(t=>clone(workspace[t]))});
    return;
  }
  if(multiAssignment&&functions[multiAssignment[2].toLowerCase()]){
    const targets=multiAssignment[1].split(",").map(x=>x.trim()).filter(Boolean);
    const fn=functions[multiAssignment[2].toLowerCase()];
    if(targets.length>fn.outputs.length)throw new Error("TOO_MANY_OUTPUTS");
    const invoked=invokeUserFunction(fn,splitArgs(multiAssignment[3]),workspace,functions,targets.length);
    const values=invoked.values;
    targets.forEach((target,i)=>{workspace[target]=values[i]});
    if(!suppressed&&!options.isFunction)outputs.push({line:lineNumber,source:raw,name:targets.join(","),value:targets.map(t=>clone(workspace[t]))});
    return;
  }
  const standaloneCall=source.match(/^([A-Za-z][A-Za-z0-9_]*)\((.*)\)$/);
  if(standaloneCall&&functions[standaloneCall[1].toLowerCase()]&&!functions[standaloneCall[1].toLowerCase()].outputs.length){
    invokeUserFunction(functions[standaloneCall[1].toLowerCase()],splitArgs(standaloneCall[2]),workspace,functions,0);
    return;
  }
  const indexedAssignment=source.match(/^([A-Za-z][A-Za-z0-9_]*)\s*\((.*)\)\s*=\s*(.+)$/);
  if(indexedAssignment){
    const name=indexedAssignment[1],indexSource=indexedAssignment[2];
    const rhs=evalCommand(indexedAssignment[3],workspace,functions);
    if(!Object.prototype.hasOwnProperty.call(workspace,name)){
      if((Array.isArray(rhs)&&rhs.length===0)||indexSource.includes(":"))throw new Error("UNDEFINED_VARIABLE");
      workspace[name]=[[0]];
    }
    workspace[name]=assignWorkspaceIndex(workspace[name],indexSource,rhs,workspace,functions);
    if(!suppressed)outputs.push({line:lineNumber,source:raw,name,value:clone(workspace[name])});
    syncScopeState(workspace);
    return;
  }
  const assignment=source.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
  if(assignment){
    const value=evalCommand(assignment[2],workspace,functions);
    workspace[assignment[1]]=clone(value);
    if(!suppressed&&!options.isFunction)outputs.push({line:lineNumber,source:raw,name:assignment[1],value:clone(value)});
    syncScopeState(workspace);
    return;
  }
  const value=evalCommand(source,workspace,functions);
  workspace.ans=clone(value);
  syncScopeState(workspace);
  if(!suppressed&&!options.isFunction)outputs.push({line:lineNumber,source:raw,name:"ans",value:clone(value)});
}

function executeLines(lines,context,baseLine=0,loopDepth=0){
  for(let i=0;i<lines.length;i++){
    const clean=stripInlineComment(lines[i]).trim();
    if(!clean||clean.startsWith("#"))continue;
    const lower=clean.toLowerCase();
    const lineNumber=baseLine+i+1;
    try{
      syncGlobalsIntoWorkspace(context.workspace);
      if(/^if\b/i.test(clean)){
        const end=findBlockEnd(lines,i);
        const branches=splitIfBranches(lines,i,end);
        for(const branch of branches){
          if(branch.condition===null||scalarTruth(evalValue(branch.condition,context.workspace,context.functions))){
            const result=executeLines(branch.lines,context,baseLine+branch.offset,loopDepth);
            if(!result.ok||result.signal)return result;
            break;
          }
        }
        i=end;continue;
      }
      const switchMatch=clean.match(/^switch\s+(.+)$/i);
      if(switchMatch){
        const end=findBlockEnd(lines,i),selector=evalValue(switchMatch[1],context.workspace,context.functions);
        const cases=splitSwitchCases(lines,i,end);let selected=null;
        for(const branch of cases){
          if(branch.otherwise){if(!selected)selected=branch;continue}
          if(switchMatches(selector,evalValue(branch.expression,context.workspace,context.functions))){selected=branch;break}
        }
        if(selected){
          const result=executeLines(selected.lines,context,baseLine+selected.offset,loopDepth);
          if(!result.ok||result.signal)return result;
        }
        i=end;continue;
      }
      if(lower==="try"){
        const end=findBlockEnd(lines,i),parts=splitTryCatch(lines,i,end);
        const attempted=executeLines(parts.tryLines,context,baseLine+parts.tryOffset,loopDepth);
        if(!attempted.ok){
          if(parts.catchLines===null)return attempted;
          if(parts.catchName){
            if(!/^[A-Za-z][A-Za-z0-9_]*$/.test(parts.catchName))throw new Error("INVALID_VARIABLE_NAME");
            context.workspace[parts.catchName]={message:attempted.error?.message??"MATHLAB_ERROR",line:attempted.error?.line??lineNumber,source:attempted.error?.source??""};
          }
          const recovered=executeLines(parts.catchLines,context,baseLine+parts.catchOffset,loopDepth);
          if(!recovered.ok||recovered.signal)return recovered;
        }else if(attempted.signal)return attempted;
        i=end;continue;
      }
      const forMatch=clean.match(/^for\s+([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/i);
      if(forMatch){
        const end=findBlockEnd(lines,i);
        const body=lines.slice(i+1,end);
        const sequence=numericValues(evalValue(forMatch[2],context.workspace,context.functions));
        if(sequence.length>MAX_LOOP_ITERATIONS)throw new Error("LOOP_ITERATION_LIMIT");
        for(const value of sequence){
          context.workspace[forMatch[1]]=value;
          const result=executeLines(body,context,baseLine+i+1,loopDepth+1);
          if(!result.ok)return result;
          if(result.signal==="return")return result;
          if(result.signal==="break")break;
          if(result.signal==="continue")continue;
        }
        i=end;continue;
      }
      const whileMatch=clean.match(/^while\s+(.+)$/i);
      if(whileMatch){
        const end=findBlockEnd(lines,i);
        const body=lines.slice(i+1,end);
        let iterations=0;
        while(scalarTruth(evalValue(whileMatch[1],context.workspace,context.functions))){
          iterations++;
          if(iterations>MAX_LOOP_ITERATIONS)throw new Error("LOOP_ITERATION_LIMIT");
          const result=executeLines(body,context,baseLine+i+1,loopDepth+1);
          if(!result.ok)return result;
          if(result.signal==="return")return result;
          if(result.signal==="break")break;
          if(result.signal==="continue")continue;
        }
        i=end;continue;
      }
      if(lower==="break"){
        if(loopDepth<1)throw new Error("BREAK_OUTSIDE_LOOP");
        return{ok:true,signal:"break"};
      }
      if(lower==="continue"){
        if(loopDepth<1)throw new Error("CONTINUE_OUTSIDE_LOOP");
        return{ok:true,signal:"continue"};
      }
      if(lower==="return")return{ok:true,signal:"return"};
      if(lower==="else"||/^elseif\b/.test(lower)||/^case\b/.test(lower)||lower==="otherwise"||/^catch\b/.test(lower)||lower==="end")throw new Error("UNEXPECTED_BLOCK_TOKEN");
      const statements=splitStatements(clean);
      for(const statement of statements){
        if(statement.source)executeSimpleStatement(statement.source,statement.suppressed,context,lineNumber);
      }
    }catch(error){
      return{ok:false,error:{message:error.message||"MATHLAB_ERROR",line:lineNumber,source:clean}};
    }
  }
  return{ok:true};
}

export function runMathLabScript(script,initialWorkspace={},options={}){
  let parsed;
  try{parsed=parseUserFunctions(script)}catch(error){
    return{ok:false,workspace:{...initialWorkspace},outputs:[],events:[],runtimeState:normalizeRuntimeState(options.runtimeState),error:{message:error.message||"MATHLAB_ERROR",line:1,source:"function"}};
  }
  const functions={...(options.functions??{}),...parsed.functions};
  const workspace={...initialWorkspace},outputs=[],events=[];
  const runtimeState=options.runtimeState??normalizeRuntimeState();
  if(!runtimeState.globals)runtimeState.globals={};
  if(!runtimeState.persistents)runtimeState.persistents={};
  const context={workspace,functions,outputs,events,options:{...options,runtimeState}};
  scopeMetadata.set(workspace,{runtimeState,currentFunction:options.currentFunction??null,globalNames:new Set(),persistentNames:new Set()});
  const result=executeLines(String(parsed.script??"").split(/\r?\n/),context,0,0);
  syncScopeState(workspace);
  if(!result.ok)return{ok:false,workspace,outputs,events,runtimeState,error:result.error};
  return{ok:true,workspace,outputs,events,runtimeState};
}
