import {
  assembleResponse,
  buildFallbackResponse,
  buildSystemPrompt,
  parseModelOutput,
  selectTurnModel,
  GEMINI_MODEL_OUTPUT_SCHEMA,
  ChatRequestSchema,
  type Action,
  type ChatProvider,
  type ChatRequest,
  type ChatResponse,
  type EmbeddingProvider,
  type Evidence,
  type EvidenceCandidate,
  type ActionCandidate,
  type KenalinConfig,
  type KnowledgeSearchOptions,
  type ScoredChunk,
  type Language,
  type Intent,
  type ChatMessage,
  type TokenUsage,
  LIMITS,
} from "@kenalin/core";
import { estimateTokens, type TurnUsage } from "../usage.js";
import { responseCacheKey, type ResponseCache } from "../response-cache.js";

/** Retrieval store accepting the server's embedder-calibrated search options. */
export interface RetrievalStore {
  search(
    queryVector: number[],
    opts: KnowledgeSearchOptions & { intent?: Intent; threshold?: number },
  ): Promise<ScoredChunk[]>;
}

export interface OrchestratorDeps {
  config: KenalinConfig;
  store: RetrievalStore;
  embedder: EmbeddingProvider;
  chat: ChatProvider;
  /** Retrieval cosine floor override (embedder-calibrated). */
  retrievalThreshold?: number;
  /** Optional structured logger for quality/observability events (PRD D10). */
  log?: (event: Record<string, unknown>) => void;
  /** Per-turn token usage sink (counts only, no PII). */
  onUsage?: (turn: TurnUsage) => void;
  /** Response cache (TASK-024) — a hit skips the LLM call. Omitted → no caching. */
  responseCache?: ResponseCache;
}

export interface OrchestrationResult {
  response: ChatResponse;
  violations: string[];
  retrievedCount: number;
}

/** Trim the message window sent to the LLM: most-recent N, each char-capped. */
function trimForLlm(messages: ChatMessage[]): ChatMessage[] {
  return messages.slice(-LIMITS.llmMessageWindow).map((m) =>
    m.content.length > LIMITS.llmMessageCharCap
      ? { ...m, content: m.content.slice(0, LIMITS.llmMessageCharCap) + "…" }
      : m,
  );
}

/**
 * The single-pass orchestration runtime (PRD D1, D5). Stateless: everything is
 * derived from the request. Retrieval → prompt → one LLM call (structured
 * output) → one repair attempt → validate/assemble, or a safe fallback.
 */
export class Orchestrator {
  constructor(private readonly deps: OrchestratorDeps) {}

  async handle(rawRequest: ChatRequest): Promise<OrchestrationResult> {
    const request = ChatRequestSchema.parse(rawRequest);
    const { config } = this.deps;
    const state = request.state;
    const language: Language = request.locale ?? state.language ?? "id";
    const lastUser = [...request.messages].reverse().find((m) => m.role === "user");
    const query = lastUser?.content ?? "";

    // 1. Retrieve evidence for this turn (top-K, then cap what reaches the prompt).
    const [queryVector] = await this.deps.embedder.embed([query.slice(0, LIMITS.llmMessageCharCap) || " "]);
    const scored = (
      await this.deps.store.search(queryVector ?? [], {
        topK: LIMITS.retrievalTopK,
        filter: { visibility: "public", projectId: request.pageContext?.projectId },
        intent: state.intent as Intent,
        threshold: this.deps.retrievalThreshold,
      })
    ).slice(0, LIMITS.maxEvidenceInPrompt);

    const evidenceCandidates: EvidenceCandidate[] = [];
    const evidenceById = new Map<string, Evidence>();
    for (const s of scored) {
      const c = s.chunk;
      evidenceCandidates.push({ id: c.id, title: c.title, type: c.type, snippet: c.content });
      evidenceById.set(c.id, {
        id: c.id,
        title: c.title,
        url: c.url,
        type: c.type,
        snippet: c.content.slice(0, LIMITS.clientSnippetChars),
        tags: c.topics.slice(0, 3),
      });
    }

    // Response cache (TASK-024): a repeat that retrieved the SAME evidence can be
    // answered without the LLM call. Cache only "informational" turns — not active
    // screening (its answer depends on mutable per-session state).
    const cache = this.deps.responseCache;
    const cacheable =
      !!cache && query.trim().length > 0 && state.qualification.stage == null && !state.handoffOffered;
    const cacheKey = cacheable
      ? responseCacheKey(
          query,
          language,
          scored.map((s) => ({ id: s.chunk.id, content: s.chunk.content })),
        )
      : undefined;
    if (cache && cacheKey) {
      const hit = await cache.get(cacheKey);
      if (hit) {
        this.deps.log?.({ event: "response_cache_hit", sessionId: request.sessionId });
        return { response: hit, violations: [], retrievedCount: scored.length };
      }
    }

    // 2. Available actions from config (id-referenced by the model).
    const actionCandidates: ActionCandidate[] = config.actions.map((a) => ({
      id: a.id,
      label: a.label,
      type: a.type,
    }));
    const actionById = new Map<string, Action>(
      config.actions.map((a) => [a.id, { id: a.id, label: a.label, type: a.type, url: a.url }]),
    );

    // 3. Build the system prompt.
    const system = buildSystemPrompt(config, {
      language,
      state,
      pageContext: request.pageContext,
      evidence: evidenceCandidates,
      actions: actionCandidates,
    });

    // Accumulate token usage for this turn (embedding is estimated — the embed
    // API doesn't report counts; chat is authoritative from usageMetadata).
    const usage = { prompt: 0, completion: 0, embedding: estimateTokens(query || " "), total: 0, cached: 0 };
    const addUsage = (u?: TokenUsage) => {
      if (!u) return;
      usage.prompt += u.promptTokens;
      usage.completion += u.completionTokens;
      usage.total += u.totalTokens;
      usage.cached += u.cachedTokens ?? 0;
    };
    const emitUsage = () => {
      usage.total += usage.embedding;
      this.deps.onUsage?.({ sessionId: request.sessionId, ...usage });
    };

    // Whole-turn model choice + thinking budget (TASK-005). One call, one model —
    // ADR-001 preserved (selectTurnModel is a per-turn choice, not a per-concern split).
    const chatModel = selectTurnModel(config, request);
    const thinkingBudget = config.server.model.thinkingBudget;

    // 4. One structured LLM call, then one repair attempt if it doesn't parse.
    const first = await this.callProvider(system, request, chatModel, thinkingBudget);
    addUsage(first.usage);
    let model = parseModelOutput(first.payload);
    if (!model && !first.errored) {
      this.deps.log?.({ event: "structured_output_repair", sessionId: request.sessionId });
      const repairSystem =
        system +
        "\n\nIMPORTANT: your previous reply did not match the required JSON schema. " +
        "Reply again with ONLY the JSON object, no prose, no code fences.";
      const second = await this.callProvider(repairSystem, request, chatModel, thinkingBudget);
      addUsage(second.usage);
      model = parseModelOutput(second.payload);
    }

    // 5. Fallback if still unusable.
    if (!model) {
      this.deps.log?.({ event: "fallback_shown", sessionId: request.sessionId, reason: "unparseable" });
      emitUsage();
      return {
        response: buildFallbackResponse(config, { language, state }),
        violations: ["fallback"],
        retrievedCount: scored.length,
      };
    }

    // 6. Validate + assemble the safe response.
    const { response, violations } = assembleResponse(model, {
      config,
      language,
      state,
      evidenceById,
      actionById,
    });
    if (violations.length) {
      this.deps.log?.({ event: "policy_corrections", sessionId: request.sessionId, violations });
    }
    // Store the validated response for future identical-evidence repeats (best-effort;
    // never blocks the reply). Fallbacks return earlier, so only clean responses cache.
    if (cache && cacheKey) {
      void Promise.resolve(cache.set(cacheKey, response)).catch((err) =>
        this.deps.log?.({ event: "response_cache_set_error", error: String(err) }),
      );
    }
    emitUsage();
    return { response, violations, retrievedCount: scored.length };
  }

  private async callProvider(
    system: string,
    request: ChatRequest,
    model?: string,
    thinkingBudget?: number,
  ): Promise<{ payload: unknown; errored: boolean; usage?: TokenUsage }> {
    let payload: unknown = null;
    let errored = false;
    let usage: TokenUsage | undefined;
    try {
      for await (const ev of this.deps.chat.generate({
        system,
        messages: trimForLlm(request.messages),
        responseSchema: GEMINI_MODEL_OUTPUT_SCHEMA,
        maxTokens: LIMITS.maxOutputTokens,
        model,
        thinkingBudget,
      })) {
        if (ev.type === "final") {
          payload = ev.payload;
          usage = ev.usage;
        } else if (ev.type === "error") {
          errored = true;
          this.deps.log?.({ event: "provider_error", error: ev.error });
        }
      }
    } catch (err) {
      errored = true;
      this.deps.log?.({ event: "provider_exception", error: String(err) });
    }
    return { payload, errored, usage };
  }
}
