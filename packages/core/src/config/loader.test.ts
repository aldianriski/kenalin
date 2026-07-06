import { describe, it, expect } from "vitest";
import { loadConfig, tryLoadConfig, ConfigValidationError } from "./loader.js";
import type { KenalinConfigInput } from "./schema.js";

/** A minimal valid config used as a base for mutation in tests. */
function baseConfig(): KenalinConfigInput {
  return {
    owner: { name: "Demo Owner", role: "Engineer", website: "https://demo.example" },
    assistant: { name: "NARA", languages: ["id", "en"] },
    handoff: { email: { address: "hi@demo.example" } },
  };
}

describe("loadConfig", () => {
  it("loads a valid config and applies defaults", () => {
    const cfg = loadConfig(baseConfig());
    expect(cfg.owner.name).toBe("Demo Owner");
    // defaults applied
    expect(cfg.modules.portfolioDiscovery).toBe(true);
    expect(cfg.storage.lead).toBe("none");
    expect(cfg.qualification.maxQuestions).toBe(3);
    expect(cfg.qualification.hardCap).toBe(5);
    expect(cfg.complexity.showPricing).toBe(false);
  });

  it("fails with a precise error when a required field is missing", () => {
    const bad = { assistant: { name: "NARA" } };
    expect(() => loadConfig(bad)).toThrow(ConfigValidationError);
    const res = tryLoadConfig(bad);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const paths = res.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("owner");
    }
  });

  it("rejects contactHandoff enabled with no channel configured", () => {
    const cfg = baseConfig();
    cfg.handoff = {};
    const res = tryLoadConfig(cfg);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.message).toMatch(/no handoff channel/);
    }
  });

  it("rejects hardCap < maxQuestions", () => {
    const cfg = baseConfig();
    cfg.qualification = { maxQuestions: 5, hardCap: 3 };
    const res = tryLoadConfig(cfg);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.message).toMatch(/hardCap must be >= /);
    }
  });

  it("locks showPricing to false (schema rejects true)", () => {
    const cfg = baseConfig() as Record<string, unknown>;
    cfg.complexity = { enabled: true, showPricing: true };
    const res = tryLoadConfig(cfg);
    expect(res.ok).toBe(false);
  });

  it("rejects an invalid owner website URL", () => {
    const cfg = baseConfig();
    cfg.owner.website = "not-a-url";
    expect(() => loadConfig(cfg)).toThrow(ConfigValidationError);
  });
});
