import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseInteger, bitwise, describeInteger, toSignedWord, toUnsignedWord } from "../src/programmer/programmer-engine.js";

test("Programmer parses matching numeric prefixes",()=>{
  assert.equal(parseInteger("0xFF",16),255n);
  assert.equal(parseInteger("0b1010",2),10n);
  assert.equal(parseInteger("0o77",8),63n);
});

test("Programmer uses fixed-width two's-complement representations",()=>{
  const d=describeInteger(255n,{wordSize:8});
  assert.equal(d.bin,"11111111");
  assert.equal(d.hex,"FF");
  assert.equal(d.signedDec,"-1");
  assert.equal(d.unsignedDec,"255");
  assert.equal(toSignedWord(128n,8),-128n);
  assert.equal(toUnsignedWord(-1n,8),255n);
});

test("Programmer bitwise operations wrap to selected word size",()=>{
  assert.equal(bitwise("not",0n,0n,{wordSize:8}),255n);
  assert.equal(bitwise("shl",0x80n,1n,{wordSize:8}),0n);
  assert.equal(bitwise("and",0x1FFn,0xF0n,{wordSize:8}),0xF0n);
});

test("Programmer distinguishes logical and arithmetic right shift",()=>{
  assert.equal(bitwise("shr",0x80n,1n,{wordSize:8,signed:false}),0x40n);
  assert.equal(bitwise("shr",0x80n,1n,{wordSize:8,signed:true}),0xC0n);
});

test("Programmer rejects negative or out-of-range shifts",()=>{
  assert.throws(()=>bitwise("shl",1n,-1n,{wordSize:8}),/INVALID_SHIFT/);
  assert.throws(()=>bitwise("shr",1n,8n,{wordSize:8}),/INVALID_SHIFT/);
});

test("Programmer UI exposes word size signed mode and operand-state behavior",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(index,/id="programmer-word-size"/);
  assert.match(index,/id="programmer-signed"/);
  assert.match(index,/id="programmer-help"/);
  assert.match(app,/programmerB\.disabled=programmerOp\.value==="convert"\|\|programmerOp\.value==="not"/);
  assert.match(app,/describeInteger\(value,\{wordSize\}\)/);
});
