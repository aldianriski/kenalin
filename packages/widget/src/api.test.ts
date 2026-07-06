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

  it("surfaces error frames", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => sseResponse(["event: error\ndata: boom\n\n"])));
    let err = "";
    await new KenalinClient("http://x").chat(
      { sessionId: "s", messages: [{ role: "user", content: "hi" }], state: {} as never },
      { onDelta: () => {}, onPayload: () => {}, onError: (m) => (err = m) },
    );
    expect(err).toBe("boom");
    vi.unstubAllGlobals();
  });
});
