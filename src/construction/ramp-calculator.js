const EPS=1e-12;
const CONSISTENCY_TOLERANCE=1e-9;

const finitePositive=value=>{
  const n=Number(value);
  if(!Number.isFinite(n)||n<=0)throw new Error("INVALID_RAMP_VALUE");
  return n;
};
const clean=n=>Math.abs(n)<EPS?0:Number(n.toPrecision(14));
const closeEnough=(a,b)=>{
  const scale=Math.max(1,Math.abs(a),Math.abs(b));
  return Math.abs(a-b)<=scale*CONSISTENCY_TOLERANCE;
};

function resultFromGeometry(r,h,l,derivedField){
  const angleRad=Math.atan2(r,h);
  const gradePercent=r/h*100;
  const ratioRun=h/r;
  return{
    rise:clean(r),
    run:clean(h),
    length:clean(l),
    angleDeg:clean(angleRad*180/Math.PI),
    gradePercent:clean(gradePercent),
    ratioRun:clean(ratioRun),
    ratioText:`1:${clean(ratioRun)}`,
    derivedField
  };
}

export function calculateRamp({rise=null,run=null,length=null}={}){
  let r=rise==null||rise===""?null:finitePositive(rise);
  let h=run==null||run===""?null:finitePositive(run);
  let l=length==null||length===""?null:finitePositive(length);
  const known=[r,h,l].filter(v=>v!==null).length;

  if(known<2)throw new Error("RAMP_REQUIRES_TWO_VALUES");

  let derivedField="verified";
  if(known===3){
    const expected=Math.hypot(r,h);
    if(!closeEnough(expected,l))throw new Error("RAMP_INCONSISTENT_VALUES");
    l=expected;
  }else if(r!==null&&h!==null){
    l=Math.hypot(r,h);
    derivedField="length";
  }else if(r!==null&&l!==null){
    if(l<=r)throw new Error("INVALID_RAMP_GEOMETRY");
    h=Math.sqrt(l*l-r*r);
    derivedField="run";
  }else if(h!==null&&l!==null){
    if(l<=h)throw new Error("INVALID_RAMP_GEOMETRY");
    r=Math.sqrt(l*l-h*h);
    derivedField="rise";
  }

  return resultFromGeometry(r,h,l,derivedField);
}

export function calculateRampFromSlope({rise=null,slopeType="ratio",slopeValue=null}={}){
  const r=finitePositive(rise);
  const value=finitePositive(slopeValue);
  let run;

  if(slopeType==="ratio"){
    run=r*value;
  }else if(slopeType==="grade"){
    run=r/(value/100);
  }else if(slopeType==="angle"){
    if(value>=90)throw new Error("INVALID_RAMP_ANGLE");
    run=r/Math.tan(value*Math.PI/180);
  }else{
    throw new Error("INVALID_RAMP_SLOPE_TYPE");
  }

  return calculateRamp({rise:r,run});
}

export function rampConsistencyError({rise,run,length}={}){
  try{
    const result=calculateRamp({rise,run,length});
    return result.derivedField==="verified"?0:null;
  }catch(error){
    if(error.message!=="RAMP_INCONSISTENT_VALUES")throw error;
    const r=finitePositive(rise),h=finitePositive(run),l=finitePositive(length);
    return clean(l-Math.hypot(r,h));
  }
}
