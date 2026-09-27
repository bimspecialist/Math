import { KEY_CONTRACT } from "./key-contract.js";

const keyById = new Map(KEY_CONTRACT.map(k=>[k.id,k]));
const controlIds = new Set(["SHIFT","ALPHA","MODE","SETUP","ON"]);
const navIds = ["REPLAY_UP","REPLAY_LEFT","REPLAY_RIGHT","REPLAY_DOWN"];
const numericIds = new Set([
  "DIGIT_0","DIGIT_1","DIGIT_2","DIGIT_3","DIGIT_4","DIGIT_5","DIGIT_6","DIGIT_7","DIGIT_8","DIGIT_9",
  "DECIMAL","ADD","SUBTRACT","MULTIPLY","DIVIDE","DEL","AC","EQUALS"
]);

const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function fractionIcon(){return '<span class="key-fraction-icon" aria-hidden="true"><span>□</span><span class="bar"></span><span>□</span></span>'}
function primaryMarkup(key){return key.id==="FRAC"?fractionIcon():esc(key.primaryLabel)}
function keyMarkup(key){
  const shift=key.shiftLabel?'<span class="shift-legend">'+esc(key.shiftLabel)+'</span>':'<span class="shift-legend empty" aria-hidden="true"></span>';
  const alpha=key.alphaLabel?'<span class="alpha-legend">'+esc(key.alphaLabel)+'</span>':"";
  return '<button data-key-id="'+key.id+'" type="button" class="calc-key role-'+key.styleRole+'" aria-label="'+esc(key.accessibilityName)+'">'+shift+alpha+'<span class="primary-label">'+primaryMarkup(key)+'</span></button>';
}
function menuMarkup(view){
  const menu=view.state.menu;if(!menu)return "";
  if(menu.id==="MODE")return '<div class="calculator-menu" role="dialog" aria-label="Mode"><div class="menu-title">MODE</div><div class="menu-list">'+menu.choices.map(c=>'<button type="button" data-mode-id="'+c.id+'" class="menu-item">'+c.number+': '+esc(c.label)+'</button>').join("")+'</div><button type="button" data-menu-cancel class="menu-cancel">AC / Back</button></div>';
  if(menu.id==="SETUP")return '<div class="calculator-menu" role="dialog" aria-label="Setup"><div class="menu-title">SETUP</div>'+menu.groups.map(g=>'<section class="setup-group"><strong>'+esc(g.label)+'</strong><div>'+g.choices.map(v=>'<button type="button" data-setup-group="'+g.id+'" data-setup-value="'+v+'" class="menu-item">'+esc(v)+'</button>').join("")+'</div></section>').join("")+'<button type="button" data-menu-cancel class="menu-cancel">AC / Back</button></div>';
  return "";
}
export function renderCalculatorMarkup(view,locale="ar"){
  const dir=locale==="ar"?"rtl":"ltr";
  const controlMap=new Map(KEY_CONTRACT.filter(k=>controlIds.has(k.id)).map(k=>[k.id,k]));
  const scientific=KEY_CONTRACT.filter(k=>!controlIds.has(k.id)&&!navIds.includes(k.id)&&!numericIds.has(k.id));
  const numeric=KEY_CONTRACT.filter(k=>numericIds.has(k.id));
  const nav=navIds.map(id=>keyById.get(id)).filter(Boolean);
  return '<section class="calculator-shell" dir="'+dir+'">'+
    '<div class="calculator-brand"><div><strong>Math Scientific</strong><small>Natural Display</small></div><span>CLASSIC</span></div>'+
    '<div class="calculator-display"><div class="display-status" dir="ltr">'+
      '<span class="'+(view.state.shift?"active":"")+'">S</span><span class="'+(view.state.alpha?"active":"")+'">A</span><span>'+esc(view.state.angleMode)+'</span><span>'+esc(view.state.mode)+'</span></div>'+
      '<div class="math-input" dir="ltr" aria-label="Expression">'+(view.mathHtml||'<span class="math-placeholder">0</span>')+'</div>'+
      '<output class="math-result" dir="ltr" aria-live="polite">'+esc(view.result)+'</output></div>'+
    '<div class="control-deck"><div class="control-side control-left">'+keyMarkup(controlMap.get("SHIFT"))+keyMarkup(controlMap.get("ALPHA"))+'</div>'+
      '<div class="replay-pad" aria-label="Replay navigation"><div class="replay-up">'+keyMarkup(nav[0])+'</div><div class="replay-left">'+keyMarkup(nav[1])+'</div><div class="replay-center">REPLAY</div><div class="replay-right">'+keyMarkup(nav[2])+'</div><div class="replay-down">'+keyMarkup(nav[3])+'</div></div>'+
      '<div class="control-side control-right">'+keyMarkup(controlMap.get("MODE"))+keyMarkup(controlMap.get("SETUP"))+keyMarkup(controlMap.get("ON"))+'</div></div>'+
    '<div class="scientific-grid">'+scientific.map(keyMarkup).join("")+'</div><div class="numeric-grid">'+numeric.map(keyMarkup).join("")+'</div>'+menuMarkup(view)+'</section>';
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
