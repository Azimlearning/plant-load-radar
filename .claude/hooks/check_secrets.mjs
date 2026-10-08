#!/usr/bin/env node
/**
 * Secret-literal guard — PreToolUse hook on Write/Edit/MultiEdit.
 *
 * Reads Claude Code's hook JSON on stdin. For file-write tools, scans the content
 * being written for key-shaped literals. On a match, exits 2 with a message naming
 * the file, the line, and the fix — so the model self-corrects without the user
 * having to intervene.
 *
 * Node built-ins only, by design — a hook that needs `npm install` breaks on a fresh
 * clone, and Node is already required by this project's stack (ADR D-05).
 *
 * Ported from the /newproject Python template. PATTERNS trimmed to the providers
 * this project might use; AWS / Slack / Stripe removed.
 */

import { basename } from "node:path";

// [label, regex] — order matters only for message readability.
const PATTERNS = [
  ["JWT token (eyJ…)", /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/],
  [
    "High-entropy literal near key/secret/token/password",
    /(?:api[_-]?key|secret|token|password)[^A-Za-z0-9\n]{1,8}[A-Za-z0-9+/=_-]{32,}/i,
  ],
  // Covers Azure / Foundry style 32-hex keys.
  ["32-char hex key literal", /(?:=|:\s*['"])[0-9a-f]{32}(?:['"]|$)/],
  ["GitHub PAT", /gh[pousr]_[A-Za-z0-9]{30,}/],
  ["Anthropic API key", /sk-ant-[A-Za-z0-9_-]{20,}/],
  ["OpenAI API key", /sk-(?!ant-)(?:proj-)?[A-Za-z0-9_-]{20,}/],
  ["Google API key", /AIza[0-9A-Za-z_-]{35}/],
  ["Private key block", /-----BEGIN (?:RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/],
];

// Where secrets are supposed to live in THIS project.
const FIX_LINES = [
  "  - Put the value in .env (gitignored) and read it in SERVER code only via src/llm/ or config — never in source, prompts, data files, docs, a NEXT_PUBLIC_* variable, or a client component.",
  "  - Document the variable NAME (not the value) in .env.example and refdocs/guides/env_setup.md.",
  "  - Demo data files (public / model-generated / synthetic) must contain no keys either.",
];

const ALLOW_MARK = "pragma: allowlist secret";

// Files that are allowed to contain secret-shaped strings.
const ALLOWED_BASENAMES = new Set(["check_secrets.mjs"]);
const ALLOWED_PREFIXES = [".env"];
// Lockfiles and vendored code produce endless false positives.
const SKIP_SUBSTRINGS = ["node_modules/", "/vendor/", ".lock", "-lock.json"];

function extract(data) {
  const tool = data.tool_name ?? "";
  const ti = data.tool_input ?? {};
  if (tool === "Write") return [ti.file_path ?? "?", ti.content ?? ""];
  if (tool === "Edit") return [ti.file_path ?? "?", ti.new_string ?? ""];
  if (tool === "MultiEdit") {
    const edits = Array.isArray(ti.edits) ? ti.edits : [];
    return [ti.file_path ?? "?", edits.map((e) => e?.new_string ?? "").join("\n")];
  }
  return null;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const raw = await readStdin();
  let data;
  try {
    data = raw.trim() ? JSON.parse(raw) : {};
  } catch (e) {
    // Fail open: never block work because the hook could not parse its input.
    console.error(`[check_secrets] warning: malformed hook JSON (${e.message}); pass-through.`);
    return 0;
  }

  const pair = extract(data);
  if (pair === null) return 0;
  const [path, content] = pair;

  const norm = String(path).replaceAll("\\", "/");
  const base = basename(norm);
  if (ALLOWED_BASENAMES.has(base) || ALLOWED_PREFIXES.some((p) => base.startsWith(p))) return 0;
  if (SKIP_SUBSTRINGS.some((frag) => norm.includes(frag))) return 0;

  const lines = String(content)
    .split(/\r?\n/)
    .filter((ln) => !ln.includes(ALLOW_MARK));

  const findings = [];
  for (const [label, pattern] of PATTERNS) {
    const hits = [];
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        hits.push([i + 1, lines[i].trim().slice(0, 160)]);
        if (hits.length >= 3) break;
      }
    }
    if (hits.length) findings.push([label, hits]);
  }

  if (!findings.length) return 0;

  const msg = [`BLOCKED: secret literal detected in ${path}`, ""];
  for (const [label, hits] of findings) {
    msg.push(`  ${label}:`);
    for (const [i, snippet] of hits) msg.push(`    line ${i}: ${snippet}`);
    msg.push("");
  }
  msg.push("Fix:", ...FIX_LINES, "", `False positive? Append '// ${ALLOW_MARK}' (or '# ${ALLOW_MARK}') to that line. Use sparingly.`);
  console.error(msg.join("\n"));
  return 2;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    // Fail open on any unexpected hook error.
    console.error(`[check_secrets] warning: unexpected error (${err?.message ?? err}); pass-through.`);
    process.exit(0);
  },
);
