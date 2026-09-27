export function buildModeMenu(profile){
  return {id:"MODE",title:"MODE",focusIndex:0,choices:profile.modes.filter(m=>m.implemented).map((m,i)=>({id:m.id,label:m.label,number:i+1}))};
}
export function buildSetupMenu(profile){
  return {id:"SETUP",title:"SETUP",focusIndex:0,groups:[
    {id:"ANGLE",label:"Angle Unit",choices:profile.setup.angleModes},
    {id:"INPUT_OUTPUT",label:"Input/Output",choices:profile.setup.inputOutputModes},
    {id:"FRACTION_FORMAT",label:"Fraction Result",choices:profile.setup.fractionFormats}
  ]};
}
export function moveMenuFocus(menu,delta){
  if(!menu?.choices?.length)return menu;
  const n=menu.choices.length; return {...menu,focusIndex:(menu.focusIndex+delta+n)%n};
}
