import { describe, it, expect, vi } from "vitest";
import { loadConfig, type KenalinConfig, type Lead } from "@kenalin/core";
import { selectLeadStore, NoneLeadStore, WebhookLeadStore } from "./index.js";

const lead: Lead = {
  id: "l1",
  createdAt: "2026-07-06T00:00:00.000Z",
  sessionId: "s1",
  intent: "business_opportunity",
  category: "process_automation",
  complexity: "medium",
  brief: "[brief]",
  source: { url: "https://demo.example" },
};

function cfg(over: Partial<Parameters<typeof loadConfig>[0]> = {}): KenalinConfig {
  return loadConfig({
    owner: { name: "Demo", role: "Engineer", website: "https://demo.example" },
    assistant: { name: "NARA" },
    handoff: { email: { address: "hi@demo.example" } },
    ...over,
  });
}

describe("selectLeadStore", () => {
  it("returns a no-op store for mode 'none'", async () => {
    const store = await selectLeadStore(cfg());
    expect(store).toBeInstanceOf(NoneLeadStore);
    await expect(store.save(lead)).resolves.toBeUndefined();
  });

  it("returns a webhook store for mode 'webhook' and emits lead.created", async () => {
    const fetchMock = vi.fn(async () => new Response("ok", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const store = await selectLeadStore(
      cfg({ storage: { lead: "webhook" }, handoff: { webhook: { url: "https://hook.example" } } }),
      { webhookSecret: "s" },
    );
    expect(store).toBeInstanceOf(WebhookLeadStore);
    await store.save(lead);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.event).toBe("lead.created");
    expect(body.data.id).toBe("l1");
    vi.unstubAllGlobals();
  });

  it("throws for mode 'webhook' with no webhook configured", async () => {
    await expect(selectLeadStore(cfg({ storage: { lead: "webhook" } }))).rejects.toThrow(/requires handoff.webhook/);
  });
});
