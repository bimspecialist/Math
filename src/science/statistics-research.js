const SQRT2PI=Math.sqrt(2*Math.PI);
function logGamma(z){
  const p=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if(z<0.5)return Math.log(Math.PI)-Math.log(Math.sin(Math.PI*z))-logGamma(1-z);
  z-=1;let x=p[0];for(let i=1;i<p.length;i++)x+=p[i]/(z+i);
  const t=z+p.length-1.5;return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(x);
}
function betaContinuedFraction(a,b,x){
  const MAX=200,EPS=3e-14,FPMIN=1e-300;
  const qab=a+b,qap=a+1,qam=a-1;
  let c=1,d=1-qab*x/qap;if(Math.abs(d)<FPMIN)d=FPMIN;d=1/d;let h=d;
  for(let m=1;m<=MAX;m++){
    const m2=2*m;
    let aa=m*(b-m)*x/((qam+m2)*(a+m2));d=1+aa*d;if(Math.abs(d)<FPMIN)d=FPMIN;c=1+aa/c;if(Math.abs(c)<FPMIN)c=FPMIN;d=1/d;h*=d*c;
    aa=-(a+m)*(qab+m)*x/((a+m2)*(qap+m2));d=1+aa*d;if(Math.abs(d)<FPMIN)d=FPMIN;c=1+aa/c;if(Math.abs(c)<FPMIN)c=FPMIN;d=1/d;const del=d*c;h*=del;
    if(Math.abs(del-1)<EPS)break;
  }
  return h;
}
export function regularizedBeta(x,a,b){
  if(!(a>0&&b>0)||x<0||x>1)return NaN;
  if(x===0)return 0;if(x===1)return 1;
  const bt=Math.exp(logGamma(a+b)-logGamma(a)-logGamma(b)+a*Math.log(x)+b*Math.log1p(-x));
  return x<(a+1)/(a+b+2)?bt*betaContinuedFraction(a,b,x)/a:1-bt*betaContinuedFraction(b,a,1-x)/b;
}
export function studentTPdf(t,df){
  if(!(df>0))return NaN;
  return Math.exp(logGamma((df+1)/2)-logGamma(df/2))/(Math.sqrt(df*Math.PI))*Math.pow(1+t*t/df,-(df+1)/2);
}
export function studentTCdf(t,df){
  if(!(df>0))return NaN;
  if(t===0)return 0.5;
  const x=df/(df+t*t),ib=regularizedBeta(x,df/2,0.5);
  return t>0?1-0.5*ib:0.5*ib;
}
export function studentTInv(p,df){
  if(!(p>0&&p<1&&df>0))return NaN;
  if(p===0.5)return 0;
  const sign=p<0.5?-1:1,target=p<0.5?p:1-p;
  let lo=0,hi=1;
  while(1-studentTCdf(hi,df)>target&&hi<1e6)hi*=2;
  for(let i=0;i<120;i++){const mid=(lo+hi)/2,tail=1-studentTCdf(mid,df);if(tail>target)lo=mid;else hi=mid}
  return sign*(lo+hi)/2;
}
function regularizedGammaP(a,x){
  if(!(a>0)||x<0)return NaN;if(x===0)return 0;
  const gln=logGamma(a),EPS=1e-14,ITMAX=300,FPMIN=1e-300;
  if(x<a+1){
    let ap=a,sum=1/a,del=sum;
    for(let n=1;n<=ITMAX;n++){ap++;del*=x/ap;sum+=del;if(Math.abs(del)<Math.abs(sum)*EPS)break}
    return sum*Math.exp(-x+a*Math.log(x)-gln);
  }
  let b=x+1-a,c=1/FPMIN,d=1/b,h=d;
  for(let i=1;i<=ITMAX;i++){const an=-i*(i-a);b+=2;d=an*d+b;if(Math.abs(d)<FPMIN)d=FPMIN;c=b+an/c;if(Math.abs(c)<FPMIN)c=FPMIN;d=1/d;const del=d*c;h*=del;if(Math.abs(del-1)<EPS)break}
  return 1-Math.exp(-x+a*Math.log(x)-gln)*h;
}
export function chiSquareCdf(x,df){return x<0||!(df>0)?NaN:regularizedGammaP(df/2,x/2)}
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const sampleVariance=a=>{if(a.length<2)return NaN;const m=mean(a);return a.reduce((s,v)=>s+(v-m)**2,0)/(a.length-1)};
const cleanData=data=>{
  if(!Array.isArray(data))return null;
  const values=data.map(Number);
  return values.every(Number.isFinite)?values:null;
};
export function oneSampleTTest(data,mu0=0,alpha=0.05){
  const x=cleanData(data),nullMean=Number(mu0),level=Number(alpha);
  if(!x||x.length<2||!Number.isFinite(nullMean)||!(level>0&&level<1))return{kind:"error",code:"INVALID_INPUT"};
  const n=x.length,m=mean(x),variance=sampleVariance(x),sd=Math.sqrt(variance),se=sd/Math.sqrt(n),df=n-1;
  if(se===0)return{kind:"error",code:"ZERO_VARIANCE"};
  const t=(m-nullMean)/se,p=2*(1-studentTCdf(Math.abs(t),df)),critical=studentTInv(1-level/2,df),margin=critical*se;
  return{kind:"t-test",n,mean:m,sd,se,df,t,pValue:p,alpha:level,confidence:1-level,ci:[m-margin,m+margin],reject:p<level};
}
export function linearRegression(xValues,yValues,alpha=0.05){
  const x=cleanData(xValues),y=cleanData(yValues),level=Number(alpha);
  if(!x||!y||x.length!==y.length||x.length<3||!(level>0&&level<1))return{kind:"error",code:"INVALID_INPUT"};
  const n=x.length,mx=mean(x),my=mean(y),sxx=x.reduce((sum,v)=>sum+(v-mx)**2,0),sxy=x.reduce((sum,v,i)=>sum+(v-mx)*(y[i]-my),0);
  if(sxx===0)return{kind:"error",code:"ZERO_VARIANCE"};
  const slope=sxy/sxx,intercept=my-slope*mx,pred=x.map(v=>intercept+slope*v),res=y.map((v,i)=>v-pred[i]);
  const sse=res.reduce((sum,v)=>sum+v*v,0),sst=y.reduce((sum,v)=>sum+(v-my)**2,0);
  if(sst===0)return{kind:"error",code:"ZERO_RESPONSE_VARIANCE"};
  const df=n-2,mse=sse/df,r2=1-sse/sst;
  const slopeSE=Math.sqrt(mse/sxx),interceptSE=Math.sqrt(mse*(1/n+mx*mx/sxx));
  const tSlope=slopeSE===0?(slope===0?0:Math.sign(slope)*Infinity):slope/slopeSE;
  const pSlope=slopeSE===0?(slope===0?1:0):2*(1-studentTCdf(Math.abs(tSlope),df));
  const critical=studentTInv(1-level/2,df);
  return{kind:"linear-regression",n,slope,intercept,r2,sse,mse,df,slopeSE,interceptSE,tSlope,pSlope,alpha:level,slopeCI:[slope-critical*slopeSE,slope+critical*slopeSE]};
}
export function chiSquareGoodnessOfFit(observed,expected,estimatedParameters=0){
  const o=cleanData(observed),e=cleanData(expected),estimated=Number(estimatedParameters);
  if(!o||!e||o.length!==e.length||o.length<2||o.some(v=>v<0)||e.some(v=>v<=0)||!Number.isInteger(estimated)||estimated<0)return{kind:"error",code:"INVALID_INPUT"};
  const observedTotal=o.reduce((sum,v)=>sum+v,0),expectedTotal=e.reduce((sum,v)=>sum+v,0);
  const totalScale=Math.max(1,Math.abs(observedTotal),Math.abs(expectedTotal));
  if(Math.abs(observedTotal-expectedTotal)>1e-10*totalScale)return{kind:"error",code:"EXPECTED_TOTAL_MISMATCH"};
  const df=o.length-1-estimated;
  if(df<=0)return{kind:"error",code:"INVALID_DF"};
  const statistic=o.reduce((sum,v,i)=>sum+(v-e[i])**2/e[i],0),p=1-chiSquareCdf(statistic,df);
  return{kind:"chi-square",statistic,df,pValue:p,observedTotal,expectedTotal,estimatedParameters:estimated};
}
