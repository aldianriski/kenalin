import { describe, expect, it } from "vitest";
import { selectTurnModel } from "./routing.js";
import type { KenalinConfig } from "../config/schema.js";
import type { ChatRequest } from "../schemas/conversation.js";

const cfg = (model: Record<string, unknown>): KenalinConfig =>
  ({ server: { model: { default: "flash", liteMaxChars: 120, ...model } } }) as unknown as KenalinConfig;

const req = (content: string, extra: Partial<ChatRequest> = {}): ChatRequest =>
  ({ messages: [{ role: "user", content }], ...extra }) as ChatRequest;

describe("selectTurnModel (whole-turn swap)", () => {
  it("always uses the default model when no lite model is configured", () => {
    expect(selectTurnModel(cfg({}), req("hi"))).toBe("flash");
  });

  it("routes a trivial first turn to the lite model", () => {
    expect(selectTurnModel(cfg({ lite: "flash-lite" }), req("halo!"))).toBe("flash-lite");
  });

  it("keeps a long message on the default model", () => {
    const long = "a".repeat(200);
    expect(selectTurnModel(cfg({ lite: "flash-lite" }), req(long))).toBe("flash");
  });

  it("keeps later turns (existing conversation) on the default model", () => {
    const multi = req("hi", {
      messages: [
        { role: "user", content: "earlier" },
        { role: "assistant", content: "reply" },
        { role: "user", content: "hi" },
      ],
    } as Partial<ChatRequest>);
    expect(selectTurnModel(cfg({ lite: "flash-lite" }), multi)).toBe("flash");
  });

  it("keeps a project-context turn on the default model (may need grounding)", () => {
    const withProject = req("hi", { pageContext: { url: "x", projectId: "p1" } } as Partial<ChatRequest>);
    expect(selectTurnModel(cfg({ lite: "flash-lite" }), withProject)).toBe("flash");
  });
});
