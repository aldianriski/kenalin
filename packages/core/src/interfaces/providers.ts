import type { ChatMessage } from "../schemas/conversation.js";

/**
 * Provider interfaces (PRD D3). `core` depends only on these; `server` ships the
 * concrete Gemini implementations. The chat and embedding interfaces are kept
 * separate on purpose — the best chat vendor is often not the best/cheapest
 * embedding vendor.
 */

/** A JSON Schema object describing the structured output the model must emit. */
export type JsonSchema = Record<string, unknown>;

/** Authoritative token counts reported by the provider for one call. */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** Prompt tokens served from the provider's context cache (billed cheaper);
   *  0/undefined when caching didn't apply. Observability only (TASK-005). */
  cachedTokens?: number;
}

/** Streaming events emitted by a ChatProvider.generate() call. */
export type ProviderEvent =
  | { type: "text"; delta: string }
  | { type: "final"; payload: unknown; usage?: TokenUsage }
  | { type: "error"; error: string };

export interface ChatGenerateRequest {
  system: string;
  messages: ChatMessage[];
  /** Structured output enforced by the provider. */
  responseSchema: JsonSchema;
  maxTokens?: number;
  /** Override the model for this call (whole-turn lite swap); provider default if unset. */
  model?: string;
  /** Thinking-token budget for this call: undefined = provider default; 0 = disabled. */
  thinkingBudget?: number;
}

export interface ChatProvider {
  readonly name: string;
  /** Yields text deltas, then a single final structured payload. */
  generate(req: ChatGenerateRequest): AsyncIterable<ProviderEvent>;
}

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimensions: number;
  embed(texts: string[]): Promise<number[][]>;
}
