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
  const offset=Number(days);
  if(!Number.isFinite(offset)||!Number.isInteger(offset))throw new Error("INVALID_OFFSET");
  const t=parseIsoDate(date)+offset*86400000;
  const dt=new Date(t);
  if(!Number.isFinite(t)||Number.isNaN(dt.getTime()))throw new Error("INVALID_OFFSET");
  return dt.toISOString().slice(0,10);
}
