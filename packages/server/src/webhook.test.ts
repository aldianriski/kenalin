import { describe, it, expect, vi } from "vitest";
import { createHmac } from "node:crypto";
import { WebhookEmitter, signPayload } from "./webhook.js";
import type { WebhookEvent } from "@kenalin/core";

const event: WebhookEvent = {
  event: "handoff.completed",
  timestamp: "2026-07-06T00:00:00.000Z",
  sessionId: "s1",
  data: { brief: "hi", state: {} as never },
};

describe("signPayload", () => {
  it("matches a manual HMAC-SHA256 hex digest", () => {
    const body = JSON.stringify(event);
    const expected = createHmac("sha256", "secret").update(body).digest("hex");
    expect(signPayload(body, "secret")).toBe(expected);
  });
});

describe("WebhookEmitter", () => {
  it("posts a signed payload and returns true on 2xx", async () => {
    let seen: { url: string; headers: Record<string, string>; body: string } | null = null;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        seen = { url, headers: init.headers as Record<string, string>, body: init.body as string };
        return new Response("ok", { status: 200 });
      }),
    );
    const emitter = new WebhookEmitter({ url: "https://hook.example", secret: "s3cr3t" });
    const ok = await emitter.emit(event);
    expect(ok).toBe(true);
    expect(seen!.headers["x-kenalin-signature"]).toBe(signPayload(seen!.body, "s3cr3t"));
    vi.unstubAllGlobals();
  });

  it("retries then gives up on persistent failure", async () => {
    const fetchMock = vi.fn(async () => new Response("nope", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const emitter = new WebhookEmitter({ url: "https://hook.example" }, undefined, async () => {});
    const ok = await emitter.emit(event);
    expect(ok).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    vi.unstubAllGlobals();
  });

  it("omits the signature header when no secret is set", async () => {
    let headers: Record<string, string> = {};
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_u: string, init: RequestInit) => {
        headers = init.headers as Record<string, string>;
        return new Response("ok", { status: 200 });
      }),
    );
    await new WebhookEmitter({ url: "https://hook.example" }).emit(event);
    expect(headers["x-kenalin-signature"]).toBeUndefined();
    vi.unstubAllGlobals();
  });
});
