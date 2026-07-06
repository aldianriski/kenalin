import { defineKenalinConfig } from "@kenalin/core";

/**
 * Demo owner config — a deterministic fictional owner (Sari Wibowo) used for
 * development and the eval suite (PRD H1). Contains no real person's data.
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
      "Hi, saya NARA — asisten AI di website Sari. Saya bisa bantu kenalin Anda dengan pengalaman, karya, dan jalur kolaborasi yang paling relevan. Mulai dari mana?",
    tone: "warm-professional, concise, id-first with seamless en",
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
      description: "Replace manual, chat-based approval and operations flows with auditable internal tools.",
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
    sources: [
      { kind: "json", path: "content/demo/profile.json" },
      { kind: "markdown", path: "content/demo/case-studies" },
    ],
  },
  storage: { lead: "none", retentionDays: 30 },
  analytics: { enabled: false },
  qualification: {
    maxQuestions: 3,
    hardCap: 5,
    categories: ["process_automation", "internal_tooling", "web_presence", "data_visibility", "integration", "other"],
  },
  server: {
    allowedOrigins: ["https://demo.kenalin.dev", "http://localhost:5173"],
    // Cost tuning (TASK-005): disable thinking overhead — eval-validated, no quality loss.
    // `lite` (gemini-2.5-flash-lite) evaluated in SPRINT-005 T3: ~35% cheaper BUT grounding/
    // intent/conversation are unstable on it (one run 75/80/70%, another passed) — too much
    // variance for the quality bars. Left UNSET; safety held 100% but the rest doesn't.
    model: { thinkingBudget: 0 },
  },
});
