export function validateMeasurementId(value){
  return /^G-[A-Z0-9]{6,20}$/.test(String(value??"").trim());
}
function installTag(id){
  if(document.querySelector('script[data-math-ga4]'))return;
  const script=document.createElement("script");
  script.async=true;
  script.dataset.mathGa4="true";
  script.src="https://www.googletagmanager.com/gtag/js?id="+encodeURIComponent(id);
  document.head.appendChild(script);
  window.dataLayer=window.dataLayer||[];
  window.gtag=function(){window.dataLayer.push(arguments)};
  window.gtag("js",new Date());
  window.gtag("config",id,{anonymize_ip:true});
}
export function initGoogleAnalytics(config={}){
  const measurementId=String(config.measurementId??"").trim();
  if(!validateMeasurementId(measurementId))return{enabled:false,reason:"MISSING_MEASUREMENT_ID"};
  installTag(measurementId);
  return{enabled:true,measurementId};
}
export function trackVirtualPage(path,title=document.title){
  if(typeof window==="undefined"||typeof window.gtag!=="function")return false;
  window.gtag("event","page_view",{page_path:path,page_title:title});
  return true;
}
