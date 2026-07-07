import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

/**
 * CI gate (PRD FR-1 / H4.6): the reusable engine must contain zero owner-specific
 * strings. Names, phone numbers, and personal handles live in apps/* + content/*,
 * never in packages/*. Fails the build if any leak in.
 */
const FORBIDDEN = [
  { label: "owner name 'Aldi'", re: /\bAldi\b/ },
  { label: "brand 'TemiDev'", re: /\bTemiDev\b/ },
  // International phone numbers (require a leading + so CSS/px/z-index digit
  // runs don't false-positive).
  { label: "phone number", re: /\+\d[\d\s().-]{7,}\d/ },
];
const ROOTS = [
  "packages/core/src",
  "packages/server/src",
  "packages/widget/src",
  "packages/create-kenalin/src",
];
const CODE_EXT = new Set([".ts", ".tsx", ".js", ".mjs"]);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (CODE_EXT.has(extname(entry)) && !full.includes(".test.")) yield full;
  }
}

const violations = [];
for (const root of ROOTS) {
  let files;
  try {
    files = [...walk(root)];
  } catch {
    continue;
  }
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    text.split(/\r?\n/).forEach((line, i) => {
      for (const f of FORBIDDEN) {
        if (f.re.test(line)) violations.push(`${file}:${i + 1}  ${f.label}  → ${line.trim().slice(0, 80)}`);
      }
    });
  }
}

if (violations.length) {
  console.error("✗ owner-specific strings found in packages/* (must live in apps/* + content/*):\n");
  for (const v of violations) console.error("  " + v);
  process.exit(1);
}
console.log("✓ no owner-specific strings in packages/*");
