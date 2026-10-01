import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Math Lab completion UI exposes advanced examples and references",()=>{
  const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
  for(const hook of ["functionHandles","persistentScope","switchCases","tryCatch","mathLabIndexingCommands","mathLabHigherOrderCommands","mathLabScopeCommands","mathLabAdvancedControlCommands","mathLabUtilityCommands"]){
    assert.match(index,new RegExp(hook),hook);
  }
});

test("Math Lab app preserves runtime state between Run actions",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(app,/let mathLabRuntimeState=\{globals:\{\},persistents:\{\}\}/);
  assert.match(app,/runMathLabScript\(mathLabInput\.value,mathLabWorkspaceState,\{runtimeState:mathLabRuntimeState\}\)/);
  assert.match(app,/mathLabRuntimeState=result\.runtimeState\?\?mathLabRuntimeState/);
  assert.match(app,/mathLabRuntimeState=\{globals:\{\},persistents:\{\}\}/);
});

test("Math Lab workspace marks non-double runtime objects read-only",()=>{
  const app=readFileSync(new URL("../src/app.js",import.meta.url),"utf8");
  assert.match(app,/meta\.className==="double"/);
  assert.match(app,/readOnly/);
});

test("Math Lab completion errors are localized",()=>{
  const strings=readFileSync(new URL("../src/i18n/ui-strings.js",import.meta.url),"utf8");
  for(const code of ["ml_LOGICAL_INDEX_SIZE_MISMATCH","ml_INVALID_FUNCTION_HANDLE","ml_FUNCTION_HAS_NO_OUTPUT","ml_FUNCTION_HANDLE_REQUIRED","ml_PERSISTENT_OUTSIDE_FUNCTION","ml_SWITCH_SCALAR_REQUIRED","ml_INVALID_DIMENSION"]){
    const matches=strings.match(new RegExp(code,"g"))??[];
    assert.ok(matches.length>=2,code);
  }
});
