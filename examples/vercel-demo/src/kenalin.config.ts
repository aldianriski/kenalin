import { defineKenalinConfig } from "@kenalin/core";

/**
 * Demo config for the hosted playground (fictional owner Sari Wibowo). Runs
 * KEYLESS — no Gemini key: retrieval uses the hash embedder and answers come from
 * a deterministic grounded responder (see responder.ts). `allowedOrigins: []`
 * allows any origin so the same-origin demo page works on any Vercel URL.
 */
export default defineKenalinConfig({
  owner: {
    name: "Sari Wibowo",
    preferredName: "Sari",
    role: "Full-stack engineer & product consultant",
    website: "https://demo.kenalin.dev",
  },
  assistant: {
    name: "NARA",
    launcherLabel: "Ask about Sari",
    description: "AI assistant introducing Sari Wibowo's work and collaboration paths.",
    languages: ["id", "en"],
    openingMessage:
      "Hi — I'm NARA, the AI assistant on Sari's site. Ask me about her projects, background, or how to work together. Where would you like to start?",
    tone: "warm-professional, concise",
  },
  modules: {
    portfolioDiscovery: true,
    hiringAssistant: true,
    leadQualification: true,
    serviceMatching: true,
    contactHandoff: true,
    calendarBooking: true,
    pageContext: true,
  },
  services: [
    {
      id: "svc-process-automation",
      name: "Process automation",
      description: "Replace manual, chat-based approval flows with auditable internal tools.",
      evidenceIds: ["quickhub"],
    },
    {
      id: "svc-data-visibility",
      name: "Operational dashboards",
      description: "Turn scattered exports into real-time operational visibility.",
      evidenceIds: ["ledgerlens"],
    },
  ],
  complexity: { enabled: true, showPricing: false, levels: ["small", "medium", "complex"] },
  handoff: {
    whatsapp: { number: "+620000000000" },
    email: { address: "hello@demo.kenalin.dev" },
    calendar: { url: "https://cal.com/demo-sari/intro" },
  },
  actions: [
    { id: "contact", type: "link", label: "Contact Sari", url: "https://demo.kenalin.dev/contact" },
    { id: "whatsapp", type: "whatsapp", label: "Chat on WhatsApp" },
    { id: "book_call", type: "calendar", label: "Schedule a call" },
  ],
  knowledge: {
    // Unused at runtime — the demo loads a prebuilt hash index (bundled). Kept for parity.
    sources: [
      { kind: "json", path: "content/demo/profile.json" },
      { kind: "markdown", path: "content/demo/case-studies" },
    ],
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
    allowedOrigins: [], // demo: allow any origin (same-origin page on any Vercel URL)
    model: { thinkingBudget: 0 },
  },
});
