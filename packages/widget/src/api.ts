import type { ChatMessage, ChatResponse, ConversationState, PageContext, PublicConfig } from "./types.js";

/**
 * Thin client for the Kenalin API. The widget talks ONLY to these endpoints —
 * it never imports server or core logic at runtime (PRD D1 boundary).
 */

export interface ChatStreamHandlers {
  onDelta: (text: string) => void;
  onPayload: (response: ChatResponse) => void;
  onError: (message: string) => void;
}

export interface ChatArgs {
  sessionId: string;
  messages: ChatMessage[];
  state: ConversationState;
  pageContext?: PageContext;
  locale?: "id" | "en";
}

export class KenalinClient {
  constructor(private readonly apiUrl: string) {}

  async fetchConfig(configUrl?: string): Promise<PublicConfig> {
    const url = configUrl ?? `${this.apiUrl.replace(/\/$/, "")}/api/config/public`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`config fetch failed: ${res.status}`);
    return (await res.json()) as PublicConfig;
  }

  /** POST /api/chat and dispatch SSE events (delta text, then final payload). */
  async chat(args: ChatArgs, handlers: ChatStreamHandlers): Promise<void> {
    const url = `${this.apiUrl.replace(/\/$/, "")}/api/chat`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "text/event-stream" },
      body: JSON.stringify(args),
    });
    if (!res.ok || !res.body) {
      handlers.onError(`chat failed: ${res.status}`);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";
      for (const frame of frames) dispatchFrame(frame, handlers);
    }
    if (buffer.trim()) dispatchFrame(buffer, handlers);
  }
}

function dispatchFrame(frame: string, handlers: ChatStreamHandlers): void {
  let event = "message";
  const dataLines: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).replace(/^ /, ""));
  }
  const data = dataLines.join("\n");
  if (event === "delta") handlers.onDelta(data);
  else if (event === "payload") {
    try {
      handlers.onPayload(JSON.parse(data) as ChatResponse);
    } catch {
      handlers.onError("bad payload");
    }
  } else if (event === "error") handlers.onError(data);
}
