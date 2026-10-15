import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");

function scopedBlock(document, key, indentation) {
  const lines = document.split(/\r?\n/);
  const heading = " ".repeat(indentation) + key + ":";
  const start = lines.findIndex(line => line.trimEnd() === heading);
  assert.notEqual(start, -1, "Missing YAML block: " + heading);

  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end];
    if (line.trim() && !line.trimStart().startsWith("#") && line.length - line.trimStart().length <= indentation) break;
    end++;
  }
  return lines.slice(start + 1, end).join("\n");
}

function permissionMap(section, indentation) {
  const block = scopedBlock(section, "permissions", indentation);
  const entries = block.split("\n").filter(line => line.trim() && !line.trimStart().startsWith("#"))
    .map(line => {
      const match = line.match(new RegExp("^ {" + (indentation + 2) + "}([a-z-]+): (read|write|none)$"));
      assert.ok(match, "Unexpected permissions declaration: " + line);
      return [match[1], match[2]];
    });
  assert.equal(new Set(entries.map(([name]) => name)).size, entries.length, "Duplicate permissions");
  return Object.fromEntries(entries);
}

test("verify has read-only permissions and only deploy may request Pages write access", () => {
  const jobs = scopedBlock(workflow, "jobs", 0);
  const verify = scopedBlock(jobs, "verify", 2);
  const deploy = scopedBlock(jobs, "deploy", 2);

  assert.deepEqual(permissionMap(workflow, 0), { contents: "read" });
  assert.deepEqual(permissionMap(verify, 4), { contents: "read" });
  assert.deepEqual(permissionMap(deploy, 4), {
    contents: "read",
    pages: "write",
    "id-token": "write",
  });
});

test("deployment still requires verified main-branch pushes", () => {
  const jobs = scopedBlock(workflow, "jobs", 0);
  const deploy = scopedBlock(jobs, "deploy", 2);

  assert.match(deploy, /^    if: github\.ref == 'refs\/heads\/main' && github\.event_name != 'pull_request'$/m);
  assert.match(deploy, /^    needs: verify$/m);
  assert.match(workflow, /^      - "automation\/\*\*"$/m);
});
