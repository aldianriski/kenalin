import { describe, expect, it } from "vitest";
import { themeCssVars, avatarUrl } from "./branding.js";
import type { PublicConfig } from "./types.js";

const cfg = (branding?: PublicConfig["branding"]): PublicConfig =>
  ({ branding }) as PublicConfig;

describe("themeCssVars", () => {
  it("maps known tokens to --kenalin-* custom properties", () => {
    const vars = themeCssVars({ accent: "#FF5722", accentStrong: "#E64A19", radius: "12px" });
    expect(vars).toEqual([
      ["--kenalin-accent", "#FF5722"],
      ["--kenalin-accent-strong", "#E64A19"],
      ["--kenalin-radius", "12px"],
    ]);
  });

  it("ignores unknown keys and empty values", () => {
    expect(themeCssVars({ bogus: "#fff", accent: "  ", navy: "#0F2742" })).toEqual([
      ["--kenalin-navy", "#0F2742"],
    ]);
  });

  it("returns nothing when no theme is given", () => {
    expect(themeCssVars(undefined)).toEqual([]);
  });
});

describe("avatarUrl", () => {
  it("prefers an explicit avatar, then the logo, then nothing", () => {
    expect(avatarUrl(cfg({ avatarUrl: "a.png", logoUrl: "l.png" }))).toBe("a.png");
    expect(avatarUrl(cfg({ logoUrl: "l.png" }))).toBe("l.png");
    expect(avatarUrl(cfg())).toBeUndefined();
    expect(avatarUrl(cfg(undefined))).toBeUndefined();
  });
});
