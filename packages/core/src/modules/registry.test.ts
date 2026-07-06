import { describe, it, expect } from "vitest";
import { loadConfig } from "../config/loader.js";
import type { KenalinConfigInput } from "../config/schema.js";
import {
  enabledModules,
  isModuleEnabled,
  modulesForIntent,
  quickActions,
  modulePromptFragments,
} from "./registry.js";

function cfg(overrides?: Partial<KenalinConfigInput>) {
  return loadConfig({
    owner: { name: "Demo", role: "Engineer", website: "https://demo.example" },
    assistant: { name: "NARA" },
    handoff: { email: { address: "hi@demo.example" } },
    ...overrides,
  });
}

describe("module registry", () => {
  it("all modules enabled by default", () => {
    expect(enabledModules(cfg())).toHaveLength(7);
  });

  it("a disabled module contributes no prompt, quick action, or routing", () => {
    const c = cfg({
      modules: {
        portfolioDiscovery: true,
        hiringAssistant: false,
        leadQualification: true,
        serviceMatching: true,
        contactHandoff: true,
        calendarBooking: true,
        pageContext: true,
      },
    });
    expect(isModuleEnabled(c, "hiringAssistant")).toBe(false);
    // no hiring quick action
    expect(quickActions(c).some((a) => a.id === "im_hiring")).toBe(false);
    // no hiring prompt fragment
    expect(modulePromptFragments(c).some((f) => f.includes("HIRING ASSISTANT"))).toBe(false);
    // hiring intent engages no hiring module
    expect(modulesForIntent(c, "hiring").some((m) => m.key === "hiringAssistant")).toBe(false);
  });

  it("quick actions are capped at 4 visible", () => {
    expect(quickActions(cfg()).length).toBeLessThanOrEqual(4);
  });

  it("business_opportunity engages qualification, service matching, and handoff", () => {
    const keys = modulesForIntent(cfg(), "business_opportunity").map((m) => m.key);
    expect(keys).toContain("leadQualification");
    expect(keys).toContain("serviceMatching");
    expect(keys).toContain("contactHandoff");
  });

  it("engine boots with every module disabled", () => {
    const c = cfg({
      modules: {
        portfolioDiscovery: false,
        hiringAssistant: false,
        leadQualification: false,
        serviceMatching: false,
        contactHandoff: false,
        calendarBooking: false,
        pageContext: false,
      },
      // handoff channel still allowed even if module off
    });
    expect(enabledModules(c)).toHaveLength(0);
    expect(quickActions(c)).toHaveLength(0);
  });
});
