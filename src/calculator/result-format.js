export function formatExactDecimal(result, displayMode="EXACT"){
  if(result?.kind!=="value") return result?.code ?? "Math Error";
  if(displayMode==="EXACT" && result.exact) return result.exact;
  if(displayMode==="DECIMAL" && result.exact?.includes("/")){
    const [n,d]=result.exact.split("/").map(Number); return String(n/d);
  }
  return String(result.numeric);
}
