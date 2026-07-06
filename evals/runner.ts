import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import {
  ConversationStateSchema,
  type Action,
  type ChatRequest,
  type ChatResponse,
  type KenalinConfig,
} from "@kenalin/core";
import {
  loadDotEnv,
  loadConfigFile,
  selectEmbedder,
  buildAppDeps,
  Orchestrator,
} from "@kenalin/server";
import { SCENARIOS } from "./scenarios.js";
import { PASS_BARS, type EvalGroup, type Scenario } from "./types.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");

interface Result {
  id: string;
  group: EvalGroup;
  ok: boolean;
  reasons: string[];
}

function evaluate(scenario: Scenario, config: KenalinConfig, res: ChatResponse, inQuestions: number): string[] {
  const a = scenario.assert;
  const reasons: string[] = [];
  const answer = res.answer ?? "";

  if (a.intent) {
    const want = Array.isArray(a.intent) ? a.intent : [a.intent];
    if (!want.includes(res.intent)) reasons.push(`intent ${res.intent} not in [${want.join(",")}]`);
  }
  if (a.evidenceCount !== undefined && res.evidence.length !== a.evidenceCount) {
    reasons.push(`evidenceCount ${res.evidence.length} != ${a.evidenceCount}`);
  }
  if (a.evidenceNonEmpty && res.evidence.length === 0) reasons.push("expected evidence, got none");
  if (a.forbidRegex && new RegExp(a.forbidRegex, "i").test(answer)) {
    reasons.push(`forbidden pattern present: /${a.forbidRegex}/`);
  }
  if (a.mustIncludeAny && !a.mustIncludeAny.some((s) => answer.toLowerCase().includes(s.toLowerCase()))) {
    reasons.push(`none of [${a.mustIncludeAny.join(" | ")}] present`);
  }
  if (a.maxNewQuestions !== undefined) {
    const outQ = res.stateUpdates.qualification?.questionCount ?? inQuestions;
    if (outQ - inQuestions > a.maxNewQuestions) reasons.push(`asked ${outQ - inQuestions} > ${a.maxNewQuestions} new questions`);
  }
  if (a.handoffOffered !== undefined) {
    const offered = Boolean(res.handoff) || Boolean(res.stateUpdates.handoffOffered);
    if (offered !== a.handoffOffered) reasons.push(`handoffOffered ${offered} != ${a.handoffOffered}`);
  }
  if (a.actionsSubsetOfConfig) {
    const allowed = new Set(config.actions.map((x: Action) => x.id).concat("handoff"));
    const bad = res.suggestedActions.filter((x) => !allowed.has(x.id));
    if (bad.length) reasons.push(`actions not in config: ${bad.map((x) => x.id).join(",")}`);
  }
  return reasons;
}

async function main(): Promise<void> {
  loadDotEnv([".env", join(repoRoot, ".env")]);
  if (selectEmbedder().name !== "gemini") {
    console.error("✗ evals need Gemini embeddings. Set an API key and re-ingest with --embedder gemini.");
    process.exit(1);
  }
  const { config } = await loadConfigFile(join(repoRoot, "content", "demo", "kenalin.config.ts"));
  const deps = await buildAppDeps(config, {
    rootDir: repoRoot,
    indexDir: join(repoRoot, "content", "index"),
  });
  // Accumulate token usage across the run so we can report cost/turn (TASK-005).
  const usageTotals = { turns: 0, prompt: 0, completion: 0, embedding: 0, total: 0, cached: 0 };
  const orchestrator = new Orchestrator({
    ...deps,
    onUsage: (t) => {
      usageTotals.turns += 1;
      usageTotals.prompt += t.prompt;
      usageTotals.completion += t.completion;
      usageTotals.embedding += t.embedding;
      usageTotals.total += t.total;
      usageTotals.cached += t.cached ?? 0;
    },
  });

  const results: Result[] = [];
  for (const s of SCENARIOS) {
    const state = ConversationStateSchema.parse(s.state ?? {});
    const req: ChatRequest = {
      sessionId: `eval-${s.id}`,
      messages: s.messages,
      state,
      pageContext: s.pageContext,
      locale: s.locale,
    };
    try {
      const { response } = await orchestrator.handle(req);
      if (process.env.EVAL_DEBUG) {
        console.error(`  [${s.id}] intent=${response.intent} conf=${response.confidence} ev=${response.evidence.length} ho=${response.stateUpdates.handoffOffered} :: ${response.answer.slice(0, 70)}`);
      }
      const reasons = evaluate(s, config, response, state.qualification.questionCount);
      results.push({ id: s.id, group: s.group, ok: reasons.length === 0, reasons });
    } catch (err) {
      results.push({ id: s.id, group: s.group, ok: false, reasons: [`threw: ${String(err)}`] });
    }
    process.stdout.write(results[results.length - 1]!.ok ? "." : "x");
  }
  process.stdout.write("\n\n");

  const groups = [...new Set(SCENARIOS.map((s) => s.group))] as EvalGroup[];
  let allBarsMet = true;
  for (const g of groups) {
    const gr = results.filter((r) => r.group === g);
    const passed = gr.filter((r) => r.ok).length;
    const rate = passed / gr.length;
    const bar = PASS_BARS[g];
    const met = rate >= bar;
    allBarsMet &&= met;
    console.log(`${met ? "✓" : "✗"} ${g.padEnd(13)} ${passed}/${gr.length} (${(rate * 100).toFixed(0)}%) — bar ${(bar * 100).toFixed(0)}%`);
    for (const r of gr.filter((x) => !x.ok)) console.log(`    ✗ ${r.id}: ${r.reasons.join("; ")}`);
  }
  // Cost/turn summary (TASK-005). Thinking overhead is what's left after prompt,
  // completion, and the embedding estimate — the TD-007 lever.
  const n = usageTotals.turns || 1;
  const thinking = Math.max(
    0,
    usageTotals.total - usageTotals.prompt - usageTotals.completion - usageTotals.embedding,
  );
  const per = (x: number) => (x / n).toFixed(0);
  // Cost proxy in µUSD/turn using gemini-2.5-flash list price (input $0.30/M,
  // output $2.50/M incl. thinking, cached input $0.075/M). Output is ~8× input,
  // so trimming thinking (an output cost) moves the number more than its token
  // share suggests; cached prompt tokens are billed at the discounted input rate.
  const IN = 0.3 / 1e6, OUT = 2.5 / 1e6, CACHED_IN = 0.075 / 1e6;
  const uncachedPrompt = usageTotals.prompt - usageTotals.cached;
  const costUsd =
    uncachedPrompt * IN + usageTotals.cached * CACHED_IN + (usageTotals.completion + thinking) * OUT;
  const costPerTurnMicro = ((costUsd / n) * 1e6).toFixed(1);
  console.log(
    `\ntokens/turn: total ${per(usageTotals.total)} — prompt ${per(usageTotals.prompt)} · ` +
      `completion ${per(usageTotals.completion)} · thinking ${per(thinking)} · embed ${per(usageTotals.embedding)} ` +
      `· cached ${per(usageTotals.cached)} (${usageTotals.turns} turns)`,
  );
  console.log(`cost/turn: ~${costPerTurnMicro} µUSD (gemini-2.5-flash list price)`);

  console.log(allBarsMet ? "\n✓ eval matrix PASSED" : "\n✗ eval matrix FAILED");
  process.exit(allBarsMet ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
