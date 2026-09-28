import {textNode,fractionNode,mixedFractionNode,powerNode,sqrtNode,nthRootNode,serializeNodes,renderNodes} from "./math-model.js";
export class MathFieldAdapter{
 constructor(){this.root=[];this.current=this.root;this.stack=[];this.slotName="root"}
 focusSlot(){return this.slotName}
 insertText(value){if(value)this.current.push(textNode(String(value)))}
 insertKeyboard(key){if(key==="/")this.insertFraction();else this.insertText(key)}
 insertFraction(){const node=fractionNode();this.current.push(node);this.stack.push({node,parent:this.current,type:"fraction"});this.current=node.numerator;this.slotName="numerator"}
 insertMixedFraction(){const node=mixedFractionNode();this.current.push(node);this.stack.push({node,parent:this.current,type:"mixedFraction"});this.current=node.integer;this.slotName="integer"}
 insertPower(){const parent=this.current,base=parent.splice(0,parent.length),node=powerNode();node.base.push(...base);parent.push(node);this.stack.push({node,parent,type:"power"});this.current=node.exponent;this.slotName="exponent"}
 insertSquareRoot(){const node=sqrtNode();this.current.push(node);this.stack.push({node,parent:this.current,type:"sqrt"});this.current=node.radicand;this.slotName="radicand"}
 insertNthRoot(){const node=nthRootNode();this.current.push(node);this.stack.push({node,parent:this.current,type:"nthRoot"});this.current=node.index;this.slotName="index"}
 top(){return this.stack[this.stack.length-1]}
 moveDown(){const f=this.top();if(!f)return false;if(f.type==="fraction"&&this.current===f.node.numerator){this.current=f.node.denominator;this.slotName="denominator";return true}if(f.type==="mixedFraction"&&this.current===f.node.integer){this.current=f.node.numerator;this.slotName="numerator";return true}if(f.type==="mixedFraction"&&this.current===f.node.numerator){this.current=f.node.denominator;this.slotName="denominator";return true}if(f.type==="nthRoot"&&this.current===f.node.index){this.current=f.node.radicand;this.slotName="radicand";return true}return false}
 moveUp(){const f=this.top();if(!f)return false;if(f.type==="fraction"&&this.current===f.node.denominator){this.current=f.node.numerator;this.slotName="numerator";return true}if(f.type==="mixedFraction"&&this.current===f.node.denominator){this.current=f.node.numerator;this.slotName="numerator";return true}if(f.type==="mixedFraction"&&this.current===f.node.numerator){this.current=f.node.integer;this.slotName="integer";return true}if(f.type==="nthRoot"&&this.current===f.node.radicand){this.current=f.node.index;this.slotName="index";return true}return false}
 moveRight(){const f=this.top();if(!f)return false;const exits=(f.type==="fraction"&&this.current===f.node.denominator)||(f.type==="mixedFraction"&&this.current===f.node.denominator)||(f.type==="power"&&this.current===f.node.exponent)||(f.type==="sqrt"&&this.current===f.node.radicand)||(f.type==="nthRoot"&&this.current===f.node.radicand);if(exits){this.stack.pop();this.current=f.parent;this.slotName=this.top()?this._nameFor(this.top(),this.current):"root";return true}if(f.type==="power"&&this.current===f.node.base){this.current=f.node.exponent;this.slotName="exponent";return true}return false}
 moveLeft(){
  const f=this.top();if(!f)return false;
  if(f.type==="power"&&this.current===f.node.exponent){this.current=f.node.base;this.slotName="base";return true}
  if(f.type==="nthRoot"&&this.current===f.node.radicand){this.current=f.node.index;this.slotName="index";return true}
  return false
 }
 _nameFor(frame,array){for(const k of["numerator","denominator","integer","base","exponent","radicand","index"])if(frame.node[k]===array)return k;return"root"}
 deleteBackward(){if(this.current.length){this.current.pop();return true}const f=this.top();if(!f)return false;const allEmpty=Object.values(f.node).filter(Array.isArray).every(a=>a.length===0);if(!allEmpty)return false;const ix=f.parent.indexOf(f.node);if(ix>=0)f.parent.splice(ix,1);this.stack.pop();this.current=f.parent;this.slotName=this.top()?this._nameFor(this.top(),this.current):"root";return true}
 _focusPath(array,target,path=[]){
  if(array===target)return path;
  for(let i=0;i<array.length;i++){
    const node=array[i];
    for(const slot of ["numerator","denominator","integer","base","exponent","radicand","index"]){
      if(!Array.isArray(node?.[slot]))continue;
      const found=this._focusPath(node[slot],target,[...path,{index:i,slot}]);
      if(found)return found;
    }
  }
  return null
 }
 createSnapshot(){return{nodes:JSON.parse(JSON.stringify(this.root)),focusPath:this._focusPath(this.root,this.current)??[]}}
 restoreSnapshot(snapshot){
  this.root=JSON.parse(JSON.stringify(snapshot?.nodes??[]));this.current=this.root;this.stack=[];this.slotName="root";
  let array=this.root;
  for(const step of snapshot?.focusPath??[]){
    const node=array?.[step.index];
    if(!node||!Array.isArray(node[step.slot]))break;
    this.stack.push({node,parent:array,type:node.type});
    array=node[step.slot];this.slotName=step.slot;
  }
  this.current=array;return true
 }
 getCanonicalExpression(){return serializeNodes(this.root)}
 setCanonicalExpression(source){this.root=[textNode(source??"")];this.current=this.root;this.stack=[];this.slotName="root"}
 renderHtml(){return renderNodes(this.root,this.current)}
 focus(){}
}
