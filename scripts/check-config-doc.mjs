import { readFileSync } from "node:fs";
import { KenalinConfigSchema } from "@kenalin/core";

/**
 * Config-doc drift gate. Introspects the authoritative Zod config schema
 * (`KenalinConfigSchema`) and asserts that every field path is documented in
 * docs/CONFIG.md. This ties the reference doc to the schema so a newly-added
 * config field can't silently ship undocumented (SPRINT-009 T2 / TD-004 spirit).
 *
 * It guards field COVERAGE (the common drift). Types/defaults in the doc are
 * hand-maintained; the field set is enforced here.
 *
 * Requires `@kenalin/core` to be BUILT first (resolves to dist, per L-003).
 */
const DOC = "docs/CONFIG.md";

/** Peel wrapper types that don't change a field's structure. */
function unwrap(schema) {
  let cur = schema;
  for (;;) {
    const t = cur?._def?.typeName;
    if (t === "ZodEffects") cur = cur._def.schema;
    else if (t === "ZodDefault") cur = cur._def.innerType;
    else if (t === "ZodOptional") cur = cur._def.innerType;
    else if (t === "ZodNullable") cur = cur._def.innerType;
    else if (t === "ZodCatch") cur = cur._def.innerType;
    else return cur;
  }
}

/** Collect the dotted paths of every leaf field (scalar / enum / array-of-scalar / record). */
function collectLeaves(schema, prefix, out) {
  const s = unwrap(schema);
  if (s?._def?.typeName !== "ZodObject") return;
  const shape = typeof s._def.shape === "function" ? s._def.shape() : s.shape;
  for (const [key, rawChild] of Object.entries(shape)) {
    const path = prefix ? `${prefix}.${key}` : key;
    const child = unwrap(rawChild);
    const t = child?._def?.typeName;
    if (t === "ZodObject") {
      collectLeaves(child, path, out);
    } else if (t === "ZodArray") {
      const el = unwrap(child._def.type);
      if (el?._def?.typeName === "ZodObject") {
        collectLeaves(el, `${path}[]`, out);
      } else {
        out.push(path); // array of scalars / enums
      }
    } else {
      out.push(path); // scalar / enum / boolean / literal / record leaf
    }
  }
}

const leaves = [];
collectLeaves(KenalinConfigSchema, "", leaves);

let doc;
try {
  doc = readFileSync(DOC, "utf8");
} catch {
  console.error(`✗ ${DOC} not found — run the config-doc generator/author.`);
  process.exit(1);
}

const missing = leaves.filter((p) => !doc.includes(p));

if (missing.length) {
  console.error(`✗ ${DOC} is missing ${missing.length} config field(s) from the schema:\n`);
  for (const m of missing) console.error("  " + m);
  console.error(`\nDocument each field (dotted path) in ${DOC}, then re-run.`);
  process.exit(1);
}
console.log(`✓ ${DOC} covers all ${leaves.length} config fields`);
