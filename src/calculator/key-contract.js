import { COMMAND_IDS } from "./behavior-profile.js";

const key = (id, primaryLabel, primaryAction, extra = {}) => Object.freeze({
  id, primaryLabel, primaryAction,
  shiftLabel: null, shiftAction: null,
  alphaLabel: null, alphaAction: null,
  styleRole: "function",
  expressionTemplate: null,
  navigationBehavior: null,
  accessibilityName: primaryLabel,
  regressionCaseIds: [],
  ...extra
});

export const KEY_CONTRACT = Object.freeze([
  key("SHIFT","SHIFT","SHIFT",{styleRole:"modifier"}),
  key("ALPHA","ALPHA","ALPHA",{styleRole:"modifier"}),
  key("MODE","MODE","OPEN_MODE_MENU",{shiftLabel:"SETUP",shiftAction:"OPEN_SETUP_MENU",styleRole:"control"}),
  key("SETUP","SETUP","OPEN_SETUP_MENU",{styleRole:"control"}),
  key("REPLAY_UP","↑","REPLAY_UP",{styleRole:"nav"}),
  key("REPLAY_DOWN","↓","REPLAY_DOWN",{styleRole:"nav"}),
  key("REPLAY_LEFT","←","REPLAY_LEFT",{styleRole:"nav"}),
  key("REPLAY_RIGHT","→","REPLAY_RIGHT",{styleRole:"nav"}),
  key("FRAC","▭⁄▭","INSERT_FRACTION",{shiftLabel:"a b/c",shiftAction:"INSERT_MIXED_FRACTION",expressionTemplate:"fraction",navigationBehavior:"numerator-denominator-exit"}),
  key("SQRT","√","INSERT_SQRT",{shiftLabel:"x²",shiftAction:"INSERT_SQUARE",expressionTemplate:"sqrt"}),
  key("POWER","xʸ","INSERT_POWER",{shiftLabel:"ⁿ√x",shiftAction:"INSERT_NTH_ROOT",expressionTemplate:"power"}),
  key("INVERSE","x⁻¹","INSERT_TOKEN",{shiftLabel:"x!",shiftAction:"FACTORIAL",expressionTemplate:"^(-1)"}),
  key("LOG","log","INSERT_FUNCTION",{shiftLabel:"10ˣ",shiftAction:"INSERT_FUNCTION",expressionTemplate:"log"}),
  key("LN","ln","INSERT_FUNCTION",{shiftLabel:"eˣ",shiftAction:"INSERT_FUNCTION",expressionTemplate:"ln"}),
  key("NEGATE","(-)","NEGATE",{alphaLabel:"A",alphaAction:"INSERT_VARIABLE"}),
  key("DMS","°′″","DMS",{alphaLabel:"B",alphaAction:"INSERT_VARIABLE"}),
  key("HYP","hyp","HYP",{alphaLabel:"C",alphaAction:"INSERT_VARIABLE"}),
  key("SIN","sin","INSERT_FUNCTION",{shiftLabel:"sin⁻¹",shiftAction:"INSERT_FUNCTION",alphaLabel:"D",alphaAction:"INSERT_VARIABLE"}),
  key("COS","cos","INSERT_FUNCTION",{shiftLabel:"cos⁻¹",shiftAction:"INSERT_FUNCTION",alphaLabel:"E",alphaAction:"INSERT_VARIABLE"}),
  key("TAN","tan","INSERT_FUNCTION",{shiftLabel:"tan⁻¹",shiftAction:"INSERT_FUNCTION",alphaLabel:"F",alphaAction:"INSERT_VARIABLE"}),
  key("NCR","nCr","NCR",{shiftLabel:"nPr",shiftAction:"NPR"}),
  key("ABS","Abs","INSERT_FUNCTION"),
  key("CALC","CALC","CALC",{shiftLabel:"SOLVE",shiftAction:"SOLVE",alphaLabel:"=",alphaAction:"INSERT_EQUALITY"}),
  key("RCL","RCL","RECALL",{shiftLabel:"STO",shiftAction:"STORE"}),
  key("ENG","ENG","ENG"), key("LPAREN","(","INSERT_TOKEN",{expressionTemplate:"("}), key("RPAREN",")","INSERT_TOKEN",{expressionTemplate:")",alphaLabel:"X",alphaAction:"INSERT_VARIABLE"}),
  key("S_D","S⇔D","TOGGLE_EXACT_DECIMAL",{shiftLabel:"a b/c⇔d/c",shiftAction:"TOGGLE_MIXED_IMPROPER",alphaLabel:"Y",alphaAction:"INSERT_VARIABLE"}),
  key("M_PLUS","M+","MEMORY_ADD",{shiftLabel:"M−",shiftAction:"MEMORY_SUBTRACT",alphaLabel:"M",alphaAction:"INSERT_VARIABLE"}),
  key("EXP","×10ˣ","INSERT_TOKEN",{expressionTemplate:"*10^"}), key("ANS","Ans","ANS"),
  ...Array.from({length:10},(_,n)=>key(`DIGIT_${n}`,String(n),"INSERT_TOKEN",{styleRole:"number",expressionTemplate:String(n)})),
  key("DECIMAL",".","INSERT_TOKEN",{styleRole:"number",expressionTemplate:"."}),
  key("ADD","+","INSERT_TOKEN",{styleRole:"operator",expressionTemplate:"+"}),
  key("SUBTRACT","−","INSERT_TOKEN",{styleRole:"operator",expressionTemplate:"-"}),
  key("MULTIPLY","×","INSERT_TOKEN",{styleRole:"operator",expressionTemplate:"*"}),
  key("DIVIDE","÷","INSERT_TOKEN",{styleRole:"operator",expressionTemplate:"/"}),
  key("DEL","DEL","DELETE",{styleRole:"danger"}), key("AC","AC","CLEAR",{styleRole:"danger"}), key("EQUALS","=","EVALUATE",{styleRole:"equals"})
]);

export function validateKeyContract(keys, profile) {
  const errors = [], ids = new Set();
  for (const k of keys) {
    if (ids.has(k.id)) errors.push(`duplicate key id: ${k.id}`);
    ids.add(k.id);
    if (!COMMAND_IDS.has(k.primaryAction)) errors.push(`unknown primary action ${k.primaryAction} on ${k.id}`);
    if (k.shiftLabel && !k.shiftAction) errors.push(`visible SHIFT legend without action on ${k.id}`);
    if (k.shiftAction && !COMMAND_IDS.has(k.shiftAction)) errors.push(`unknown SHIFT action ${k.shiftAction} on ${k.id}`);
    if (k.alphaLabel && !k.alphaAction) errors.push(`visible ALPHA legend without action on ${k.id}`);
    if (k.alphaAction && !COMMAND_IDS.has(k.alphaAction)) errors.push(`unknown ALPHA action ${k.alphaAction} on ${k.id}`);
  }
  if (!profile?.id) errors.push("behavior profile missing id");
  return errors;
}
