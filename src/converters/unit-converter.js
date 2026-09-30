const linear=(units)=>({kind:"linear",units});

export const CONVERTER_CATEGORIES={
  length:linear({m:1,km:1000,cm:0.01,mm:0.001,um:1e-6,nm:1e-9,in:0.0254,ft:0.3048,yd:0.9144,mi:1609.344}),
  area:linear({m2:1,km2:1e6,cm2:1e-4,mm2:1e-6,in2:0.00064516,ft2:0.09290304,yd2:0.83612736,ha:10000,acre:4046.8564224}),
  volume:linear({m3:1,L:1e-3,mL:1e-6,cm3:1e-6,in3:0.000016387064,ft3:0.028316846592,"US gal":0.003785411784,"UK gal":0.00454609}),
  mass:linear({kg:1,t:1000,g:0.001,mg:1e-6,lb:0.45359237,oz:0.028349523125,st:6.35029318}),
  speed:linear({"m/s":1,"km/h":1/3.6,"ft/s":0.3048,mph:0.44704,knot:1852/3600}),
  time:linear({ms:0.001,s:1,min:60,h:3600,day:86400,week:604800}),
  temperature:{kind:"temperature",units:{C:"C",F:"F",K:"K",R:"R"}},
  energy:linear({J:1,kJ:1000,MJ:1e6,cal:4.184,kcal:4184,Wh:3600,kWh:3.6e6,BTU:1055.05585262}),
  power:linear({W:1,kW:1000,MW:1e6,hp:745.6998715822702,"BTU/h":1055.05585262/3600}),
  pressure:linear({Pa:1,kPa:1000,MPa:1e6,bar:100000,atm:101325,psi:6894.757293168,mmHg:133.322387415,torr:101325/760}),
  angle:linear({rad:1,deg:Math.PI/180,grad:Math.PI/200,turn:Math.PI*2}),
  force:linear({N:1,kN:1000,MN:1e6,lbf:4.4482216152605,kgf:9.80665}),
  torque:linear({"N·m":1,"kN·m":1000,"N·mm":0.001,"lbf·ft":1.3558179483314004,"lbf·in":0.1129848290276167}),
  frequency:linear({Hz:1,kHz:1e3,MHz:1e6,GHz:1e9,rpm:1/60}),
  density:linear({"kg/m3":1,"g/cm3":1000,"kg/L":1000,"g/L":1,"lb/ft3":16.01846337396014}),
  data:linear({B:1,kB:1e3,MB:1e6,GB:1e9,TB:1e12,KiB:1024,MiB:1048576,GiB:1073741824,TiB:1099511627776})
};

export const CONVERTER_CATEGORY_ORDER=[
  "length","area","volume","mass","speed","time","temperature","energy","power",
  "pressure","angle","force","torque","frequency","density","data"
];

function tempToK(value,unit){
  if(unit==="K")return value;
  if(unit==="C")return value+273.15;
  if(unit==="F")return(value-32)*5/9+273.15;
  if(unit==="R")return value*5/9;
  throw new Error("UNKNOWN_UNIT");
}
function kToTemp(value,unit){
  if(unit==="K")return value;
  if(unit==="C")return value-273.15;
  if(unit==="F")return(value-273.15)*9/5+32;
  if(unit==="R")return value*9/5;
  throw new Error("UNKNOWN_UNIT");
}

export function convertUnit(category,value,from,to){
  const c=CONVERTER_CATEGORIES[category];
  if(!c)throw new Error("UNKNOWN_CATEGORY");
  const numeric=Number(value);
  if(!Number.isFinite(numeric))throw new Error("INVALID_VALUE");
  if(!(from in c.units)||!(to in c.units))throw new Error("UNKNOWN_UNIT");
  if(c.kind==="temperature"){
    const kelvin=tempToK(numeric,from);
    if(kelvin<0&&Math.abs(kelvin)>1e-12)throw new Error("BELOW_ABSOLUTE_ZERO");
    return kToTemp(Math.max(0,kelvin),to);
  }
  return numeric*c.units[from]/c.units[to];
}

export function conversionFactor(category,from,to){
  const c=CONVERTER_CATEGORIES[category];
  if(!c)throw new Error("UNKNOWN_CATEGORY");
  if(c.kind!=="linear")return null;
  if(!(from in c.units)||!(to in c.units))throw new Error("UNKNOWN_UNIT");
  return c.units[from]/c.units[to];
}

export function formatConversionValue(value,significantDigits=12){
  const numeric=Number(value);
  if(!Number.isFinite(numeric))throw new Error("INVALID_VALUE");
  const digits=Math.max(3,Math.min(15,Math.round(Number(significantDigits)||12)));
  if(numeric===0)return"0";
  const abs=Math.abs(numeric);
  if(abs>=1e12||abs<1e-7)return numeric.toExponential(Math.max(0,digits-1)).replace(/\.0+e/,"e").replace(/(\.\d*?[1-9])0+e/,"$1e");
  return Number(numeric.toPrecision(digits)).toString();
}

export function unitsFor(category){
  return Object.keys(CONVERTER_CATEGORIES[category]?.units??{});
}
