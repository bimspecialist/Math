import { evaluateExpression } from "../calculator/math-engine.js";

const normalizeExpression=s=>String(s??"").trim().replace(/^y\s*=\s*/i,"");
export function sampleGraphExpression(source,{minX=-10,maxX=10,points=401}={}){
  source=normalizeExpression(source);
  minX=Number(minX);maxX=Number(maxX);points=Math.max(2,Math.min(2000,Number(points)||401));
  if(!source||!Number.isFinite(minX)||!Number.isFinite(maxX)||maxX<=minX)return{ok:false,error:"INVALID_GRAPH_RANGE",samples:[]};
  const samples=[];
  for(let i=0;i<points;i++){
    const x=minX+(maxX-minX)*(i/(points-1));
    const expr=source.replace(/\bx\b/gi,`(${x})`);
    const r=evaluateExpression(expr,{angleMode:"RAD",ans:"0"});
    samples.push({x,y:r.kind==="value"&&Number.isFinite(r.numeric)?r.numeric:null});
  }
  return{ok:true,expression:source,minX,maxX,samples};
}

export function graphBounds(samples,{fallbackMinY=-10,fallbackMaxY=10}={}){
  const ys=samples.map(p=>p.y).filter(Number.isFinite);
  if(!ys.length)return{minY:fallbackMinY,maxY:fallbackMaxY};
  let minY=Math.min(...ys),maxY=Math.max(...ys);
  if(minY===maxY){minY-=1;maxY+=1}
  const span=maxY-minY;
  return{minY:minY-span*.08,maxY:maxY+span*.08};
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
