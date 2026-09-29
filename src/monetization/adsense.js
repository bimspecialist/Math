export function validateAdSenseClient(value){
  return /^ca-pub-\d{16}$/.test(String(value??"").trim());
}
export function validateAdSlot(value){
  return /^\d{6,20}$/.test(String(value??"").trim());
}

function loadScript(client){
  if(document.querySelector('script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]'))return;
  const script=document.createElement("script");
  script.async=true;
  script.crossOrigin="anonymous";
  script.dataset.mathAdsense="true";
  script.src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client="+encodeURIComponent(client);
  document.head.appendChild(script);
}

export function initAdSense(config={}){
  const client=String(config.client??"").trim();
  if(!validateAdSenseClient(client))return{enabled:false,reason:"MISSING_ADSENSE_CLIENT"};
  loadScript(client);
  let units=0;
  const slots=config.slots??{};
  document.querySelectorAll("[data-ad-placement]").forEach(container=>{
    const placement=container.dataset.adPlacement;
    const slot=String(slots[placement]??"").trim();
    if(!validateAdSlot(slot)){container.hidden=true;return}
    container.hidden=false;
    if(container.querySelector("ins.adsbygoogle"))return;
    container.replaceChildren();
    const ins=document.createElement("ins");
    ins.className="adsbygoogle";
    ins.style.display="block";
    ins.dataset.adClient=client;
    ins.dataset.adSlot=slot;
    ins.dataset.adFormat="auto";
    ins.dataset.fullWidthResponsive="true";
    container.appendChild(ins);
    try{(window.adsbygoogle=window.adsbygoogle||[]).push({});}catch{}
    units++;
  });
  return{enabled:true,units,autoAds:Boolean(config.autoAds)};
}
