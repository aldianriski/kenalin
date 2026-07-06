import {
  assembleResponse,
  buildFallbackResponse,
  buildSystemPrompt,
  parseModelOutput,
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
  LIMITS,
} from "@kenalin/core";

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

    // 4. One structured LLM call, then one repair attempt if it doesn't parse.
    const first = await this.callProvider(system, request);
    let model = parseModelOutput(first.payload);
    if (!model && !first.errored) {
      this.deps.log?.({ event: "structured_output_repair", sessionId: request.sessionId });
      const repairSystem =
        system +
        "\n\nIMPORTANT: your previous reply did not match the required JSON schema. " +
        "Reply again with ONLY the JSON object, no prose, no code fences.";
      const second = await this.callProvider(repairSystem, request);
      model = parseModelOutput(second.payload);
    }

    // 5. Fallback if still unusable.
    if (!model) {
      this.deps.log?.({ event: "fallback_shown", sessionId: request.sessionId, reason: "unparseable" });
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
    return { response, violations, retrievedCount: scored.length };
  }

  private async callProvider(
    system: string,
    request: ChatRequest,
  ): Promise<{ payload: unknown; errored: boolean }> {
    let payload: unknown = null;
    let errored = false;
    try {
      for await (const ev of this.deps.chat.generate({
        system,
        messages: trimForLlm(request.messages),
        responseSchema: GEMINI_MODEL_OUTPUT_SCHEMA,
        maxTokens: LIMITS.maxOutputTokens,
      })) {
        if (ev.type === "final") payload = ev.payload;
        else if (ev.type === "error") {
          errored = true;
          this.deps.log?.({ event: "provider_error", error: ev.error });
        }
      }
    } catch (err) {
      errored = true;
      this.deps.log?.({ event: "provider_exception", error: String(err) });
    }
    return { payload, errored };
  }
}
