const DAY_MS=86400000;
const UNITS=new Set(["days","weeks","months","years"]);

export function parseIsoDate(value){
  const m=String(value??"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)throw new Error("INVALID_DATE");
  const y=Number(m[1]),mo=Number(m[2])-1,d=Number(m[3]);
  const t=Date.UTC(y,mo,d);
  const dt=new Date(t);
  if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==mo||dt.getUTCDate()!==d)throw new Error("INVALID_DATE");
  return t;
}

function isoFromUtc(t){
  const dt=new Date(t);
  if(!Number.isFinite(t)||Number.isNaN(dt.getTime()))throw new Error("INVALID_DATE");
  return dt.toISOString().slice(0,10);
}

function lastDayOfMonthUtc(year,month){
  return new Date(Date.UTC(year,month+1,0)).getUTCDate();
}

export function daysBetween(start,end){
  return Math.round((parseIsoDate(end)-parseIsoDate(start))/DAY_MS);
}

export function dateDifferenceDetails(start,end){
  const signedDays=daysBetween(start,end);
  const absoluteDays=Math.abs(signedDays);
  return{
    signedDays,
    absoluteDays,
    inclusiveDays:absoluteDays+1,
    weeks:Math.floor(absoluteDays/7),
    remainingDays:absoluteDays%7
  };
}

export function addDateUnits(date,amount,unit="days"){
  const value=Number(amount);
  if(!Number.isFinite(value)||!Number.isInteger(value))throw new Error("INVALID_OFFSET");
  unit=String(unit??"days").toLowerCase();
  if(!UNITS.has(unit))throw new Error("INVALID_DATE_UNIT");
  const t=parseIsoDate(date);
  if(unit==="days")return isoFromUtc(t+value*DAY_MS);
  if(unit==="weeks")return isoFromUtc(t+value*7*DAY_MS);

  const source=new Date(t);
  const y=source.getUTCFullYear(),m=source.getUTCMonth(),d=source.getUTCDate();
  if(unit==="months"){
    const total=y*12+m+value;
    const targetYear=Math.floor(total/12);
    const targetMonth=((total%12)+12)%12;
    const targetDay=Math.min(d,lastDayOfMonthUtc(targetYear,targetMonth));
    return isoFromUtc(Date.UTC(targetYear,targetMonth,targetDay));
  }

  const targetYear=y+value;
  const targetDay=Math.min(d,lastDayOfMonthUtc(targetYear,m));
  return isoFromUtc(Date.UTC(targetYear,m,targetDay));
}

export function addDays(date,days){
  return addDateUnits(date,days,"days");
}
