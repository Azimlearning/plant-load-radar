#!/usr/bin/env node
/**
 * Hard constraint #1 / #3 (CLAUDE.md): no hard-coded figures in application code.
 * Strips comments from every non-test .ts/.tsx file under src/core and src/app, then fails if a
 * numeric literal with 3+ digits or a decimal fraction remains outside a named SCREAMING_CASE
 * constant declaration. Named constants must carry a source comment (reviewed by a human).
 *
 *   node scripts/check-literals.mjs        # exit 0 = clean, 1 = findings
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src/core", "src/app"];
const NAMED_CONSTANT = /^\s*(export\s+)?const\s+[A-Z][A-Z0-9_]*\b/;

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const files = ROOTS.flatMap(walk).filter((f) => /\.(ts|tsx)$/.test(f) && !/\.test\.tsx?$/.test(f));
const findings = [];

for (const file of files) {
  const code = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/\/\/.*$/gm, "");
  code.split("\n").forEach((line, i) => {
    if (NAMED_CONSTANT.test(line)) return;
    const hits = (line.match(/\b\d[\d_]*\.?\d*\b/g) ?? []).filter(
      (x) => x.replace(/[_.]/g, "").length >= 3 || /^0\.\d+$/.test(x),
    );
    if (hits.length) findings.push(`${file}:${i + 1}: ${line.trim()}   <-- ${hits.join(", ")}`);
  });
}

if (findings.length) {
  console.error("Hard-coded figures found (move them to data/ or a named, sourced constant):\n" + findings.join("\n"));
  process.exit(1);
}
console.log(`check-literals: ${files.length} files scanned, no hard-coded figures.`);
