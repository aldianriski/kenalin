/**
 * Deterministic, GROUNDED responder for the keyless demo. It runs inside the real
 * orchestration + policy pipeline (retrieval, evidence-id validation, currency
 * block) via FakeChatProvider — only the "model" is replaced. It reads the
 * evidence the retriever put in the system prompt and answers from it, so the demo
 * shows real evidence cards and handoff without any LLM key.
 *
 * NOTE: this is intentionally simple (template + retrieved snippet), not an LLM.
 * A real deployment swaps in the Gemini provider for genuine conversation.
 */

interface EvidenceLine {
  id: string;
  type: string;
  title: string;
  snippet: string;
}
interface ActionLine {
  id: string;
  type: string;
  label: string;
}

type Intent =
  | "explore"
  | "hiring"
  | "business_opportunity"
  | "existing_network"
  | "partnership"
  | "general"
  | "unknown";

function parseEvidence(system: string): EvidenceLine[] {
  const out: EvidenceLine[] = [];
  for (const line of system.split("\n")) {
    const m = line.match(/^- id=(\S+) \[(\w+)\] ([^:]+): (.*)$/);
    if (m) out.push({ id: m[1], type: m[2], title: m[3].trim(), snippet: m[4].trim() });
  }
  return out;
}

function parseActions(system: string): ActionLine[] {
  const out: ActionLine[] = [];
  for (const line of system.split("\n")) {
    const m = line.match(/^- id=(\S+) \((\w+)\): (.*)$/);
    if (m) out.push({ id: m[1], type: m[2], label: m[3].trim() });
  }
  return out;
}

function detectIntent(q: string): Intent {
  if (/\b(hir|hiring|role|lead|team|stack|work history|recruit|join|senior|candidate|fit)\b/.test(q))
    return "hiring";
  if (/\b(partner|partnership|collaborat|agency|co-?deliver)\b/.test(q)) return "partnership";
  if (
    /\b(need|build|help|automate|automation|approval|manual|spreadsheet|reconcil|dashboard|internal tool|ops|operations|workflow|integrat|business|company|problem|process)\b/.test(
      q,
    )
  )
    return "business_opportunity";
  if (/\b(hi|hello|hey|nice to meet|know (her|sari))\b/.test(q)) return "existing_network";
  if (q.trim().length === 0) return "general";
  return "explore";
}

/** Trim a snippet to a clean, whole-sentence-ish fragment. */
function clean(snippet: string, max = 320): string {
  let s = snippet.replace(/\s+/g, " ").trim();
  if (s.length > max) {
    s = s.slice(0, max);
    const cut = Math.max(s.lastIndexOf(". "), s.lastIndexOf("! "), s.lastIndexOf("? "));
    s = cut > 80 ? s.slice(0, cut + 1) : s.replace(/\s+\S*$/, "") + "…";
  }
  return s;
}

const CTA: Record<string, string> = {
  hiring: "Want me to pass your details along, or would a quick intro call help?",
  business_opportunity: "If you'd like, I can connect you with Alex to talk specifics.",
  partnership: "Happy to route this to Alex to explore a collaboration.",
  explore: "Want to go deeper on this, or see another project?",
  existing_network: "Would you like me to let Alex know you stopped by?",
  general: "You can ask about a specific project, Alex's background, or how to work together.",
  unknown: "You can ask about a specific project, Alex's background, or how to work together.",
};

const HANDOFF_INTENTS = new Set(["hiring", "business_opportunity", "partnership"]);

export function demoResponder(req: { system?: string; messages?: { role: string; content: string }[] }) {
  const system = req.system ?? "";
  const userMsg =
    [...(req.messages ?? [])].reverse().find((m) => m.role === "user")?.content ?? "";
  const q = userMsg.toLowerCase();

  const evidence = parseEvidence(system);
  const actions = parseActions(system);
  const intent = detectIntent(q);

  // Actions to surface, by intent.
  const actionIds = actions
    .filter((a) => {
      if (HANDOFF_INTENTS.has(intent)) return true; // show all contact routes
      return a.type === "link"; // exploring → just the portfolio/contact link
    })
    .map((a) => a.id);

  const offerHandoff = HANDOFF_INTENTS.has(intent) && actions.length > 0;

  if (evidence.length === 0) {
    // No supporting evidence retrieved — friendly, honest fallback (no invented facts).
    return {
      answer:
        "I can only speak to what's in Alex's public profile — projects, background, and how Alex likes to work. " +
        CTA[intent],
      intent,
      confidence: 0.5,
      evidenceIds: [],
      suggestedActionIds: actionIds,
      qualification: null,
      askDimension: null,
      suggestedReplies: [],
      offerHandoff,
    };
  }

  const top = evidence.slice(0, intent === "explore" ? 1 : 2);
  const lead =
    intent === "hiring"
      ? "Here's the most relevant part of Alex's background:"
      : intent === "business_opportunity"
        ? "This looks close to work Alex has done before:"
        : intent === "partnership"
          ? "Here's a relevant example of Alex's delivery:"
          : "Here's what I found:";

  const body = top
    .map((e) => `**${e.title}** — ${clean(e.snippet)}`)
    .join("\n\n");

  return {
    answer: `${lead}\n\n${body}\n\n${CTA[intent]}`,
    intent,
    confidence: 0.82,
    evidenceIds: top.map((e) => e.id),
    suggestedActionIds: actionIds,
    qualification: null,
    askDimension: null,
    suggestedReplies: [],
    offerHandoff,
  };
}
