/**
 * Deterministic, GROUNDED responder for the self-referential Kenalin demo. Every
 * knowledge doc is about Kenalin, so any retrieved evidence is relevant. It reads
 * the evidence the retriever placed in the system prompt, answers from it, and
 * always offers tappable follow-up topics + the repo/docs actions — so the whole
 * conversation is button-driven and every button returns real information.
 */

interface EvidenceLine { id: string; type: string; title: string; snippet: string; }
interface ActionLine { id: string; type: string; label: string; }

/** The four topics, mirrored by the widget's quick actions. */
const TOPICS = [
  { key: "what", q: "What is Kenalin?", match: /what is|apa itu|about|overview|kenalin\?/ },
  { key: "cando", q: "What can it do?", match: /can it do|capabilit|feature|module|fitur|what can/ },
  { key: "embed", q: "How do I add it?", match: /add|embed|install|integrat|pasang|memasang|script|set ?up/ },
  { key: "oss", q: "Is it free & self-hosted?", match: /free|open.?source|self.?host|price|cost|gratis|licen/ },
];

const LEAD: Record<string, string> = {
  what: "In short —",
  cando: "Here's what Kenalin can do:",
  embed: "Adding it is quick:",
  oss: "Yes —",
  default: "Here's the short version:",
};

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

function clean(snippet: string, max = 360): string {
  let s = snippet.replace(/\s+/g, " ").trim();
  if (s.length > max) {
    s = s.slice(0, max);
    const cut = Math.max(s.lastIndexOf(". "), s.lastIndexOf("! "), s.lastIndexOf("? "));
    s = cut > 100 ? s.slice(0, cut + 1) : s.replace(/\s+\S*$/, "") + "…";
  }
  return s;
}

export function demoResponder(req: { system?: string; messages?: { role: string; content: string }[] }) {
  const system = req.system ?? "";
  const userMsg = [...(req.messages ?? [])].reverse().find((m) => m.role === "user")?.content ?? "";
  const q = userMsg.toLowerCase();

  const evidence = parseEvidence(system);
  const actions = parseActions(system);

  // Which topic was asked? (drives the lead + which follow-ups to offer.)
  const asked = TOPICS.find((t) => t.match.test(q));
  const askedKey = asked?.key ?? "default";

  // Always surface the repo/docs links, and offer the other topics as chips.
  const suggestedActionIds = actions.map((a) => a.id);
  const suggestedReplies = TOPICS.filter((t) => t.key !== askedKey).map((t) => t.q).slice(0, 3);

  if (evidence.length === 0) {
    return {
      answer:
        "I'm the Kenalin guide — I can explain what Kenalin is, what it can do, how to add it to your site, and how it's licensed. Pick a topic below.",
      intent: "explore",
      confidence: 0.6,
      evidenceIds: [],
      suggestedActionIds,
      qualification: null,
      askDimension: null,
      suggestedReplies,
      offerHandoff: false,
    };
  }

  // Retrieval is ranked; prefer the doc that matches the asked topic if present,
  // else the top hit. (All docs are about Kenalin, so any is on-topic.)
  const TITLE_HINT: Record<string, string> = {
    what: "what is",
    cando: "can kenalin",
    embed: "add kenalin",
    oss: "free",
  };
  const hint = asked ? TITLE_HINT[asked.key] : undefined;
  const top =
    (hint && evidence.find((e) => e.title.toLowerCase().includes(hint))) || evidence[0];

  const lead = LEAD[askedKey] ?? LEAD.default;
  return {
    answer: `${lead}\n\n${clean(top.snippet)}\n\nWant to know more? Tap a topic below, or open the repo.`,
    intent: "explore",
    confidence: 0.85,
    evidenceIds: [top.id],
    suggestedActionIds,
    qualification: null,
    askDimension: null,
    suggestedReplies,
    offerHandoff: false,
  };
}
