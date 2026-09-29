const linear=(units)=>({kind:"linear",units});
export const CONVERTER_CATEGORIES={
  volume:linear({m3:1,L:1e-3,mL:1e-6,cm3:1e-6}),
  length:linear({m:1,km:1000,cm:.01,mm:.001,in:0.0254,ft:0.3048,yd:0.9144,mi:1609.344}),
  mass:linear({kg:1,g:.001,mg:1e-6,lb:0.45359237,oz:0.028349523125}),
  energy:linear({J:1,kJ:1000,cal:4.184,kcal:4184,Wh:3600,kWh:3600000}),
  area:linear({m2:1,km2:1e6,cm2:1e-4,ft2:0.09290304,acre:4046.8564224}),
  speed:linear({"m/s":1,"km/h":1/3.6,mph:0.44704,knot:0.514444}),
  time:linear({s:1,min:60,h:3600,day:86400}),
  power:linear({W:1,kW:1000,MW:1e6,hp:745.6998715822702}),
  data:linear({B:1,kB:1e3,MB:1e6,GB:1e9,TB:1e12,KiB:1024,MiB:1048576,GiB:1073741824}),
  pressure:linear({Pa:1,kPa:1000,bar:100000,atm:101325,psi:6894.757293168}),
  angle:linear({rad:1,deg:Math.PI/180,grad:Math.PI/200}),
  temperature:{kind:"temperature",units:{C:"C",F:"F",K:"K"}}
};
function tempToC(v,u){if(u==="C")return v;if(u==="F")return(v-32)*5/9;if(u==="K")return v-273.15;throw new Error("UNKNOWN_UNIT")}
function cToTemp(v,u){if(u==="C")return v;if(u==="F")return v*9/5+32;if(u==="K")return v+273.15;throw new Error("UNKNOWN_UNIT")}
export function convertUnit(category,value,from,to){
  const c=CONVERTER_CATEGORIES[category];
  if(!c)throw new Error("UNKNOWN_CATEGORY");
  value=Number(value);if(!Number.isFinite(value))throw new Error("INVALID_VALUE");
  if(c.kind==="temperature")return cToTemp(tempToC(value,from),to);
  if(!(from in c.units)||!(to in c.units))throw new Error("UNKNOWN_UNIT");
  return value*c.units[from]/c.units[to];
}
export function unitsFor(category){return Object.keys(CONVERTER_CATEGORIES[category]?.units??{})}
