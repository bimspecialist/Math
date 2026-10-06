import { evaluateExactExpression } from "./high-precision-engine.js";
import { evaluateAndConvertQuantity, evaluateQuantityExpression } from "./quantity-engine.js";
import { measurement, addMeasurements, subtractMeasurements, multiplyMeasurements, divideMeasurements, formatMeasurement } from "./uncertainty-engine.js";
import { listScientificConstants } from "./scientific-constants.js";

export function runExactResearch(expression,digits=80){
  return evaluateExactExpression(expression,{digits});
}
export function runQuantityResearch(expression,targetUnit=""){
  if(String(targetUnit??"").trim())return evaluateAndConvertQuantity(expression,String(targetUnit).trim());
  return evaluateQuantityExpression(expression);
}
export function runUncertaintyResearch({a,ua,b,ub,operation="+",correlation=0}){
  try{
    const x=measurement(a,ua),y=measurement(b,ub),rho=Number(correlation);
    let result;
    if(operation==="+")result=addMeasurements(x,y,rho);
    else if(operation==="-")result=subtractMeasurements(x,y,rho);
    else if(operation==="*")result=multiplyMeasurements(x,y,rho);
    else if(operation==="/")result=divideMeasurements(x,y,rho);
    else return{kind:"error",code:"UNSUPPORTED_OPERATION"};
    return{kind:"measurement",...result,formatted:formatMeasurement(result,{uncertaintyDigits:2})};
  }catch(e){return{kind:"error",code:e?.message??"INVALID_INPUT"}}
}
export function researchConstants(){return listScientificConstants()}
