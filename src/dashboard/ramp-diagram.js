/* Lightweight, dependency-free SVG driven by the actual ramp geometry engine.
   The picture is illustrative at extreme aspect ratios; numeric labels are authoritative. */
const htmlEscape=value=>String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const unitSet=new Set(["m","ft","cm","mm","in"]);
const labelSet={
  en:{rise:"Rise",run:"Run",length:"Ramp length",angle:"Angle",description:"Interactive ramp geometry illustration, not a code compliance check"},
  ar:{rise:"الارتفاع",run:"المسافة الأفقية",length:"طول المنحدر",angle:"الزاوية",description:"رسم توضيحي للمنحدر، وليس فحصًا لمطابقة الكود"}
};
export function rampDiagramLayout(rise,run){
  if(!Number.isFinite(rise)||!Number.isFinite(run)||rise<=0||run<=0)throw new Error("INVALID_RAMP_GEOMETRY");
  // Scale both sides together where possible, and cap the minimum painted
  // size for accessibility. Large aspect ratios are indicative, not to scale.
  const scale=Math.min(340/run,138/rise);
  const width=Math.max(26,Math.min(340,run*scale));
  const height=Math.max(20,Math.min(138,rise*scale));
  return {x0:68,x1:68+width,y0:228,y1:228-height,scaledApproximately:width!==run*scale||height!==rise*scale};
}
export function rampSvgMarkup(result,{unit="m",locale="en"}={}){
  const fields=["rise","run","length","angleDeg","gradePercent","ratioRun"];
  if(!result||!fields.every(key=>Number.isFinite(result[key]))||result.rise<=0||result.run<=0)throw new Error("INVALID_RAMP_GEOMETRY");
  const dimensions=rampDiagramLayout(result.rise,result.run);
  const {x0,x1,y0,y1}=dimensions;
  const lang=locale==="ar"?"ar":"en",labels=labelSet[lang],u=unitSet.has(unit)?unit:"m";
  const f=n=>Number(n).toLocaleString(lang==="ar"?"ar-SA":"en-US",{maximumSignificantDigits:6});
  const title=[labels.description,labels.rise,f(result.rise),u,labels.run,f(result.run),u,labels.length,f(result.length),u,labels.angle,f(result.angleDeg)+"°"].join(" ");
  const mid=(x0+x1)/2,gradient="#e6f2ff";
  const yAngle=y0-16;
  return `<svg class="mw-ramp-svg" viewBox="0 0 520 302" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${htmlEscape(title)}" focusable="false">
    <title>${htmlEscape(title)}</title>
    <line x1="32" y1="${y0}" x2="482" y2="${y0}" stroke="#9aaac3" stroke-width="3"/>
    <polygon points="${x0},${y0} ${x1},${y0} ${x1},${y1}" fill="${gradient}" stroke="#bed4f8" stroke-width="1.5"/>
    <line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#1161ef" stroke-width="4" stroke-linecap="round"/>
    <line x1="${x1}" y1="${y1}" x2="${x1}" y2="${y0}" stroke="#e64f41" stroke-width="2.5"/>
    <line x1="${x0}" y1="${y0+21}" x2="${x1}" y2="${y0+21}" stroke="#15875c" stroke-width="1.6" stroke-dasharray="6 4"/>
    <path d="M${x0+7} ${y0+17} L${x0} ${y0+21} L${x0+7} ${y0+25} M${x1-7} ${y0+17} L${x1} ${y0+21} L${x1-7} ${y0+25}" fill="none" stroke="#15875c" stroke-width="2"/>
    <line x1="${x1+10}" y1="${y0}" x2="${x1+10}" y2="${y1}" stroke="#dc4b40" stroke-width="1.5"/>
    <path d="M${x1+6} ${y0-6} L${x1+10} ${y0} L${x1+14} ${y0-6} M${x1+6} ${y1+6} L${x1+10} ${y1} L${x1+14} ${y1+6}" fill="none" stroke="#dc4b40" stroke-width="1.8"/>
    <path d="M${x0+38} ${y0} A 38 38 0 0 0 ${x0+38*Math.cos(Math.atan2(y0-y1,x1-x0))} ${y0-38*Math.sin(Math.atan2(y0-y1,x1-x0))}" fill="none" stroke="#ed8527" stroke-width="2.6"/>
    <text x="${mid}" y="${Math.max(32,y1-30)}" text-anchor="middle" class="mw-svg-length">${htmlEscape(labels.length)} · ${htmlEscape(f(result.length))} ${u}</text>
    <text x="${x1+18}" y="${(y0+y1)/2-7}" class="mw-svg-rise">${htmlEscape(labels.rise)}</text>
    <text x="${x1+18}" y="${(y0+y1)/2+11}" class="mw-svg-rise mw-svg-number">${htmlEscape(f(result.rise))} ${u}</text>
    <text x="${mid}" y="274" text-anchor="middle" class="mw-svg-run">${htmlEscape(labels.run)} · ${htmlEscape(f(result.run))} ${u}</text>
    <text x="${x0+42}" y="${yAngle}" class="mw-svg-angle">${htmlEscape(f(result.angleDeg))}°</text>
  </svg>`;
}
