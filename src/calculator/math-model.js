export const textNode=value=>({type:"text",value});
export const fractionNode=()=>({type:"fraction",numerator:[],denominator:[]});
export const mixedFractionNode=()=>({type:"mixedFraction",integer:[],numerator:[],denominator:[]});
export const powerNode=()=>({type:"power",base:[],exponent:[]});
export const sqrtNode=()=>({type:"sqrt",radicand:[]});
export const nthRootNode=()=>({type:"nthRoot",index:[],radicand:[]});

export function serializeNodes(nodes){
  return nodes.map(n=>{
    switch(n.type){
      case"text":return n.value;
      case"fraction":return`(${serializeNodes(n.numerator)})/(${serializeNodes(n.denominator)})`;
      case"mixedFraction":return`${serializeNodes(n.integer)}+(${serializeNodes(n.numerator)})/(${serializeNodes(n.denominator)})`;
      case"power":return`(${serializeNodes(n.base)})^(${serializeNodes(n.exponent)})`;
      case"sqrt":return`sqrt(${serializeNodes(n.radicand)})`;
      case"nthRoot":return`root(${serializeNodes(n.index)},${serializeNodes(n.radicand)})`;
      default:return"";
    }
  }).join("");
}

const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const cursor=()=>'<span class="math-cursor" aria-hidden="true"></span>';

function renderSequence(nodes,activeArray,cursorIndex){
  const parts=[];
  for(let i=0;i<=nodes.length;i++){
    if(nodes===activeArray&&i===cursorIndex)parts.push(cursor());
    if(i<nodes.length)parts.push(renderNode(nodes[i],activeArray,cursorIndex));
  }
  return parts.join("");
}

function renderNode(n,activeArray,cursorIndex){
  if(n.type==="text")return`<span class="math-text">${esc(n.value)}</span>`;
  if(n.type==="fraction"){
    const na=activeArray===n.numerator?" active-slot":"",da=activeArray===n.denominator?" active-slot":"";
    return`<span class="math-fraction"><span class="math-numerator${na}">${renderSequence(n.numerator,activeArray,cursorIndex)||"□"}</span><span class="math-denominator${da}">${renderSequence(n.denominator,activeArray,cursorIndex)||"□"}</span></span>`;
  }
  if(n.type==="mixedFraction"){
    const ia=activeArray===n.integer?" active-slot":"",na=activeArray===n.numerator?" active-slot":"",da=activeArray===n.denominator?" active-slot":"";
    return`<span class="math-mixed"><span class="${ia.trim()}">${renderSequence(n.integer,activeArray,cursorIndex)||"□"}</span><span class="math-fraction"><span class="math-numerator${na}">${renderSequence(n.numerator,activeArray,cursorIndex)||"□"}</span><span class="math-denominator${da}">${renderSequence(n.denominator,activeArray,cursorIndex)||"□"}</span></span></span>`;
  }
  if(n.type==="power"){
    const ba=activeArray===n.base?" active-slot":"",ea=activeArray===n.exponent?" active-slot":"";
    return`<span class="math-power"><span class="${ba.trim()}">${renderSequence(n.base,activeArray,cursorIndex)||"□"}</span><sup class="${ea.trim()}">${renderSequence(n.exponent,activeArray,cursorIndex)||"□"}</sup></span>`;
  }
  if(n.type==="sqrt"){
    const ra=activeArray===n.radicand?" active-slot":"";
    return`<span class="math-root">√<span class="radicand${ra}">${renderSequence(n.radicand,activeArray,cursorIndex)||"□"}</span></span>`;
  }
  if(n.type==="nthRoot"){
    const ia=activeArray===n.index?" active-slot":"",ra=activeArray===n.radicand?" active-slot":"";
    return`<span class="math-root"><sup class="${ia.trim()}">${renderSequence(n.index,activeArray,cursorIndex)||"□"}</sup>√<span class="radicand${ra}">${renderSequence(n.radicand,activeArray,cursorIndex)||"□"}</span></span>`;
  }
  return"";
}

export function renderNodes(nodes,activeArray,cursorIndex=0){return renderSequence(nodes,activeArray,cursorIndex)}
