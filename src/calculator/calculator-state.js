import { ES_PLUS_PROFILE } from "./behavior-profile.js";
import { buildModeMenu, buildSetupMenu } from "./menu-controller.js";

export function createCalculatorState(){
  return {mode:"COMP",angleMode:"DEG",inputOutputMode:"MATH",fractionFormat:"IMPROPER",shift:false,alpha:false,menu:null,prompt:null,error:null};
}
export function dispatchCalculatorCommand(state,command,profile=ES_PLUS_PROFILE){
  const s={...state,error:null};
  switch(command.type){
    case"SHIFT":return{...s,shift:!s.shift,alpha:false};
    case"ALPHA":return{...s,alpha:!s.alpha,shift:false};
    case"CONSUME_MODIFIER":return{...s,shift:false,alpha:false};
    case"OPEN_MODE_MENU":if(s.shift)return{...s,shift:false,alpha:false,menu:buildSetupMenu(profile)};return{...s,menu:buildModeMenu(profile)};
    case"OPEN_SETUP_MENU":return{...s,shift:false,alpha:false,menu:buildSetupMenu(profile)};
    case"CANCEL_MENU":return{...s,menu:null,shift:false,alpha:false};
    case"SELECT_MODE":{const m=profile.modes.find(x=>x.id===command.value&&x.implemented);if(!m)return{...s,error:"MODE_UNAVAILABLE"};return{...s,mode:m.id,menu:null,shift:false,alpha:false}}
    case"SELECT_SETUP":{
      if(command.group==="ANGLE"&&profile.setup.angleModes.includes(command.value))return{...s,angleMode:command.value,menu:null,shift:false,alpha:false};
      if(command.group==="INPUT_OUTPUT"&&profile.setup.inputOutputModes.includes(command.value))return{...s,inputOutputMode:command.value,menu:null,shift:false,alpha:false};
      if(command.group==="FRACTION_FORMAT"&&profile.setup.fractionFormats.includes(command.value))return{...s,fractionFormat:command.value,menu:null,shift:false,alpha:false};
      return{...s,error:"INVALID_SETUP_VALUE"};
    }
    case"CALC":
      if(s.shift){if(s.mode!=="COMP")return{...s,shift:false,prompt:null,error:"SOLVE_UNSUPPORTED_MODE"};return{...s,shift:false,alpha:false,prompt:{kind:"SOLVE",variables:command.variables??["X"],index:0,values:{}}}}
      return{...s,shift:false,alpha:false,prompt:{kind:"CALC",variables:command.variables??[],index:0,values:{}}};
    case"CANCEL_PROMPT":return{...s,prompt:null,shift:false,alpha:false};
    default:return s;
  }
}
