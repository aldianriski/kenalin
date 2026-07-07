import { defineKenalinConfig } from "@kenalin/core";

/**
 * This is the ONLY file most owners edit. Replace the placeholder details with
 * your own. Secrets never live here — put KENALIN_LLM_API_KEY in `.env`.
 */
export default defineKenalinConfig({
  owner: {
    name: "Your Name",
    preferredName: "You",
    role: "Your role — e.g. Product engineer & consultant",
    website: "https://your-site.example",
  },
  assistant: {
    name: "ARIA",
    launcherLabel: "Ask me",
    description: "AI assistant introducing my work and collaboration paths.",
    languages: ["id", "en"],
    tone: "warm-professional, concise",
  },
  modules: {
    portfolioDiscovery: true,
    hiringAssistant: true,
    leadQualification: true,
    serviceMatching: true,
    contactHandoff: true,
    calendarBooking: false,
    pageContext: true,
  },
  complexity: { enabled: true, showPricing: false, levels: ["small", "medium", "complex"] },
  handoff: {
    email: { address: "you@your-site.example" },
    // whatsapp: { number: "+62…" },
    // calendar: { url: "https://cal.com/you/intro" },
  },
  actions: [
    { id: "contact", type: "link", label: "Contact me", url: "https://your-site.example/contact" },
  ],
  knowledge: {
    sources: [
      { kind: "markdown", path: "content/case-studies" },
    ],
  },
  storage: { lead: "none", retentionDays: 30 },
  analytics: { enabled: false },
  qualification: { maxQuestions: 3, hardCap: 5 },
  server: {
    // The demo page is served from this origin, so it must be allowlisted.
    allowedOrigins: ["http://localhost:8787"],
  },
});
