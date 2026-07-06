import { defineConfig } from "tsup";

/**
 * Self-contained bundle of the host-embed adapter for vendoring into a host app
 * (e.g. a Next.js repo). Inlines @kenalin/core + zod so the vendored file has no
 * workspace dependency; excludes Hono and jiti (not imported by embed.ts).
 */
export default defineConfig({
  entry: { "kenalin-engine": "src/embed.ts" },
  format: ["esm"],
  dts: true,
  clean: false,
  sourcemap: false,
  target: "es2022",
  platform: "node",
  noExternal: [/@kenalin\/core/, "zod"],
  outDir: "dist",
});
