export const PHYSICAL_LAYOUT_PROFILE = Object.freeze({
  controls: Object.freeze(["SHIFT","ALPHA","MODE"]),
  replay: Object.freeze([
    {id:"REPLAY_UP",slot:"up"},
    {id:"REPLAY_LEFT",slot:"left"},
    {id:"REPLAY_RIGHT",slot:"right"},
    {id:"REPLAY_DOWN",slot:"down"}
  ]),
  scientific: Object.freeze([
    {id:"INVERSE",row:1,col:1},{id:"FRAC",row:1,col:2},{id:"SQRT",row:1,col:3},{id:"POWER",row:1,col:4},{id:"LOG",row:1,col:5},{id:"LN",row:1,col:6},
    {id:"NEGATE",row:2,col:1},{id:"DMS",row:2,col:2},{id:"HYP",row:2,col:3},{id:"SIN",row:2,col:4},{id:"COS",row:2,col:5},{id:"TAN",row:2,col:6},
    {id:"NCR",row:3,col:1},{id:"ABS",row:3,col:2},{id:"CALC",row:3,col:3},{id:"RCL",row:3,col:4},{id:"LPAREN",row:3,col:5},{id:"RPAREN",row:3,col:6},
    {id:"S_D",row:4,col:1},{id:"M_PLUS",row:4,col:2},{id:"ENG",row:4,col:3}
  ]),
  numeric: Object.freeze([
    {id:"DIGIT_7",row:1,col:1},{id:"DIGIT_8",row:1,col:2},{id:"DIGIT_9",row:1,col:3},{id:"DEL",row:1,col:4},{id:"AC",row:1,col:5},
    {id:"DIGIT_4",row:2,col:1},{id:"DIGIT_5",row:2,col:2},{id:"DIGIT_6",row:2,col:3},{id:"MULTIPLY",row:2,col:4},{id:"DIVIDE",row:2,col:5},
    {id:"DIGIT_1",row:3,col:1},{id:"DIGIT_2",row:3,col:2},{id:"DIGIT_3",row:3,col:3},{id:"ADD",row:3,col:4},{id:"SUBTRACT",row:3,col:5},
    {id:"DIGIT_0",row:4,col:1},{id:"DECIMAL",row:4,col:2},{id:"EXP",row:4,col:3},{id:"ANS",row:4,col:4},{id:"EQUALS",row:4,col:5}
  ])
});
