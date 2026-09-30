import { spawnSync } from "node:child_process";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { KEY_CONTRACT, validateKeyContract } from "../src/calculator/key-contract.js";
import { ES_PLUS_PROFILE } from "../src/calculator/behavior-profile.js";
import { buildModeMenu } from "../src/calculator/menu-controller.js";
const failures=[];
const required=["SHIFT","ALPHA","MODE","REPLAY_UP","REPLAY_DOWN","REPLAY_LEFT","REPLAY_RIGHT","FRAC","CALC","S_D","DEL","AC","ANS","EQUALS"];
const ids=new Set(KEY_CONTRACT.map(k=>k.id));for(const id of required)if(!ids.has(id))failures.push("missing required key: "+id);
failures.push(...validateKeyContract(KEY_CONTRACT,ES_PLUS_PROFILE));
for(const key of KEY_CONTRACT)for(const action of [key.primaryAction,key.shiftAction,key.alphaAction].filter(Boolean))if(/NOOP|PLACEHOLDER/i.test(action))failures.push("placeholder action on "+key.id+": "+action);
const modeMenu=buildModeMenu(ES_PLUS_PROFILE);for(const choice of modeMenu.choices){const mode=ES_PLUS_PROFILE.modes.find(m=>m.id===choice.id);if(!mode?.implemented)failures.push("unimplemented visible mode: "+choice.id)}
const workflow=".github/workflows/pages.yml";if(!existsSync(workflow))failures.push("Pages workflow missing");else if(!readFileSync(workflow,"utf8").includes("node scripts/verify-calculator.mjs"))failures.push("Pages workflow does not run calculator verification");
const testFiles=readdirSync("tests").filter(name=>name.endsWith(".test.mjs")).sort().map(name=>"tests/"+name);
const tests=spawnSync(process.execPath,["--test",...testFiles],{encoding:"utf8"});
if(tests.status!==0)failures.push("test suite failed:\n"+tests.stdout+"\n"+tests.stderr);
if(failures.length){console.error("Calculator verification FAILED");for(const f of failures)console.error("- "+f);process.exit(1)}
console.log("Calculator verification PASS");console.log("keys="+KEY_CONTRACT.length+"; modes="+modeMenu.choices.map(x=>x.id).join(",")+"; testFiles="+testFiles.length+"; tests=PASS");
