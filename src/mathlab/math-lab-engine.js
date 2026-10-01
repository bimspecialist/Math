import { evaluateExpression } from "../calculator/math-engine.js";

const clone=v=>Array.isArray(v)?v.map(clone):v;
const isMatrix=v=>Array.isArray(v)&&v.every(Array.isArray);
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
  if(typeof value==="number")return[[value]];
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
    let sum=0;for(let k=0;k<ac;k++)sum+=a[i][k]*b[k][j];return Math.abs(sum)<1e-12?0:sum;
  }));
}
function sameShape(a,b){
  const [ar,ac]=matrixShape(a),[br,bc]=matrixShape(b);
  return ar===br&&ac===bc;
}
function mapMatrix(m,fn){return m.map((row,r)=>row.map((value,c)=>fn(value,r,c)))}
function matrixElementwise(a,b,fn){
  if(typeof a==="number"&&typeof b==="number")return normalizeNumericResult(fn(a,b));
  if(typeof a==="number"&&isMatrix(b))return mapMatrix(b,v=>normalizeNumericResult(fn(a,v)));
  if(isMatrix(a)&&typeof b==="number")return mapMatrix(a,v=>normalizeNumericResult(fn(v,b)));
  if(isMatrix(a)&&isMatrix(b)){
    const [ar,ac]=matrixShape(a),[br,bc]=matrixShape(b);
    if((ar!==br&&ar!==1&&br!==1)||(ac!==bc&&ac!==1&&bc!==1))throw new Error("MATRIX_DIMENSION_MISMATCH");
    const rows=Math.max(ar,br),cols=Math.max(ac,bc);
    return Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>{
      const av=a[ar===1?0:r][ac===1?0:c],bv=b[br===1?0:r][bc===1?0:c];
      return normalizeNumericResult(fn(av,bv));
    }));
  }
  throw new Error("INVALID_MATRIX_OPERATION");
}
function matrixAdd(a,b){return matrixElementwise(a,b,(x,y)=>x+y)}
function matrixSubtract(a,b){return matrixElementwise(a,b,(x,y)=>x-y)}
function matrixScale(m,k){return mapMatrix(m,v=>v*k)}
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
  if(typeof a==="number"&&typeof b==="number")return a/b;
  if(isMatrix(a)&&typeof b==="number")return matrixScale(a,1/b);
  if(typeof a==="number"&&isMatrix(b))return matrixScale(inverse(b),a);
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
  if(op===".*")return matrixElementwise(left,right,(x,y)=>x*y);
  if(op==="./")return matrixElementwise(left,right,(x,y)=>x/y);
  if(op===".^")return matrixElementwise(left,right,(x,y)=>x**y);
  if(op==="*"){
    if(typeof left==="number"&&typeof right==="number")return left*right;
    if(typeof left==="number"&&isMatrix(right))return matrixScale(right,left);
    if(isMatrix(left)&&typeof right==="number")return matrixScale(left,right);
    if(isMatrix(left)&&isMatrix(right))return matrixMultiply(left,right);
  }
  if(op==="/")return matrixRightDivide(left,right);
  if(op==="^"){
    if(typeof left==="number"&&typeof right==="number")return left**right;
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
function normalizeNumericResult(value){return Object.is(value,-0)?0:value}
function mapNumericLike(value,fn){
  const apply=x=>normalizeNumericResult(fn(x));
  if(typeof value==="number")return apply(value);
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
  if(typeof value==="number")return{size:"1×1",className:"double",preview:String(value)};
  if(isMatrix(value)){
    const rows=value.length,cols=value[0]?.length??0;
    return{size:`${rows}×${cols}`,className:"double",preview:rows===1?"["+value[0].join(", ")+"]":`[${rows}×${cols} double]`};
  }
  if(Array.isArray(value)){
    return{size:`1×${value.length}`,className:value.every(x=>x&&typeof x==="object")?"struct":"double",preview:`[1×${value.length}]`};
  }
  return{size:"1×1",className:typeof value,preview:String(value)};
}

const MATHLAB_FUNCTIONS=new Set([
  "det","transpose","inv","inverse","matmul","trace","eig","eigvec","solve","linsolve",
  "eye","zeros","ones","linspace","diag","norm","sum","mean","median","min","max",
  "var","variance","std","prctile","percentile","quantile","dot","cross","reshape",
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
  for(const operators of [["+","-"],[".*","./","*","/"],[".^","^"]]){
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
    if(fn==="matmul"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return matrixMultiply(args[0],args[1])}
    if(fn==="trace"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return trace(args[0])}
    if(fn==="eig"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return eigenvalues2(args[0])}
    if(fn==="eigvec"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return eigenvectors2(args[0])}
    if(fn==="solve"||fn==="linsolve"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return solveLinearMatrix(args[0],args[1])}
    if(fn==="eye"){if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");return identity(args[0],args[1]??args[0])}
    if(fn==="zeros"){if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");return zeros(args[0],args[1]??args[0])}
    if(fn==="ones"){if(args.length<1||args.length>2)throw new Error("INVALID_ARGUMENT_COUNT");return ones(args[0],args[1]??args[0])}
    if(fn==="linspace"){if(args.length!==3)throw new Error("INVALID_ARGUMENT_COUNT");return linspace(args[0],args[1],args[2])}
    if(fn==="diag"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return diagonal(args[0])}
    if(fn==="norm"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return euclideanNorm(args[0])}
    if(fn==="sum"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return numericValues(args[0]).reduce((a,b)=>a+b,0)}
    if(fn==="mean"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");const a=numericValues(args[0]);return a.reduce((x,y)=>x+y,0)/a.length}
    if(fn==="median"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return median(args[0])}
    if(fn==="min"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return Math.min(...numericValues(args[0]))}
    if(fn==="max"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return Math.max(...numericValues(args[0]))}
    if(fn==="var"||fn==="variance"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return variance(args[0])}
    if(fn==="std"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return Math.sqrt(variance(args[0]))}
    if(fn==="prctile"||fn==="percentile"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return percentileMidpoint(args[0],args[1])}
    if(fn==="quantile"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return quantileMidpoint(args[0],args[1])}
    if(fn==="dot"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return dot(args[0],args[1])}
    if(fn==="cross"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return cross(args[0],args[1])}
    if(fn==="reshape"){if(args.length!==3)throw new Error("INVALID_ARGUMENT_COUNT");return reshape(args[0],args[1],args[2])}
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
    if(fn==="abs"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],Math.abs)}
    if(fn==="sqrt"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],x=>{if(x<0)throw new Error("DOMAIN_ERROR");return Math.sqrt(x)})}
    if(fn==="sin"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],Math.sin)}
    if(fn==="cos"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],Math.cos)}
    if(fn==="tan"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],Math.tan)}
    if(fn==="exp"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],Math.exp)}
    if(fn==="log"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return mapNumericLike(args[0],x=>{if(x<=0)throw new Error("DOMAIN_ERROR");return Math.log(x)})}
    if(fn==="any"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return numericValues(args[0]).some(x=>x!==0)?1:0}
    if(fn==="all"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return numericValues(args[0]).every(x=>x!==0)?1:0}
    if(fn==="find"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return findLinearIndices(args[0])}
    if(fn==="mod"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return matrixElementwise(args[0],args[1],(a,b)=>{if(b===0)throw new Error("DIVISION_BY_ZERO");return ((a%b)+b)%b})}
    if(fn==="rem"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return matrixElementwise(args[0],args[1],(a,b)=>{if(b===0)throw new Error("DIVISION_BY_ZERO");return a%b})}
    if(fn==="prod"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return numericValues(args[0]).reduce((a,b)=>a*b,1)}
    if(fn==="cumsum"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return cumulative(numericValues(args[0]),(a,b)=>a+b,0)}
    if(fn==="cumprod"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return cumulative(numericValues(args[0]),(a,b)=>a*b,1)}
    if(fn==="diff"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return difference(numericValues(args[0]))}
    if(fn==="sort"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return rowVector(numericValues(args[0]).slice().sort((a,b)=>a-b))}
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
