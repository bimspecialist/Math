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
  const r=evaluateExpression(s,{angleMode:"DEG",ans:"0"});
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

function evalCommand(expr,workspace){
  const text=expr.trim();
  if(text.startsWith("[")&&text.endsWith("]"))return parseMatrix(text,workspace);
  const call=text.match(/^([A-Za-z][A-Za-z0-9_]*)\(([^()]*)\)$/);
  if(call){
    const fn=call[1].toLowerCase(),argName=call[2].trim();
    const arg=Object.prototype.hasOwnProperty.call(workspace,argName)?workspace[argName]:null;
    if(fn==="det"){if(arg===null)throw new Error("UNKNOWN_VARIABLE");return determinant(arg)}
    if(fn==="transpose"){if(arg===null)throw new Error("UNKNOWN_VARIABLE");return transpose(arg)}
    if(fn==="sum"){if(arg===null)throw new Error("UNKNOWN_VARIABLE");return flatten(arg).reduce((a,b)=>a+b,0)}
    if(fn==="mean"){if(arg===null)throw new Error("UNKNOWN_VARIABLE");const a=flatten(arg);return a.reduce((x,y)=>x+y,0)/a.length}
    if(fn==="size"){if(arg===null)throw new Error("UNKNOWN_VARIABLE");return isMatrix(arg)?[arg.length,arg[0]?.length??0]:[1,1]}
  }
  if(Object.prototype.hasOwnProperty.call(workspace,text))return clone(workspace[text]);
  return numericExpression(text,workspace);
}

export function runMathLabScript(script,initialWorkspace={}){
  const workspace={...initialWorkspace};
  const outputs=[];
  const lines=String(script??"").split(/\r?\n/);
  try{
    for(let i=0;i<lines.length;i++){
      const source=lines[i].trim();
      if(!source||source.startsWith("%")||source.startsWith("#"))continue;
      const assignment=source.match(/^([A-Za-z][A-Za-z0-9_]*)\s*=\s*(.+)$/);
      if(assignment){
        const value=evalCommand(assignment[2],workspace);
        workspace[assignment[1]]=clone(value);
        outputs.push({line:i+1,source,name:assignment[1],value:clone(value)});
      }else{
        outputs.push({line:i+1,source,value:clone(evalCommand(source,workspace))});
      }
    }
    return{ok:true,workspace,outputs};
  }catch(error){
    return{ok:false,workspace,outputs,error:{message:error.message||"MATHLAB_ERROR"}};
  }
}
