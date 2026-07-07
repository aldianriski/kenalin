import { defineKenalinConfig } from "@kenalin/core";

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
  },
  server: {
    allowedOrigins: [],
    model: { thinkingBudget: 0 },
  },
});
