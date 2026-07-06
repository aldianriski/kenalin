import type { ChatGenerateRequest, ChatProvider, ProviderEvent } from "@kenalin/core";

/**
 * Deterministic chat provider for tests and offline demos. Returns a scripted
 * payload (or runs a supplied responder against the request), so the whole
 * orchestration + policy pipeline can be tested without a network or API key.
 */
export class FakeChatProvider implements ChatProvider {
  readonly name = "fake";
  constructor(private readonly responder: (req: ChatGenerateRequest) => unknown) {}

  async *generate(req: ChatGenerateRequest): AsyncIterable<ProviderEvent> {
    const payload = this.responder(req);
    yield { type: "final", payload: typeof payload === "string" ? payload : JSON.stringify(payload) };
  }
}
