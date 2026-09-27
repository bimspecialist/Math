export const COMMAND_IDS = new Set([
  "SHIFT","ALPHA","OPEN_MODE_MENU","OPEN_SETUP_MENU","POWER_ON",
  "REPLAY_UP","REPLAY_DOWN","REPLAY_LEFT","REPLAY_RIGHT",
  "INSERT_FRACTION","INSERT_MIXED_FRACTION","INSERT_SQRT","INSERT_SQUARE",
  "INSERT_POWER","INSERT_NTH_ROOT","INSERT_FUNCTION","INSERT_CONSTANT",
  "INSERT_TOKEN","FACTORIAL","NCR","NPR","NEGATE","DMS","HYP",
  "CALC","SOLVE","STORE","RECALL","MEMORY_ADD","MEMORY_SUBTRACT",
  "TOGGLE_EXACT_DECIMAL","TOGGLE_MIXED_IMPROPER","ENG","ANS",
  "DELETE","CLEAR","EVALUATE"
]);

export const ES_PLUS_PROFILE = Object.freeze({
  id: "es-plus-style",
  label: "Classic Scientific",
  modifierBehavior: Object.freeze({ shift: "one-shot", alpha: "one-shot" }),
  modes: Object.freeze([
    { id: "COMP", label: "COMP", implemented: true },
    { id: "CMPLX", label: "CMPLX", implemented: false },
    { id: "STAT", label: "STAT", implemented: false },
    { id: "BASE_N", label: "BASE-N", implemented: false },
    { id: "EQN", label: "EQN", implemented: false },
    { id: "MATRIX", label: "MATRIX", implemented: false },
    { id: "TABLE", label: "TABLE", implemented: false },
    { id: "VECTOR", label: "VECTOR", implemented: false }
  ]),
  setup: Object.freeze({
    angleModes: ["DEG","RAD","GRAD"],
    inputOutputModes: ["MATH","LINE"],
    fractionFormats: ["IMPROPER","MIXED"]
  })
});
