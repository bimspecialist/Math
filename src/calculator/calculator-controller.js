import { KEY_CONTRACT } from "./key-contract.js";
import { MathFieldAdapter } from "./math-field-adapter.js";
import { evaluateExpression } from "./math-engine.js";
import { formatExactDecimal } from "./result-format.js";
import { createCalculatorState, dispatchCalculatorCommand } from "./calculator-state.js";
const byId=new Map(KEY_CONTRACT.map(k=>[k.id,k]));
const primaryToken=id=>{if(id.startsWith("DIGIT_"))return id.slice(6);return({DECIMAL:".",ADD:"+",SUBTRACT:"-",MULTIPLY:"*",DIVIDE:"/",LPAREN:"(",RPAREN:")",EXP:"*10^",INVERSE:"^(-1)"})[id]??null};
const functionName=(id,shifted)=>{const p={LOG:"log",LN:"ln",SIN:"sin",COS:"cos",TAN:"tan",ABS:"abs"},s={LOG:"pow10",LN:"exp",SIN:"asin",COS:"acos",TAN:"atan",ABS:"abs"};return(shifted?s:p)[id]??null};
function mixedFromExact(exact){if(!exact?.includes("/"))return exact;const[n0,d0]=exact.split("/").map(Number);if(!Number.isInteger(n0)||!Number.isInteger(d0)||d0===0)return exact;const sign=n0<0?-1:1,n=Math.abs(n0),d=Math.abs(d0),whole=Math.floor(n/d),rem=n%d;if(whole===0||rem===0)return exact;return`${sign<0?"-":""}${whole} ${rem}/${d}`}

export class CalculatorController{
  constructor(){this.field=new MathFieldAdapter();this.state=createCalculatorState();this.result="0";this.lastResult=null;this.ans="0";this.memory=0;this.history=[];this.historyIndex=-1;this.historyDraft=null;this.displayMode="EXACT";this.mixedDisplay=false;this.dmsDisplay=false;this.promptBuffer="";this.engineeringExponent=null}
  dispatch(keyId){const key=byId.get(keyId);if(!key)return false;if(keyId==="SHIFT"){this.state=dispatchCalculatorCommand(this.state,{type:"SHIFT"});return true}if(keyId==="ALPHA"){this.state=dispatchCalculatorCommand(this.state,{type:"ALPHA"});return true}if(this.state.prompt)return this._dispatchPromptKey(keyId)
    const wasShift=this.state.shift, wasAlpha=this.state.alpha;
    const action=wasAlpha&&key.alphaAction?key.alphaAction:(wasShift&&key.shiftAction?key.shiftAction:key.primaryAction),consume=wasShift||wasAlpha;
    if(action==="OPEN_MODE_MENU"){this.state=dispatchCalculatorCommand(this.state,{type:"OPEN_MODE_MENU"});return true}
    if(action==="OPEN_SETUP_MENU"){this.state=dispatchCalculatorCommand(this.state,{type:"OPEN_SETUP_MENU"});return true}
    if(action==="POWER_ON"){this.field=new MathFieldAdapter();this.result="0";this.lastResult=null;this.state=createCalculatorState();this.historyIndex=-1;this.historyDraft=null;return true}
    if(action==="CALC"||action==="SOLVE"){if(action==="SOLVE"&&!this.state.shift)this.state={...this.state,shift:true};this.state=dispatchCalculatorCommand(this.state,{type:"CALC",variables:this._variables()});this.promptBuffer="";if(this.state.prompt?.kind==="CALC"&&!this.state.prompt.variables.length){this.state={...this.state,prompt:null};this._evaluate()}return true}
    if(action.startsWith("REPLAY_"))return this._replay(action);
    if(wasAlpha && !key.alphaAction){this.state=dispatchCalculatorCommand(this.state,{type:"CONSUME_MODIFIER"});return false;}
    if(action==="INSERT_FRACTION")this.field.insertFraction();else if(action==="INSERT_MIXED_FRACTION")this.field.insertMixedFraction();else if(action==="INSERT_SQRT")this.field.insertSquareRoot();else if(action==="INSERT_SQUARE")this.field.insertText("^2");else if(action==="INSERT_POWER")this.field.insertPower();else if(action==="INSERT_NTH_ROOT")this.field.insertNthRoot();
    else if(action==="INSERT_TOKEN"){const token=primaryToken(keyId);if(token!==null)this.field.insertText(token)}
    else if(action==="INSERT_FUNCTION"){let fn=functionName(keyId,wasShift);if(this.state.hyp&&["SIN","COS","TAN"].includes(keyId)){fn=({SIN:"sinh",COS:"cosh",TAN:"tanh"})[keyId];this.state={...this.state,hyp:false}}if(fn)this.field.insertText(`${fn}(`)}
    else if(action==="INSERT_VARIABLE")this.field.insertText(key.alphaLabel);
    else if(action==="INSERT_EQUALITY")this.field.insertText("=");
    else if(action==="FACTORIAL")this.field.insertText("!");else if(action==="NCR")this.field.insertText("nCr(");else if(action==="NPR")this.field.insertText("nPr(");else if(action==="NEGATE")this.field.insertText("-");else if(action==="DMS"){if(this.lastResult?.kind==="value"){const wasDms=this.dmsDisplay;this.dmsDisplay=!this.dmsDisplay;if(wasDms)this.displayMode="DECIMAL";this._refreshResult()}else this.field.insertText("°");}else if(action==="HYP")this.state={...this.state,hyp:true};
    else if(action==="STORE")this.memory=this.lastResult?.kind==="value"?this.lastResult.numeric:Number(this.result)||0;else if(action==="RECALL")this.field.insertText(String(this.memory));else if(action==="MEMORY_ADD")this.memory+=(this.lastResult?.kind==="value"?this.lastResult.numeric:Number(this.result)||0);else if(action==="MEMORY_SUBTRACT")this.memory-=(this.lastResult?.kind==="value"?this.lastResult.numeric:Number(this.result)||0);
    else if(action==="TOGGLE_EXACT_DECIMAL"){this.displayMode=this.displayMode==="EXACT"?"DECIMAL":"EXACT";this.mixedDisplay=false;this._refreshResult()}
    else if(action==="TOGGLE_MIXED_IMPROPER"){this.displayMode="EXACT";this.mixedDisplay=!this.mixedDisplay;this._refreshResult()}
    else if(action==="ENG"){if(this.lastResult?.kind==="value")this._applyEngineering();else this.field.insertText("*10^")}else if(action==="ANS")this.field.insertText(this.ans);else if(action==="DELETE")this.field.deleteBackward();else if(action==="CLEAR"){this.field=new MathFieldAdapter();this.result="0";this.lastResult=null;this.historyIndex=-1;this.historyDraft=null;this.promptBuffer="";this.engineeringExponent=null;this.state={...this.state,shift:false,alpha:false,error:null,prompt:null,menu:null};return true}else if(action==="EVALUATE")this._evaluate();
    if(consume)this.state=dispatchCalculatorCommand(this.state,{type:"CONSUME_MODIFIER"});return true}
  _dispatchPromptKey(keyId){
    if(keyId.startsWith("DIGIT_")){this.promptBuffer+=keyId.slice(6);return true}
    if(keyId==="DECIMAL"&&!this.promptBuffer.includes(".")){this.promptBuffer+=this.promptBuffer?".":"0.";return true}
    if(keyId==="NEGATE"||keyId==="SUBTRACT"){this.promptBuffer=this.promptBuffer.startsWith("-")?this.promptBuffer.slice(1):"-"+this.promptBuffer;return true}
    if(keyId==="DEL"){this.promptBuffer=this.promptBuffer.slice(0,-1);return true}
    if(keyId==="AC"){this.promptBuffer="";this.state=dispatchCalculatorCommand(this.state,{type:"CANCEL_PROMPT"});return true}
    if(keyId==="EQUALS")return this._submitPrompt();
    return false
  }
  _submitPrompt(){
    const prompt=this.state.prompt;if(!prompt)return false;
    const variable=prompt.variables[prompt.index]??"X",value=Number(this.promptBuffer||"0");
    if(!Number.isFinite(value)){this.state={...this.state,error:"INVALID_PROMPT_VALUE"};return false}
    const values={...prompt.values,[variable]:value},nextIndex=prompt.index+1;this.promptBuffer="";
    if(nextIndex<prompt.variables.length){this.state={...this.state,prompt:{...prompt,index:nextIndex,values}};return true}
    this.state={...this.state,prompt:null,error:null};
    if(prompt.kind==="CALC")return this._evaluateVariables(values);
    if(prompt.kind==="SOLVE")return this._solveVariable(variable,value);
    return false
  }
  _replaceVariables(source,values){return source.replace(/\b[A-Z]\b/g,m=>Object.hasOwn(values,m)?`(${values[m]})`:m)}
  _evaluateVariables(values){
    const source=this._replaceVariables(this.field.getCanonicalExpression(),values),r=evaluateExpression(source,{angleMode:this.state.angleMode,ans:this.ans});
    this.lastResult=r;if(r.kind==="value"){this.ans=String(r.numeric);this.engineeringExponent=null;this._refreshResult();return true}
    this.result=r.code;return false
  }
  _solveVariable(variable,initial){
    const source=this.field.getCanonicalExpression(),parts=source.split("=");if(parts.length!==2){this.result="INVALID_EQUATION";return false}
    const fn=x=>{const values={[variable]:x},left=evaluateExpression(this._replaceVariables(parts[0],values),{angleMode:this.state.angleMode,ans:this.ans}),right=evaluateExpression(this._replaceVariables(parts[1],values),{angleMode:this.state.angleMode,ans:this.ans});if(left.kind!=="value"||right.kind!=="value")return NaN;return left.numeric-right.numeric};
    let x=initial,converged=false;
    for(let i=0;i<64;i++){
      const y=fn(x);if(!Number.isFinite(y)){this.result="SOLVE_ERROR";return false}
      if(Math.abs(y)<1e-10){converged=true;break}
      const h=1e-6*Math.max(1,Math.abs(x)),fp=fn(x+h),fm=fn(x-h),d=(fp-fm)/(2*h);
      if(!Number.isFinite(d)||Math.abs(d)<1e-12)break;
      const next=x-y/d;if(!Number.isFinite(next)||Math.abs(next)>1e12)break;
      if(Math.abs(next-x)<1e-12*Math.max(1,Math.abs(next))){x=next;converged=Math.abs(fn(x))<1e-8;break}
      x=next;
    }
    if(!converged){
      let radius=Math.max(0.5,Math.abs(initial)*0.25),a=null,b=null,fa=null,fb=null;
      for(let attempt=0;attempt<12;attempt++){
        const lo=initial-radius,hi=initial+radius,flo=fn(lo),fhi=fn(hi);
        if(Number.isFinite(flo)&&Number.isFinite(fhi)&&flo*fhi<=0){a=lo;b=hi;fa=flo;fb=fhi;break}
        radius*=2;
      }
      if(a!==null){
        for(let i=0;i<100;i++){
          const mid=(a+b)/2,fm=fn(mid);if(!Number.isFinite(fm))break;
          x=mid;
          if(Math.abs(fm)<1e-10||Math.abs(b-a)<1e-12*Math.max(1,Math.abs(mid))){converged=true;break}
          if(fa*fm<=0){b=mid;fb=fm}else{a=mid;fa=fm}
        }
        if(!converged)converged=Math.abs(fn(x))<1e-8;
      }
    }
    if(!converged||!Number.isFinite(fn(x))||Math.abs(fn(x))>=1e-8){this.lastResult=null;this.result="SOLVE_NO_CONVERGENCE";return false}
    const numeric=Number(x.toPrecision(14));this.lastResult={kind:"value",numeric,exact:Number.isSafeInteger(numeric)?String(numeric):undefined};this.ans=String(numeric);this.engineeringExponent=null;this._refreshResult();return true
  }
  _applyEngineering(){
    const n=this.lastResult.numeric;if(!Number.isFinite(n)){return false}if(n===0){this.result="0×10^0";this.engineeringExponent=0;return true}
    if(this.engineeringExponent===null)this.engineeringExponent=Math.floor(Math.log10(Math.abs(n))/3)*3;else this.engineeringExponent-=3;
    const mantissa=n/Math.pow(10,this.engineeringExponent),m=Number(mantissa.toPrecision(12));this.result=`${m}×10^${this.engineeringExponent}`;return true
  }
  selectMode(modeId){this.state=dispatchCalculatorCommand(this.state,{type:"SELECT_MODE",value:modeId});return this.state.error===null&&this.state.mode===modeId}
  selectSetup(group,value){this.state=dispatchCalculatorCommand(this.state,{type:"SELECT_SETUP",group,value});return this.state.error===null}
  cancelMenu(){this.state=dispatchCalculatorCommand(this.state,{type:"CANCEL_MENU"});return true}
  _variables(){const s=this.field.getCanonicalExpression();return[...new Set((s.match(/\b[A-ZXYZM]\b/g)||[]))]}
  _evaluate(){const source=this.field.getCanonicalExpression(),r=evaluateExpression(source,{angleMode:this.state.angleMode,ans:this.ans});this.lastResult=r;if(r.kind==="value"){this.ans=String(r.numeric);this.engineeringExponent=null;this._refreshResult();if(source.trim())this.history.unshift({expression:source,result:this.result,fieldSnapshot:this.field.createSnapshot()});this.history=this.history.slice(0,30);this.historyIndex=-1;this.historyDraft=null}else this.result=r.code}
  _refreshResult(){if(!this.lastResult)return;if(this.lastResult.kind!=="value"){this.result=this.lastResult.code;return}const base=formatExactDecimal(this.lastResult,this.displayMode);this.result=this.mixedDisplay?mixedFromExact(this.lastResult.exact)??base:base;if(this.dmsDisplay){const x=this.lastResult.numeric,sign=x<0?"-":"",a=Math.abs(x),deg=Math.floor(a),mFloat=(a-deg)*60,min=Math.floor(mFloat),sec=Number(((mFloat-min)*60).toFixed(10));this.result=`${sign}${deg}°${min}′${sec}″`}}
  _replay(action){
    if(action==="REPLAY_LEFT")return this.field.moveLeft();
    if(action==="REPLAY_RIGHT")return this.field.moveRight();
    if(this.field.focusSlot()!=="root"){if(action==="REPLAY_UP")return this.field.moveUp();if(action==="REPLAY_DOWN")return this.field.moveDown()}
    if(action==="REPLAY_UP"&&this.history.length){if(this.historyIndex<0)this.historyDraft=this.field.createSnapshot();this.historyIndex=Math.min(this.historyIndex+1,this.history.length-1);const item=this.history[this.historyIndex];if(item.fieldSnapshot)this.field.restoreSnapshot(item.fieldSnapshot);else this.field.setCanonicalExpression(item.expression);return true}
    if(action==="REPLAY_DOWN"&&this.historyIndex>=0){this.historyIndex--;if(this.historyIndex<0){if(this.historyDraft)this.field.restoreSnapshot(this.historyDraft);else this.field.setCanonicalExpression("")}else{const item=this.history[this.historyIndex];if(item.fieldSnapshot)this.field.restoreSnapshot(item.fieldSnapshot);else this.field.setCanonicalExpression(item.expression)}return true}return false}
  view(){return{state:this.state,result:this.result,ans:this.ans,memory:this.memory,history:[...this.history],canonicalExpression:this.field.getCanonicalExpression(),mathHtml:this.field.renderHtml(),focusSlot:this.field.focusSlot(),displayMode:this.displayMode,mixedDisplay:this.mixedDisplay,dmsDisplay:this.dmsDisplay,promptBuffer:this.promptBuffer,engineeringExponent:this.engineeringExponent}}
}
