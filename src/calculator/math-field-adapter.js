import {textNode,fractionNode,mixedFractionNode,powerNode,sqrtNode,nthRootNode,serializeNodes,renderNodes} from "./math-model.js";
export class MathFieldAdapter{
 constructor(){this.root=[];this.current=this.root;this.stack=[];this.slotName="root";this.cursorIndex=0}
 focusSlot(){return this.slotName}
 cursorPosition(){return this.cursorIndex}
 _insertNode(node){this.current.splice(this.cursorIndex,0,node);this.cursorIndex++;return node}
 _enter(node,parent,type,slot,parentCursor){this.stack.push({node,parent,type,parentCursor});this.current=node[slot];this.slotName=slot;this.cursorIndex=0}
 insertText(value){if(value){this._insertNode(textNode(String(value)))}}
 insertKeyboard(key){if(key==="/")this.insertFraction();else this.insertText(key)}
 insertFraction(){const parent=this.current,at=this.cursorIndex,node=fractionNode();this._insertNode(node);this._enter(node,parent,"fraction","numerator",at+1)}
 insertMixedFraction(){const parent=this.current,at=this.cursorIndex,node=mixedFractionNode();this._insertNode(node);this._enter(node,parent,"mixedFraction","integer",at+1)}
 insertPower(){
  const parent=this.current,at=this.cursorIndex,base=parent.splice(0,at),node=powerNode();
  node.base.push(...base);parent.splice(0,0,node);
  this.stack.push({node,parent,type:"power",parentCursor:1});this.current=node.exponent;this.slotName="exponent";this.cursorIndex=0
 }
 insertSquareRoot(){const parent=this.current,at=this.cursorIndex,node=sqrtNode();this._insertNode(node);this._enter(node,parent,"sqrt","radicand",at+1)}
 insertNthRoot(){const parent=this.current,at=this.cursorIndex,node=nthRootNode();this._insertNode(node);this._enter(node,parent,"nthRoot","index",at+1)}
 top(){return this.stack[this.stack.length-1]}
 _switchTo(array,slot,preserve=true){const prior=this.cursorIndex;this.current=array;this.slotName=slot;this.cursorIndex=preserve?Math.min(prior,array.length):array.length;return true}
 moveDown(){
  const f=this.top();if(!f)return false;
  if(f.type==="fraction"&&this.current===f.node.numerator)return this._switchTo(f.node.denominator,"denominator");
  if(f.type==="mixedFraction"&&this.current===f.node.integer)return this._switchTo(f.node.numerator,"numerator");
  if(f.type==="mixedFraction"&&this.current===f.node.numerator)return this._switchTo(f.node.denominator,"denominator");
  if(f.type==="nthRoot"&&this.current===f.node.index)return this._switchTo(f.node.radicand,"radicand");
  return false
 }
 moveUp(){
  const f=this.top();if(!f)return false;
  if(f.type==="fraction"&&this.current===f.node.denominator)return this._switchTo(f.node.numerator,"numerator");
  if(f.type==="mixedFraction"&&this.current===f.node.denominator)return this._switchTo(f.node.numerator,"numerator");
  if(f.type==="mixedFraction"&&this.current===f.node.numerator)return this._switchTo(f.node.integer,"integer");
  if(f.type==="nthRoot"&&this.current===f.node.radicand)return this._switchTo(f.node.index,"index");
  return false
 }
 moveRight(){
  if(this.cursorIndex<this.current.length){this.cursorIndex++;return true}
  const f=this.top();if(!f)return false;
  const exits=(f.type==="fraction"&&this.current===f.node.denominator)||(f.type==="mixedFraction"&&this.current===f.node.denominator)||(f.type==="power"&&this.current===f.node.exponent)||(f.type==="sqrt"&&this.current===f.node.radicand)||(f.type==="nthRoot"&&this.current===f.node.radicand);
  if(exits){this.stack.pop();this.current=f.parent;this.slotName=this.top()?this._nameFor(this.top(),this.current):"root";this.cursorIndex=Math.min(f.parentCursor??this.current.length,this.current.length);return true}
  if(f.type==="power"&&this.current===f.node.base){this.current=f.node.exponent;this.slotName="exponent";this.cursorIndex=0;return true}
  return false
 }
 moveLeft(){
  if(this.cursorIndex>0){this.cursorIndex--;return true}
  const f=this.top();if(!f)return false;
  if(f.type==="power"&&this.current===f.node.exponent){this.current=f.node.base;this.slotName="base";this.cursorIndex=this.current.length;return true}
  if(f.type==="nthRoot"&&this.current===f.node.radicand){this.current=f.node.index;this.slotName="index";this.cursorIndex=this.current.length;return true}
  return false
 }
 _nameFor(frame,array){for(const k of["numerator","denominator","integer","base","exponent","radicand","index"])if(frame.node[k]===array)return k;return"root"}
 deleteBackward(){
  if(this.current.length){
    if(this.cursorIndex<this.current.length){this.current.splice(this.cursorIndex,1);return true}
    if(this.cursorIndex>0){this.current.splice(this.cursorIndex-1,1);this.cursorIndex--;return true}
  }
  const f=this.top();if(!f)return false;
  const allEmpty=Object.values(f.node).filter(Array.isArray).every(a=>a.length===0);if(!allEmpty)return false;
  const ix=f.parent.indexOf(f.node);if(ix>=0)f.parent.splice(ix,1);
  this.stack.pop();this.current=f.parent;this.slotName=this.top()?this._nameFor(this.top(),this.current):"root";this.cursorIndex=Math.max(0,Math.min(ix,this.current.length));return true
 }
 _focusPath(array,target,path=[]){
  if(array===target)return path;
  for(let i=0;i<array.length;i++){
    const node=array[i];
    for(const slot of["numerator","denominator","integer","base","exponent","radicand","index"]){
      if(!Array.isArray(node?.[slot]))continue;
      const found=this._focusPath(node[slot],target,[...path,{index:i,slot}]);if(found)return found
    }
  }
  return null
 }
 createSnapshot(){return{nodes:JSON.parse(JSON.stringify(this.root)),focusPath:this._focusPath(this.root,this.current)??[],cursorIndex:this.cursorIndex}}
 restoreSnapshot(snapshot){
  this.root=JSON.parse(JSON.stringify(snapshot?.nodes??[]));this.current=this.root;this.stack=[];this.slotName="root";let array=this.root;
  for(const step of snapshot?.focusPath??[]){
    const node=array?.[step.index];if(!node||!Array.isArray(node[step.slot]))break;
    this.stack.push({node,parent:array,type:node.type,parentCursor:step.index+1});array=node[step.slot];this.slotName=step.slot
  }
  this.current=array;this.cursorIndex=Math.max(0,Math.min(snapshot?.cursorIndex??array.length,array.length));return true
 }
 getCanonicalExpression(){return serializeNodes(this.root)}
 setCanonicalExpression(source){this.root=[...String(source??"")].map(textNode);this.current=this.root;this.stack=[];this.slotName="root";this.cursorIndex=this.root.length}
 renderHtml(){return renderNodes(this.root,this.current,this.cursorIndex)}
 focus(){}
}
