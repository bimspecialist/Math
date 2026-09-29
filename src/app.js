import { CalculatorController } from "./calculator/calculator-controller.js";
import { mountCalculator } from "./calculator/render-calculator.js";
import { solveAdvancedInput } from "./advanced/advanced-solver.js";
const controller=new CalculatorController();
const calculatorRoot=document.querySelector("#calculator-root");
let locale=document.documentElement.lang==="en"?"en":"ar";
const mounted=mountCalculator(calculatorRoot,controller,locale);
document.addEventListener("keydown",event=>{if(event.target instanceof HTMLTextAreaElement||event.target instanceof HTMLInputElement)return;mounted.keydown(event)});
document.querySelector("#lang-toggle")?.addEventListener("click",event=>{locale=locale==="ar"?"en":"ar";document.documentElement.lang=locale;document.documentElement.dir=locale==="ar"?"rtl":"ltr";event.currentTarget.textContent=locale==="ar"?"EN":"AR";document.querySelector("#page-title").textContent=locale==="ar"?"الحاسبة العلمية":"Scientific Calculator";document.querySelector("[data-tab-target='calculator']").textContent=locale==="ar"?"الحاسبة":"Calculator";mounted.setLocale(locale)});
document.querySelectorAll("[data-tab-target]").forEach(button=>button.addEventListener("click",()=>{const target=button.dataset.tabTarget;document.querySelectorAll("[data-tab-target]").forEach(x=>x.classList.toggle("active",x===button));document.querySelectorAll(".page-section").forEach(section=>section.classList.toggle("active",section.id===target+"-section"))}));
function handleImage(file){if(!file)return;const preview=document.querySelector("#scan-preview");preview.src=URL.createObjectURL(file);preview.hidden=false;document.querySelector("#scan-note").textContent="تم اختيار الصورة. Math Recognition الفعلي سيُربط بمزوّد server-side لاحقًا؛ راجع المعادلة يدويًا قبل الحل."}
document.querySelector("#image-upload")?.addEventListener("change",e=>handleImage(e.target.files?.[0]));
document.querySelector("#camera-upload")?.addEventListener("change",e=>handleImage(e.target.files?.[0]));

const advancedInput=document.querySelector("#advanced-input");
const advancedResult=document.querySelector("#advanced-result");
function formatAdvancedResult(r){
  if(r.kind==="value")return `= ${r.exact??r.numeric}`;
  if(r.kind==="solution")return `${r.variable} = ${r.value}`;
  if(r.kind==="equation-check")return r.equal?"المعادلة صحيحة":"طرفا المعادلة غير متساويين";
  const messages={
    EMPTY_INPUT:"اكتب تعبيرًا أو معادلة أولًا.",
    MULTIPLE_VARIABLES:"المحلل المحلي يحل حاليًا معادلة بمجهول واحد فقط.",
    VARIABLE_REQUIRES_EQUATION:"أضف علامة = لحل التعبير الذي يحتوي متغيرًا.",
    INVALID_EQUATION:"صيغة المعادلة غير صحيحة.",
    INVALID_EXPRESSION:"تعذر قراءة التعبير.",
    NO_NUMERIC_SOLUTION:"لم يتم العثور على حل عددي من نقاط البدء المتاحة.",
    DIVISION_BY_ZERO:"قسمة على صفر.",
    DOMAIN_ERROR:"القيمة خارج مجال الدالة.",
    UNSUPPORTED_OPERATION:"العملية غير مدعومة حاليًا."
  };
  const suffix=r.variables?.length?` (${r.variables.join(", ")})`:"";
  return (messages[r.code]??r.code)+suffix;
}
document.querySelector("#advanced-solve")?.addEventListener("click",()=>{
  const result=solveAdvancedInput(advancedInput?.value??"");
  if(advancedResult){advancedResult.textContent=formatAdvancedResult(result);advancedResult.dataset.kind=result.kind}
});
advancedInput?.addEventListener("keydown",event=>{
  if((event.ctrlKey||event.metaKey)&&event.key==="Enter"){event.preventDefault();document.querySelector("#advanced-solve")?.click()}
});
