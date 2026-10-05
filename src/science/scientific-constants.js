export const SCIENTIFIC_CONSTANTS = Object.freeze({
  c0: Object.freeze({symbol:"c", name:"Speed of light in vacuum", value:299792458, unit:"m/s", exact:true}),
  hplanck: Object.freeze({symbol:"h", name:"Planck constant", value:6.62607015e-34, unit:"J s", exact:true}),
  hbar: Object.freeze({symbol:"ℏ", name:"Reduced Planck constant", value:1.0545718176461565e-34, unit:"J s", exact:false}),
  qe: Object.freeze({symbol:"e", name:"Elementary charge", value:1.602176634e-19, unit:"C", exact:true}),
  kb: Object.freeze({symbol:"k_B", name:"Boltzmann constant", value:1.380649e-23, unit:"J/K", exact:true}),
  na: Object.freeze({symbol:"N_A", name:"Avogadro constant", value:6.02214076e23, unit:"1/mol", exact:true}),
  gasr: Object.freeze({symbol:"R", name:"Molar gas constant", value:8.31446261815324, unit:"J/(mol K)", exact:false}),
  grav: Object.freeze({symbol:"G", name:"Newtonian constant of gravitation", value:6.67430e-11, unit:"m^3/(kg s^2)", exact:false}),
  g0: Object.freeze({symbol:"g₀", name:"Standard gravity", value:9.80665, unit:"m/s^2", exact:true}),
  me: Object.freeze({symbol:"m_e", name:"Electron mass", value:9.1093837139e-31, unit:"kg", exact:false}),
  mp: Object.freeze({symbol:"m_p", name:"Proton mass", value:1.67262192595e-27, unit:"kg", exact:false}),
  eps0: Object.freeze({symbol:"ε₀", name:"Vacuum electric permittivity", value:8.8541878188e-12, unit:"F/m", exact:false}),
  mu0: Object.freeze({symbol:"μ₀", name:"Vacuum magnetic permeability", value:1.25663706127e-6, unit:"N/A^2", exact:false}),
  sigma_sb: Object.freeze({symbol:"σ", name:"Stefan-Boltzmann constant", value:5.670374419e-8, unit:"W/(m^2 K^4)", exact:false}),
  atm: Object.freeze({symbol:"atm", name:"Standard atmosphere", value:101325, unit:"Pa", exact:true}),
  au: Object.freeze({symbol:"au", name:"Astronomical unit", value:149597870700, unit:"m", exact:true}),
  ly: Object.freeze({symbol:"ly", name:"Light-year", value:9460730472580800, unit:"m", exact:true}),
  tau: Object.freeze({symbol:"τ", name:"Tau", value:2*Math.PI, unit:"1", exact:false}),
  phi: Object.freeze({symbol:"φ", name:"Golden ratio", value:(1+Math.sqrt(5))/2, unit:"1", exact:false}),
  epsmach: Object.freeze({symbol:"εmach", name:"IEEE-754 machine epsilon", value:Number.EPSILON, unit:"1", exact:true})
});

export const SCIENTIFIC_CONSTANT_ALIASES = Object.freeze({
  c:"c0",
  lightspeed:"c0",
  h:"hplanck",
  plank:"hplanck",
  planck:"hplanck",
  elementarycharge:"qe",
  echarge:"qe",
  boltzmann:"kb",
  avogadro:"na",
  rgas:"gasr",
  gravitationalconstant:"grav",
  standardgravity:"g0",
  electronmass:"me",
  protonmass:"mp",
  epsilon0:"eps0",
  vacuumpermittivity:"eps0",
  vacuumpermeability:"mu0",
  stefanboltzmann:"sigma_sb",
  machineepsilon:"epsmach",
  eps:"epsmach"
});

export function getScientificConstant(id){
  const key=String(id??"").toLowerCase();
  const canonical=SCIENTIFIC_CONSTANT_ALIASES[key]??key;
  return SCIENTIFIC_CONSTANTS[canonical]??null;
}

export function listScientificConstants(){
  return Object.entries(SCIENTIFIC_CONSTANTS).map(([id,value])=>({id,...value}));
}
