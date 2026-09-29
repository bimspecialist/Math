const EPS=1e-12;
const finitePositive=value=>{
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0)throw new Error("INVALID_RAMP_VALUE");
  return n;
};
const clean=n=>Math.abs(n)<EPS?0:Number(n.toPrecision(14));

export function calculateRamp({rise=null,run=null,length=null}={}){
  let r=rise==null||rise===""?null:finitePositive(rise);
  let h=run==null||run===""?null:finitePositive(run);
  let l=length==null||length===""?null:finitePositive(length);
  const known=[r,h,l].filter(v=>v!==null).length;
  if(known<2)throw new Error("RAMP_REQUIRES_TWO_VALUES");
  if(r!==null&&h!==null){
    l=Math.hypot(r,h);
  }else if(r!==null&&l!==null){
    if(l<=r)throw new Error("INVALID_RAMP_GEOMETRY");
    h=Math.sqrt(l*l-r*r);
  }else if(h!==null&&l!==null){
    if(l<=h)throw new Error("INVALID_RAMP_GEOMETRY");
    r=Math.sqrt(l*l-h*h);
  }
  const angleRad=Math.atan2(r,h);
  const gradePercent=r/h*100;
  const ratioRun=h/r;
  return{
    rise:clean(r),run:clean(h),length:clean(l),
    angleDeg:clean(angleRad*180/Math.PI),
    gradePercent:clean(gradePercent),
    ratioRun:clean(ratioRun),
    ratioText:`1:${clean(ratioRun)}`
  };
}
