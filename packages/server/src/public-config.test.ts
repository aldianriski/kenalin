import { describe, expect, it } from "vitest";
import { KenalinConfigSchema } from "@kenalin/core";
import { toPublicConfig } from "./public-config.js";

/** Minimal valid config + optional overrides, parsed through the real schema. */
const makeConfig = (extra: Record<string, unknown> = {}) =>
  KenalinConfigSchema.parse({
    owner: { name: "Demo Owner", role: "Engineer", website: "https://demo.example.com" },
    assistant: { name: "NARA" },
    handoff: { email: { address: "hi@demo.example.com" } },
    ...extra,
  });

describe("toPublicConfig — branding", () => {
  it("exposes branding when configured (public-safe: URLs + theme only)", () => {
    const pub = toPublicConfig(
      makeConfig({
        branding: { logoUrl: "https://cdn.example.com/logo.png", theme: { accent: "#FF5722" } },
      }),
    );
    expect(pub.branding?.logoUrl).toBe("https://cdn.example.com/logo.png");
    expect(pub.branding?.theme?.accent).toBe("#FF5722");
  });

  it("omits branding when none is configured", () => {
    expect(toPublicConfig(makeConfig()).branding).toBeUndefined();
  });

  it("never leaks secrets or server-only fields", () => {
    const json = JSON.stringify(
      toPublicConfig(makeConfig({ branding: { logoUrl: "https://x.example.com/l.png" } })),
    );
    expect(json).not.toMatch(/apiKey|secret|webhook|KENALIN_LLM/i);
  });
});
