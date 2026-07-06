import { describe, expect, it } from "vitest";
import { BrandingConfigSchema, ThemeTokensSchema } from "./schema.js";

describe("BrandingConfigSchema", () => {
  it("accepts logo/avatar URLs + theme tokens", () => {
    const parsed = BrandingConfigSchema.parse({
      logoUrl: "https://cdn.example.com/logo.png",
      avatarUrl: "https://cdn.example.com/avatar.png",
      theme: { accent: "#FF5722", radius: "12px" },
    });
    expect(parsed.logoUrl).toBe("https://cdn.example.com/logo.png");
    expect(parsed.theme?.accent).toBe("#FF5722");
  });

  it("rejects a non-URL logo", () => {
    expect(() => BrandingConfigSchema.parse({ logoUrl: "not-a-url" })).toThrow();
  });

  it("rejects any field that would hide the Powered-by footer (strict, D2)", () => {
    // The footer is non-removable: there is no such field, and strict parsing
    // refuses one — this is the guarantee, enforced at the schema boundary.
    expect(() => BrandingConfigSchema.parse({ hideFooter: true })).toThrow();
    expect(() => BrandingConfigSchema.parse({ showPoweredBy: false })).toThrow();
    expect(() => BrandingConfigSchema.parse({ poweredBy: "" })).toThrow();
  });

  it("rejects unknown theme tokens (strict) — only known --kenalin-* tokens apply", () => {
    expect(() => ThemeTokensSchema.parse({ accent: "#fff" })).not.toThrow();
    expect(() => ThemeTokensSchema.parse({ notAToken: "#fff" })).toThrow();
  });
});
