import { defineKenalinConfig } from "@kenalin/core";

/**
 * Generic demo config for the hosted playground. The owner ("Alex Rivera") and
 * every project are FICTIONAL — nothing here is anyone's real data. Runs KEYLESS:
 * hash-embedder retrieval + a deterministic grounded responder (responder.ts).
 * `allowedOrigins: []` allows the same-origin demo page on any Vercel URL.
 */
export default defineKenalinConfig({
  owner: {
    name: "Alex Rivera",
    preferredName: "Alex",
    role: "Product engineer & consultant",
    website: "https://alex.example",
  },
  assistant: {
    name: "ARIA",
    launcherLabel: "Ask about Alex",
    description: "AI assistant introducing Alex Rivera's work and collaboration paths.",
    languages: ["en", "id"],
    openingMessage:
      "Hi — I'm ARIA, a demo AI assistant. Ask me about Alex's projects, background, or how to work together. Where should we start?",
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
      id: "svc-build",
      name: "Short build engagements",
      description: "Ship a prototype or a focused product feature end to end.",
      evidenceIds: ["taskflow"],
    },
    {
      id: "svc-consulting",
      name: "Product consulting",
      description: "Shape scope, architecture, and roadmap with a small team.",
      evidenceIds: ["metricboard"],
    },
  ],
  complexity: { enabled: true, showPricing: false, levels: ["small", "medium", "complex"] },
  handoff: {
    email: { address: "hello@alex.example" },
    calendar: { url: "https://cal.com/alex-demo/intro" },
  },
  actions: [
    { id: "contact", type: "link", label: "Contact Alex", url: "https://alex.example/contact" },
    { id: "book_call", type: "calendar", label: "Schedule a call" },
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
