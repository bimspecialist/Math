import { KEY_CONTRACT } from "./key-contract.js";
import { PHYSICAL_LAYOUT_PROFILE } from "./physical-layout-profile.js";

const keyById = new Map(KEY_CONTRACT.map(k=>[k.id,k]));
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function fractionIcon(){return '<span class="key-fraction-icon" aria-hidden="true"><span>□</span><span class="bar"></span><span>□</span></span>'}
function primaryMarkup(key){return key.id==="FRAC"?fractionIcon():esc(key.primaryLabel)}
function keyMarkup(key,cell=null){
  const shift=key.shiftLabel?'<span class="shift-legend">'+esc(key.shiftLabel)+'</span>':'<span class="shift-legend empty" aria-hidden="true"></span>';
  const alpha=key.alphaLabel?'<span class="alpha-legend">'+esc(key.alphaLabel)+'</span>':"";
  const pos=cell?' style="grid-row:'+cell.row+';grid-column:'+cell.col+'"':"";
  return '<button data-key-id="'+key.id+'" type="button" class="calc-key role-'+key.styleRole+'" aria-label="'+esc(key.accessibilityName)+'"'+pos+'>'+shift+alpha+'<span class="primary-label">'+primaryMarkup(key)+'</span></button>';
}
function scientificKeyMarkup(key,cell){
  const shift=key.shiftLabel?'<span class="key-legend key-legend-shift">'+esc(key.shiftLabel)+'</span>':'<span class="key-legend key-legend-shift empty" aria-hidden="true"></span>';
  const alpha=key.alphaLabel?'<span class="key-legend key-legend-alpha">'+esc(key.alphaLabel)+'</span>':'<span class="key-legend key-legend-alpha empty" aria-hidden="true"></span>';
  return '<div class="scientific-key-cell" style="grid-row:'+cell.row+';grid-column:'+cell.col+'">'+
    '<div class="key-legend-row" aria-hidden="true">'+shift+alpha+'</div>'+
    '<button data-key-id="'+key.id+'" type="button" class="calc-key role-'+key.styleRole+' scientific-key-button" aria-label="'+esc(key.accessibilityName)+'">'+
      '<span class="primary-label">'+primaryMarkup(key)+'</span>'+
    '</button>'+
  '</div>';
}
function resultMarkup(value){
  const s=String(value??"");
  const mixed=s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
  if(mixed)return '<span class="result-mixed"><span class="result-whole">'+esc(mixed[1])+'</span><span class="result-fraction"><span class="result-numerator">'+esc(mixed[2])+'</span><span class="result-denominator">'+esc(mixed[3])+'</span></span></span>';
  const frac=s.match(/^(-?\d+)\/(\d+)$/);
  if(frac)return '<span class="result-fraction"><span class="result-numerator">'+esc(frac[1])+'</span><span class="result-denominator">'+esc(frac[2])+'</span></span>';
  return esc(s);
}
function promptMarkup(view){const prompt=view.state.prompt;if(!prompt)return "";const variable=prompt.variables?.[prompt.index]??"X";return '<div class="calculator-prompt" role="dialog" aria-label="'+esc(prompt.kind)+'"><strong>'+esc(prompt.kind)+'</strong><div data-prompt-variable="'+esc(variable)+'">'+esc(variable)+' = ?</div></div>'}
function menuMarkup(view){
  const menu=view.state.menu;if(!menu)return "";
  if(menu.id==="MODE")return '<div class="calculator-menu" role="dialog" aria-label="Mode"><div class="menu-title">MODE</div><div class="menu-list">'+menu.choices.map(c=>'<button type="button" data-mode-id="'+c.id+'" class="menu-item">'+c.number+': '+esc(c.label)+'</button>').join("")+'</div><button type="button" data-menu-cancel class="menu-cancel">AC / Back</button></div>';
  if(menu.id==="SETUP")return '<div class="calculator-menu" role="dialog" aria-label="Setup"><div class="menu-title">SETUP</div>'+menu.groups.map(g=>'<section class="setup-group"><strong>'+esc(g.label)+'</strong><div>'+g.choices.map(v=>'<button type="button" data-setup-group="'+g.id+'" data-setup-value="'+v+'" class="menu-item">'+esc(v)+'</button>').join("")+'</div></section>').join("")+'<button type="button" data-menu-cancel class="menu-cancel">AC / Back</button></div>';
  return "";
}
export function renderCalculatorMarkup(view,locale="ar"){
  const dir="ltr";
  const controlMap=new Map(PHYSICAL_LAYOUT_PROFILE.controls.map(id=>[id,keyById.get(id)]).filter(([,k])=>k));
  const scientific=PHYSICAL_LAYOUT_PROFILE.scientific.map(cell=>({cell,key:keyById.get(cell.id)})).filter(x=>x.key);
  const numeric=PHYSICAL_LAYOUT_PROFILE.numeric.map(cell=>({cell,key:keyById.get(cell.id)})).filter(x=>x.key);
  const nav=PHYSICAL_LAYOUT_PROFILE.replay.map(cell=>keyById.get(cell.id)).filter(Boolean);
  return '<section class="calculator-shell" dir="'+dir+'"><div class="calculator-face" dir="ltr">'+
    '<div class="calculator-brand"><div><strong>Math Scientific</strong><small>Natural Display</small></div><span>CLASSIC</span></div>'+
    '<div class="calculator-display"><div class="display-status" dir="ltr">'+
      '<span class="'+(view.state.shift?"active":"")+'">S</span><span class="'+(view.state.alpha?"active":"")+'">A</span><span>'+esc(view.state.angleMode)+'</span><span>'+esc(view.state.mode)+'</span></div>'+
      '<div class="math-input" dir="ltr" aria-label="Expression">'+(view.mathHtml||'<span class="math-placeholder">0</span>')+'</div>'+
      '<output class="math-result" dir="ltr" aria-live="polite" aria-label="'+esc(view.result)+'">'+resultMarkup(view.result)+'</output></div>'+
    '<div class="control-deck"><div class="control-side control-left">'+keyMarkup(controlMap.get("SHIFT"))+keyMarkup(controlMap.get("ALPHA"))+'</div>'+
      '<div class="replay-pad" aria-label="Replay navigation"><div class="replay-up">'+keyMarkup(nav[0])+'</div><div class="replay-left">'+keyMarkup(nav[1])+'</div><div class="replay-center">REPLAY</div><div class="replay-right">'+keyMarkup(nav[2])+'</div><div class="replay-down">'+keyMarkup(nav[3])+'</div></div>'+
      '<div class="control-side control-right">'+keyMarkup(controlMap.get("MODE"))+'</div></div>'+
    '<div class="scientific-grid">'+scientific.map(({key,cell})=>scientificKeyMarkup(key,cell)).join("")+
    '</div><div class="numeric-grid">'+numeric.map(({key,cell})=>keyMarkup(key,cell)).join("")+'</div>'+menuMarkup(view)+promptMarkup(view)+'</div></section>';
}
export function mapKeyboardToKeyId(key){
  if(/^[0-9]$/.test(key))return "DIGIT_"+key;
  return ({".":"DECIMAL","+":"ADD","-":"SUBTRACT","*":"MULTIPLY","/":"FRAC","Enter":"EQUALS","=":"EQUALS","Backspace":"DEL","Escape":"AC","ArrowUp":"REPLAY_UP","ArrowDown":"REPLAY_DOWN","ArrowLeft":"REPLAY_LEFT","ArrowRight":"REPLAY_RIGHT","(":"LPAREN",")":"RPAREN"})[key]??null;
}
export function mountCalculator(root,controller,locale="ar"){
  const render=()=>{
    root.innerHTML=renderCalculatorMarkup(controller.view(),locale);
    root.querySelectorAll("[data-key-id]").forEach(btn=>btn.addEventListener("click",()=>{controller.dispatch(btn.dataset.keyId);render()}));
    root.querySelectorAll("[data-mode-id]").forEach(btn=>btn.addEventListener("click",()=>{controller.selectMode(btn.dataset.modeId);render()}));
    root.querySelectorAll("[data-setup-group]").forEach(btn=>btn.addEventListener("click",()=>{controller.selectSetup(btn.dataset.setupGroup,btn.dataset.setupValue);render()}));
    root.querySelector("[data-menu-cancel]")?.addEventListener("click",()=>{controller.cancelMenu();render()});
  };
  render();
  return {rerender:render,keydown(event){const id=mapKeyboardToKeyId(event.key);if(!id)return false;event.preventDefault?.();controller.dispatch(id);render();return true},setLocale(next){locale=next;render()}};
}
