import { KEY_CONTRACT } from "./key-contract.js";
import { MathFieldAdapter } from "./math-field-adapter.js";
import { evaluateExpression } from "./math-engine.js";
import { formatExactDecimal } from "./result-format.js";
import { createCalculatorState, dispatchCalculatorCommand } from "./calculator-state.js";
const byId=new Map(KEY_CONTRACT.map(k=>[k.id,k]));
const primaryToken=id=>{if(id.startsWith("DIGIT_"))return id.slice(6);return({DECIMAL:".",ADD:"+",SUBTRACT:"-",MULTIPLY:"*",LPAREN:"(",RPAREN:")",EXP:"*10^",INVERSE:"^(-1)"})[id]??null};
const functionName=(id,shifted)=>{const p={LOG:"log",LN:"ln",SIN:"sin",COS:"cos",TAN:"tan",ABS:"abs"},s={LOG:"pow10",LN:"exp",SIN:"asin",COS:"acos",TAN:"atan",ABS:"abs"};return(shifted?s:p)[id]??null};
function mixedFromExact(exact){if(!exact?.includes("/"))return exact;const[n0,d0]=exact.split("/").map(Number);if(!Number.isInteger(n0)||!Number.isInteger(d0)||d0===0)return exact;const sign=n0<0?-1:1,n=Math.abs(n0),d=Math.abs(d0),whole=Math.floor(n/d),rem=n%d;if(whole===0||rem===0)return exact;return`${sign<0?"-":""}${whole} ${rem}/${d}`}

export class CalculatorController{
  constructor(){this.field=new MathFieldAdapter();this.state=createCalculatorState();this.result="0";this.lastResult=null;this.ans="0";this.memory=0;this.history=[];this.historyIndex=-1;this.historyDraft=null;this.displayMode="EXACT";this.mixedDisplay=false}
  dispatch(keyId){const key=byId.get(keyId);if(!key)return false;if(keyId==="SHIFT"){this.state=dispatchCalculatorCommand(this.state,{type:"SHIFT"});return true}if(keyId==="ALPHA"){this.state=dispatchCalculatorCommand(this.state,{type:"ALPHA"});return true}
    const wasShift=this.state.shift,action=wasShift&&key.shiftAction?key.shiftAction:key.primaryAction,consume=wasShift||this.state.alpha;
    if(action==="OPEN_MODE_MENU"){this.state=dispatchCalculatorCommand(this.state,{type:"OPEN_MODE_MENU"});return true}
    if(action==="OPEN_SETUP_MENU"){this.state=dispatchCalculatorCommand(this.state,{type:"OPEN_SETUP_MENU"});return true}
    if(action==="POWER_ON"){this.field=new MathFieldAdapter();this.result="0";this.lastResult=null;this.state=createCalculatorState();this.historyIndex=-1;this.historyDraft=null;return true}
    if(action==="CALC"||action==="SOLVE"){if(action==="SOLVE"&&!this.state.shift)this.state={...this.state,shift:true};this.state=dispatchCalculatorCommand(this.state,{type:"CALC",variables:this._variables()});return true}
    if(action.startsWith("REPLAY_"))return this._replay(action);
    if(action==="INSERT_FRACTION")this.field.insertFraction();else if(action==="INSERT_MIXED_FRACTION")this.field.insertMixedFraction();else if(action==="INSERT_SQRT")this.field.insertSquareRoot();else if(action==="INSERT_SQUARE")this.field.insertText("^2");else if(action==="INSERT_POWER")this.field.insertPower();else if(action==="INSERT_NTH_ROOT")this.field.insertNthRoot();
    else if(action==="INSERT_TOKEN"){const token=primaryToken(keyId);if(token!==null)this.field.insertText(token)}
    else if(action==="INSERT_FUNCTION"){const fn=functionName(keyId,wasShift);if(fn)this.field.insertText(`${fn}(`)}
    else if(action==="FACTORIAL")this.field.insertText("!");else if(action==="NCR")this.field.insertText("nCr(");else if(action==="NPR")this.field.insertText("nPr(");else if(action==="NEGATE")this.field.insertText("-");else if(action==="DMS")this.field.insertText("°");else if(action==="HYP")this.state={...this.state,hyp:true};
    else if(action==="STORE")this.memory=this.lastResult?.kind==="value"?this.lastResult.numeric:Number(this.result)||0;else if(action==="RECALL")this.field.insertText(String(this.memory));else if(action==="MEMORY_ADD")this.memory+=(this.lastResult?.kind==="value"?this.lastResult.numeric:Number(this.result)||0);else if(action==="MEMORY_SUBTRACT")this.memory-=(this.lastResult?.kind==="value"?this.lastResult.numeric:Number(this.result)||0);
    else if(action==="TOGGLE_EXACT_DECIMAL"){this.displayMode=this.displayMode==="EXACT"?"DECIMAL":"EXACT";this.mixedDisplay=false;this._refreshResult()}
    else if(action==="TOGGLE_MIXED_IMPROPER"){this.displayMode="EXACT";this.mixedDisplay=!this.mixedDisplay;this._refreshResult()}
    else if(action==="ENG")this.field.insertText("*10^");else if(action==="ANS")this.field.insertText(this.ans);else if(action==="DELETE")this.field.deleteBackward();else if(action==="CLEAR"){this.field=new MathFieldAdapter();this.result="0";this.lastResult=null;this.historyIndex=-1;this.historyDraft=null;this.state={...this.state,shift:false,alpha:false,error:null,prompt:null,menu:null};return true}else if(action==="EVALUATE")this._evaluate();
    if(consume)this.state=dispatchCalculatorCommand(this.state,{type:"CONSUME_MODIFIER"});return true}
  _variables(){const s=this.field.getCanonicalExpression();return[...new Set((s.match(/\b[A-ZXYZM]\b/g)||[]))]}
  _evaluate(){const source=this.field.getCanonicalExpression(),r=evaluateExpression(source,{angleMode:this.state.angleMode,ans:this.ans});this.lastResult=r;if(r.kind==="value"){this.ans=String(r.numeric);this._refreshResult();if(source.trim())this.history.unshift({expression:source,result:this.result});this.history=this.history.slice(0,30);this.historyIndex=-1;this.historyDraft=null}else this.result=r.code}
  _refreshResult(){if(!this.lastResult)return;if(this.lastResult.kind!=="value"){this.result=this.lastResult.code;return}const base=formatExactDecimal(this.lastResult,this.displayMode);this.result=this.mixedDisplay?mixedFromExact(this.lastResult.exact)??base:base}
  _replay(action){if(this.field.focusSlot()!=="root"){if(action==="REPLAY_UP")return this.field.moveUp();if(action==="REPLAY_DOWN")return this.field.moveDown();if(action==="REPLAY_LEFT")return this.field.moveLeft();if(action==="REPLAY_RIGHT")return this.field.moveRight()}
    if(action==="REPLAY_UP"&&this.history.length){if(this.historyIndex<0)this.historyDraft=this.field.getCanonicalExpression();this.historyIndex=Math.min(this.historyIndex+1,this.history.length-1);this.field.setCanonicalExpression(this.history[this.historyIndex].expression);return true}
    if(action==="REPLAY_DOWN"&&this.historyIndex>=0){this.historyIndex--;if(this.historyIndex<0)this.field.setCanonicalExpression(this.historyDraft??"");else this.field.setCanonicalExpression(this.history[this.historyIndex].expression);return true}return false}
  view(){return{state:this.state,result:this.result,ans:this.ans,memory:this.memory,history:[...this.history],canonicalExpression:this.field.getCanonicalExpression(),mathHtml:this.field.renderHtml(),focusSlot:this.field.focusSlot(),displayMode:this.displayMode,mixedDisplay:this.mixedDisplay}}
}
