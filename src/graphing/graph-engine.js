import { evaluateExpression } from "../calculator/math-engine.js";

const normalizeExpression=s=>String(s??"").trim().replace(/^y\s*=\s*/i,"");

function evaluateAtX(source,x){
  const expr=source.replace(/\bx\b/gi,`(${x})`);
  const r=evaluateExpression(expr,{angleMode:"RAD",ans:"0"});
  return r.kind==="value"&&Number.isFinite(r.numeric)?r.numeric:null;
}

function median(values){
  if(!values.length)return 0;
  const sorted=[...values].sort((a,b)=>a-b),mid=Math.floor(sorted.length/2);
  return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;
}

function markDiscontinuities(source,samples){
  const typical=Math.max(1e-9,median(samples.map(p=>Math.abs(p.y)).filter(Number.isFinite)));
  for(let i=1;i<samples.length;i++){
    const prev=samples[i-1],current=samples[i];
    if(!Number.isFinite(prev.y)||!Number.isFinite(current.y)){current.breakBefore=true;continue}
    const midX=(prev.x+current.x)/2,midY=evaluateAtX(source,midX);
    if(!Number.isFinite(midY)){current.breakBefore=true;continue}
    const endpointScale=Math.max(1,Math.abs(prev.y),Math.abs(current.y));
    const linearMid=(prev.y+current.y)/2;
    const curvature=Math.abs(midY-linearMid);
    const signFlip=prev.y*current.y<0;
    const asymptoteSpike=Math.abs(midY)>endpointScale*8;
    const extremeSignFlip=signFlip&&Math.max(Math.abs(prev.y),Math.abs(current.y),Math.abs(midY))>Math.max(20,typical*12);
    const nonlinearJump=curvature>endpointScale*6&&Math.abs(midY)>Math.max(10,typical*8);
    if(asymptoteSpike||extremeSignFlip||nonlinearJump)current.breakBefore=true;
  }
  return samples;
}

export function sampleGraphExpression(source,{minX=-10,maxX=10,points=401}={}){
  source=normalizeExpression(source);
  minX=Number(minX);maxX=Number(maxX);points=Math.max(2,Math.min(2000,Math.round(Number(points)||401)));
  if(!source||!Number.isFinite(minX)||!Number.isFinite(maxX)||maxX<=minX)return{ok:false,error:"INVALID_GRAPH_RANGE",samples:[]};
  const samples=[];
  for(let i=0;i<points;i++){
    const x=minX+(maxX-minX)*(i/(points-1));
    samples.push({x,y:evaluateAtX(source,x),breakBefore:false});
  }
  markDiscontinuities(source,samples);
  return{ok:true,expression:source,minX,maxX,samples};
}

export function graphBounds(samples,{fallbackMinY=-10,fallbackMaxY=10}={}){
  const finite=samples.map((p,i)=>({i,y:p.y})).filter(p=>Number.isFinite(p.y));
  if(!finite.length)return{minY:fallbackMinY,maxY:fallbackMaxY};
  const breaks=samples.map((p,i)=>p.breakBefore?i:-1).filter(i=>i>=0);
  const robust=breaks.length
    ?finite.filter(p=>!breaks.some(i=>Math.abs(p.i-i)<=3))
    :finite;
  let ys=(robust.length>=Math.max(4,Math.floor(finite.length*.5))?robust:finite).map(p=>p.y);
  if(breaks.length&&ys.length>=20){
    const sorted=[...ys].sort((a,b)=>a-b);
    const trim=Math.max(1,Math.floor(sorted.length*.05));
    ys=sorted.slice(trim,sorted.length-trim);
  }
  let minY=Math.min(...ys),maxY=Math.max(...ys);
  if(minY===maxY){minY-=1;maxY+=1}
  const span=maxY-minY;
  return{minY:minY-span*.08,maxY:maxY+span*.08};
}

export function resolveGraphYBounds(samples,{minY,maxY}={}){
  const hasMin=minY!==""&&minY!==null&&minY!==undefined;
  const hasMax=maxY!==""&&maxY!==null&&maxY!==undefined;
  if(!hasMin&&!hasMax)return{ok:true,...graphBounds(samples),auto:true};
  if(!hasMin||!hasMax)return{ok:false,error:"INVALID_GRAPH_Y_RANGE"};
  const lo=Number(minY),hi=Number(maxY);
  if(!Number.isFinite(lo)||!Number.isFinite(hi)||hi<=lo)return{ok:false,error:"INVALID_GRAPH_Y_RANGE"};
  return{ok:true,minY:lo,maxY:hi,auto:false};
}

export function sampleGraphExpressions(source,options={}){
  const expressions=String(source??"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,6);
  if(!expressions.length)return{ok:false,error:"EMPTY_GRAPH_EXPRESSION",series:[]};
  const series=expressions.map(expression=>{
    const result=sampleGraphExpression(expression,options);
    return{expression,result,...(result.ok?{samples:result.samples,minX:result.minX,maxX:result.maxX}:{samples:[],error:result.error})};
  });
  const valid=series.filter(x=>x.result.ok);
  if(!valid.length)return{ok:false,error:series[0]?.error??"INVALID_GRAPH",series};
  return{ok:true,series,minX:valid[0].minX,maxX:valid[0].maxX};
}
