import { evaluateExpression } from "../calculator/math-engine.js";

const clone=v=>Array.isArray(v)?v.map(clone):v;
const isMatrix=v=>Array.isArray(v)&&v.every(Array.isArray);

function numericExpression(source,workspace){
  let s=String(source).trim();
  const names=Object.keys(workspace).sort((a,b)=>b.length-a.length);
  for(const name of names){
    const value=workspace[name];
    if(typeof value!=="number")continue;
    s=s.replace(new RegExp("\\b"+name+"\\b","g"),`(${value})`);
  }
  const r=evaluateExpression(s,{angleMode:"RAD",ans:"0"});
  if(r.kind!=="value")throw new Error(r.code||"INVALID_EXPRESSION");
  return r.numeric;
}

function parseMatrix(source,workspace){
  const inner=source.trim().slice(1,-1).trim();
  if(!inner)return[];
  const rows=inner.split(";").map(r=>r.trim()).filter(Boolean).map(row=>row.split(",").map(x=>numericExpression(x,workspace)));
  const width=rows[0]?.length??0;
  if(!width||rows.some(r=>r.length!==width))throw new Error("INVALID_MATRIX");
  return rows;
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

const flatten=m=>isMatrix(m)?m.flat():[m];

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

function identity(n){
  n=Number(n);if(!Number.isInteger(n)||n<1||n>100)throw new Error("INVALID_MATRIX_SIZE");
  return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));
}

function zeros(rows,cols){
  rows=Number(rows);cols=Number(cols);
  if(!Number.isInteger(rows)||!Number.isInteger(cols)||rows<1||cols<1||rows>100||cols>100)throw new Error("INVALID_MATRIX_SIZE");
  return Array.from({length:rows},()=>Array(cols).fill(0));
}

function ones(rows,cols){
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

function diagonal(m){
  const [rows,cols]=matrixShape(m),n=Math.min(rows,cols);
  return Array.from({length:n},(_,i)=>m[i][i]);
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

function percentile(value,p){
  const values=numericValues(value).slice().sort((a,b)=>a-b);
  p=Number(p);
  if(!Number.isFinite(p)||p<0||p>100)throw new Error("INVALID_PERCENTILE");
  if(values.length===1)return values[0];
  const index=(values.length-1)*(p/100);
  const lower=Math.floor(index),upper=Math.ceil(index);
  if(lower===upper)return values[lower];
  const result=values[lower]+(values[upper]-values[lower])*(index-lower);
  return Math.abs(result)<1e-12?0:Number(result.toPrecision(14));
}

function quartile(value,q){
  q=Number(q);
  if(!Number.isInteger(q)||q<0||q>4)throw new Error("INVALID_QUARTILE");
  return percentile(value,q*25);
}

function cumulativeSum(value){
  let total=0;
  return numericValues(value).map(v=>{
    total+=v;
    return Math.abs(total)<1e-12?0:Number(total.toPrecision(14));
  });
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
  const values=numericValues(value);
  if(values.length!==rows*cols)throw new Error("RESHAPE_SIZE_MISMATCH");
  return Array.from({length:rows},(_,r)=>values.slice(r*cols,(r+1)*cols));
}

function evalValue(source,workspace){
  const text=source.trim();
  if(Object.prototype.hasOwnProperty.call(workspace,text))return clone(workspace[text]);
  if(text.startsWith("[")&&text.endsWith("]"))return parseMatrix(text,workspace);
  return numericExpression(text,workspace);
}

function evalCommand(expr,workspace){
  const text=expr.trim();
  if(text.startsWith("[")&&text.endsWith("]"))return parseMatrix(text,workspace);
  const call=text.match(/^([A-Za-z][A-Za-z0-9_]*)\((.*)\)$/);
  if(call){
    const fn=call[1].toLowerCase(),args=splitArgs(call[2]).map(x=>evalValue(x,workspace));
    if(fn==="det"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return determinant(args[0])}
    if(fn==="transpose"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return transpose(args[0])}
    if(fn==="inv"||fn==="inverse"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return inverse(args[0])}
    if(fn==="matmul"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return matrixMultiply(args[0],args[1])}
    if(fn==="trace"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return trace(args[0])}
    if(fn==="eig"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return eigenvalues2(args[0])}
    if(fn==="eigvec"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return eigenvectors2(args[0])}
    if(fn==="solve"||fn==="linsolve"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return solveLinearMatrix(args[0],args[1])}
    if(fn==="eye"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return identity(args[0])}
    if(fn==="zeros"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return zeros(args[0],args[1])}
    if(fn==="ones"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return ones(args[0],args[1])}
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
    if(fn==="percentile"||fn==="prctile"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return percentile(args[0],args[1])}
    if(fn==="quartile"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return quartile(args[0],args[1])}
    if(fn==="cumsum"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return cumulativeSum(args[0])}
    if(fn==="dot"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return dot(args[0],args[1])}
    if(fn==="cross"){if(args.length!==2)throw new Error("INVALID_ARGUMENT_COUNT");return cross(args[0],args[1])}
    if(fn==="reshape"){if(args.length!==3)throw new Error("INVALID_ARGUMENT_COUNT");return reshape(args[0],args[1],args[2])}
    if(fn==="numel"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return numericValues(args[0]).length}
    if(fn==="rows"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return isMatrix(args[0])?args[0].length:1}
    if(fn==="cols"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");return isMatrix(args[0])?(args[0][0]?.length??0):1}
    if(fn==="size"){if(args.length!==1)throw new Error("INVALID_ARGUMENT_COUNT");const arg=args[0];return isMatrix(arg)?[arg.length,arg[0]?.length??0]:[1,1]}
  }
  return evalValue(text,workspace);
}

export function runMathLabScript(script,initialWorkspace={}){
  const workspace={...initialWorkspace};
  const outputs=[];
  const lines=String(script??"").split(/\r?\n/);
  for(let i=0;i<lines.length;i++){
    const source=lines[i].trim();
    if(!source||source.startsWith("%")||source.startsWith("#"))continue;
    try{
      const assignment=source.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
      if(assignment){
        const value=evalCommand(assignment[2],workspace);
        workspace[assignment[1]]=clone(value);
        outputs.push({line:i+1,source,name:assignment[1],value:clone(value)});
      }else{
        outputs.push({line:i+1,source,value:clone(evalCommand(source,workspace))});
      }
    }catch(error){
      return{ok:false,workspace,outputs,error:{message:error.message||"MATHLAB_ERROR",line:i+1,source}};
    }
  }
  return{ok:true,workspace,outputs};
}
