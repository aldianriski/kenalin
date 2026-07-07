import { defineKenalinConfig } from "@kenalin/core";

/**
 * A quick-action icon as a mask-friendly data-URI SVG (stroke shapes; the widget masks it
 * and tints with the theme accent). Same 4 glyphs as the landing "Try it now" chips, so the
 * widget cards and the page read as one set (SPRINT-010 T3 · D1: icons via config, not core).
 */
const qicon = (paths: string): string =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`,
  );

/**
 * Self-referential demo: the "owner" is Kenalin itself, so the assistant
 * introduces the product. Knowledge = docs about Kenalin; the responder answers
 * from them. Runs KEYLESS (hash retrieval + deterministic responder).
 */
export default defineKenalinConfig({
  owner: {
    name: "Kenalin",
    preferredName: "Kenalin",
    role: "Open-source, embeddable AI introduction layer for websites",
    website: "https://github.com/aldianriski/kenalin",
  },
  assistant: {
    name: "Kai",
    launcherLabel: "Ask about Kenalin",
    description: "The Kenalin guide — ask what Kenalin is, what it does, and how to add it.",
    languages: ["en", "id"],
    openingMessage:
      "Hi! I'm Kai, the Kenalin guide. Ask me what Kenalin is, what it can do, or how to add it to your site — tap a suggestion below to start.",
    tone: "friendly, concise, helpful",
  },
  modules: {
    portfolioDiscovery: true,
    hiringAssistant: false,
    leadQualification: false,
    serviceMatching: true,
    contactHandoff: true,
    calendarBooking: false,
    pageContext: true,
  },
  complexity: { enabled: false, showPricing: false, levels: ["small", "medium", "complex"] },
  handoff: {
    email: { address: "hello@kenalin.dev" },
  },
  actions: [
    { id: "repo", type: "link", label: "View on GitHub", url: "https://github.com/aldianriski/kenalin" },
    { id: "docs", type: "link", label: "Read the docs", url: "https://github.com/aldianriski/kenalin#readme" },
  ],
  knowledge: {
    sources: [{ kind: "markdown", path: "content" }],
  },
  storage: { lead: "none", retentionDays: 30 },
  analytics: { enabled: false },
  qualification: { maxQuestions: 3, hardCap: 5 },
  branding: {
    theme: {
      navy: "#0F2742",
      accent: "#22B8A7",
      accentSoft: "#8DE2D4",
      amber: "#D99A2B",
    },
    marks: { launcher: "chat", header: "robot" },
    // Distinct quick-action glyphs (match the landing chips) — help · lightning · code · heart.
    icons: {
      "quick:what": qicon(
        `<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3"/><path d="M12 17h.01"/>`,
      ),
      "quick:cando": qicon(`<path d="M13 2 3 14h7l-1 8 10-12h-7z"/>`),
      "quick:embed": qicon(`<path d="m8 6-6 6 6 6"/><path d="m16 6 6 6-6 6"/>`),
      "quick:oss": qicon(
        `<path d="M12 20.3 4.2 12.5a4.6 4.6 0 0 1 6.5-6.5l1.3 1.3 1.3-1.3a4.6 4.6 0 0 1 6.5 6.5Z"/>`,
      ),
    },
  },
  server: {
    allowedOrigins: [],
    model: { thinkingBudget: 0 },
  },
});
