import { defineConfig } from "tsup";

// Bundle the CLI to a single ESM file. The shebang in src/index.ts is preserved
// by tsup, so dist/index.js is directly executable as the `create-kenalin` bin.
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
});
