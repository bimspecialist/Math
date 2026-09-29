function parseIsoDate(value){
  const m=String(value??"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)throw new Error("INVALID_DATE");
  const y=Number(m[1]),mo=Number(m[2])-1,d=Number(m[3]);
  const t=Date.UTC(y,mo,d);
  const dt=new Date(t);
  if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==mo||dt.getUTCDate()!==d)throw new Error("INVALID_DATE");
  return t;
}
export function daysBetween(start,end){
  return Math.round((parseIsoDate(end)-parseIsoDate(start))/86400000);
}
export function addDays(date,days){
  const t=parseIsoDate(date)+Number(days)*86400000;
  if(!Number.isFinite(t))throw new Error("INVALID_OFFSET");
  return new Date(t).toISOString().slice(0,10);
}
