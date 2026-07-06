import type { ChatProvider } from "@kenalin/core";
import { GeminiChatProvider } from "./gemini.js";
import { resolveLlmApiKey } from "../env.js";

export { GeminiChatProvider } from "./gemini.js";
export { FakeChatProvider } from "./fake.js";

/** Select the chat provider. Chat requires a real model — there is no offline fallback. */
export function selectChatProvider(opts: { apiKey?: string } = {}): ChatProvider {
  const apiKey = opts.apiKey ?? resolveLlmApiKey();
  if (!apiKey) {
    throw new Error(
      "No LLM API key found. Set KENALIN_LLM_API_KEY (or GEMINI_API_KEY / API_KEY) to run the chat API.",
    );
  }
  return new GeminiChatProvider({ apiKey });
}
