import test from "node:test";
import assert from "node:assert/strict";
import { PHYSICAL_LAYOUT_PROFILE } from "../src/calculator/physical-layout-profile.js";

test("physical layout gives every scientific key an explicit row and column", () => {
  const cells=PHYSICAL_LAYOUT_PROFILE.scientific;
  const seen=new Set();
  for(const cell of cells){
    assert.ok(Number.isInteger(cell.row) && cell.row>=1);
    assert.ok(Number.isInteger(cell.col) && cell.col>=1 && cell.col<=6);
    const pos=`${cell.row}:${cell.col}`;
    assert.equal(seen.has(pos),false,`duplicate coordinate ${pos}`);
    seen.add(pos);
  }
});

test("numeric keypad has fixed traditional coordinates", () => {
  const byId=new Map(PHYSICAL_LAYOUT_PROFILE.numeric.map(x=>[x.id,x]));
  const expected={
    DIGIT_7:[1,1],DIGIT_8:[1,2],DIGIT_9:[1,3],DEL:[1,4],AC:[1,5],
    DIGIT_4:[2,1],DIGIT_5:[2,2],DIGIT_6:[2,3],MULTIPLY:[2,4],DIVIDE:[2,5],
    DIGIT_1:[3,1],DIGIT_2:[3,2],DIGIT_3:[3,3],ADD:[3,4],SUBTRACT:[3,5],
    DIGIT_0:[4,1],DECIMAL:[4,2],EXP:[4,3],ANS:[4,4],EQUALS:[4,5]
  };
  for(const [id,[row,col]] of Object.entries(expected)){
    assert.deepEqual([byId.get(id)?.row,byId.get(id)?.col],[row,col],id);
  }
});

test("standalone SETUP and ON do not exist in the physical web profile", () => {
  const ids=[...PHYSICAL_LAYOUT_PROFILE.controls,...PHYSICAL_LAYOUT_PROFILE.scientific,...PHYSICAL_LAYOUT_PROFILE.numeric].map(x=>typeof x==="string"?x:x.id);
  assert.equal(ids.includes("SETUP"),false);
  assert.equal(ids.includes("ON"),false);
});
