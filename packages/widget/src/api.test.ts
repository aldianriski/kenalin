import { describe, it, expect, vi } from "vitest";
import { KenalinClient } from "./api.js";
import type { ChatResponse } from "./types.js";

function sseResponse(frames: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      for (const f of frames) controller.enqueue(enc.encode(f));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

describe("KenalinClient SSE parsing", () => {
  it("dispatches delta then payload across chunk boundaries", async () => {
    const payload: Partial<ChatResponse> = { answer: "hello world", intent: "explore", confidence: 0.9 };
    // Split frames awkwardly to exercise the buffer.
    const frames = [
      "event: delta\ndata: hello ",
      "\n\nevent: delta\ndata: world\n\n",
      `event: payload\ndata: ${JSON.stringify(payload)}\n\n`,
    ];
    vi.stubGlobal("fetch", vi.fn(async () => sseResponse(frames)));

    const deltas: string[] = [];
    let final: ChatResponse | null = null;
    await new KenalinClient("http://x").chat(
      { sessionId: "s", messages: [{ role: "user", content: "hi" }], state: {} as never },
      { onDelta: (d) => deltas.push(d), onPayload: (r) => (final = r), onError: () => {} },
    );
    expect(deltas.join("")).toContain("hello");
    expect(deltas.join("")).toContain("world");
    expect(final).not.toBeNull();
    expect((final as unknown as ChatResponse).answer).toBe("hello world");
    vi.unstubAllGlobals();
  });

  it("surfaces an in-stream error code", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => sseResponse(["event: error\ndata: upstream_error\n\n"])));
    let code = "";
    await new KenalinClient("http://x").chat(
      { sessionId: "s", messages: [{ role: "user", content: "hi" }], state: {} as never },
      { onDelta: () => {}, onPayload: () => {}, onError: (e) => (code = e.code) },
    );
    expect(code).toBe("upstream_error");
    vi.unstubAllGlobals();
  });

  it("surfaces the server's error code + status on a non-2xx response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "rate_limited" }), { status: 429 })),
    );
    let received: { code: string; status?: number } | null = null;
    await new KenalinClient("http://x").chat(
      { sessionId: "s", messages: [{ role: "user", content: "hi" }], state: {} as never },
      { onDelta: () => {}, onPayload: () => {}, onError: (e) => (received = e) },
    );
    expect(received).toEqual({ code: "rate_limited", status: 429 });
    vi.unstubAllGlobals();
  });

  it("maps a network failure to offline / upstream_error", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network down"); }));
    vi.stubGlobal("navigator", { onLine: false });
    let code = "";
    await new KenalinClient("http://x").chat(
      { sessionId: "s", messages: [{ role: "user", content: "hi" }], state: {} as never },
      { onDelta: () => {}, onPayload: () => {}, onError: (e) => (code = e.code) },
    );
    expect(code).toBe("offline");
    vi.unstubAllGlobals();
  });
});
