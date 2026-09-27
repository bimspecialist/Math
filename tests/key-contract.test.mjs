import test from "node:test";
import assert from "node:assert/strict";
import { KEY_CONTRACT, validateKeyContract } from "../src/calculator/key-contract.js";
import { ES_PLUS_PROFILE } from "../src/calculator/behavior-profile.js";

const requiredIds = [
  "SHIFT","ALPHA","MODE","SETUP","ON",
  "REPLAY_UP","REPLAY_DOWN","REPLAY_LEFT","REPLAY_RIGHT",
  "FRAC","CALC","S_D","DEL","AC","ANS",
  "DIGIT_0","DIGIT_1","DIGIT_2","DIGIT_3","DIGIT_4",
  "DIGIT_5","DIGIT_6","DIGIT_7","DIGIT_8","DIGIT_9",
  "ADD","SUBTRACT","MULTIPLY","DIVIDE","EQUALS"
];

test("approved required keys exist", () => {
  const ids = new Set(KEY_CONTRACT.map(k => k.id));
  for (const id of requiredIds) assert.equal(ids.has(id), true, `missing ${id}`);
});

test("every visible legend has a matching action", () => {
  const errors = validateKeyContract(KEY_CONTRACT, ES_PLUS_PROFILE);
  assert.deepEqual(errors, []);
});

test("duplicate key ids fail validation", () => {
  const broken = [...KEY_CONTRACT, KEY_CONTRACT[0]];
  assert.match(validateKeyContract(broken, ES_PLUS_PROFILE).join("\n"), /duplicate/i);
});

test("unknown command ids fail validation", () => {
  const broken = KEY_CONTRACT.map((k, i) => i === 0 ? {...k, primaryAction:"UNKNOWN_CMD"} : k);
  assert.match(validateKeyContract(broken, ES_PLUS_PROFILE).join("\n"), /unknown/i);
});
