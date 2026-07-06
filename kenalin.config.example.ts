import { defineKenalinConfig } from "@kenalin/core";

/**
 * Copy to `kenalin.config.ts` and edit. This is the ONLY file most owners touch
 * (PRD FR-1). Secrets never live here — put KENALIN_LLM_API_KEY and
 * KENALIN_WEBHOOK_SECRET in `.env`.
 */
export default defineKenalinConfig({
  owner: {
    name: "Your Name",
    preferredName: "You",
    role: "Your role — e.g. Product engineer & consultant",
    website: "https://your-site.example",
  },
  assistant: {
    name: "ARIA", // your assistant's persona name
    launcherLabel: "Ask me",
    description: "AI assistant introducing my work and collaboration paths.",
    languages: ["id", "en"],
    // openingMessage: "…",   // optional — contextual, never 'How can I assist you today?'
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
    // { id: "svc-1", name: "…", description: "…", evidenceIds: ["project-id"] },
  ],
  complexity: { enabled: true, showPricing: false, levels: ["small", "medium", "complex"] },
  handoff: {
    // whatsapp: { number: "+62…" },
    email: { address: "you@your-site.example" },
    // calendar: { url: "https://cal.com/you/intro" },
    // webhook: { url: "https://your-endpoint.example/kenalin" }, // secret via env
  },
  actions: [
    { id: "contact", type: "link", label: "Contact me", url: "https://your-site.example/contact" },
  ],
  knowledge: {
    sources: [
      // { kind: "sitemap", path: "https://your-site.example/sitemap.xml" },
      // { kind: "json", path: "content/profile.json" },
      // { kind: "markdown", path: "content/case-studies" },
      // { kind: "pdf", path: "content/cv.pdf" },
    ],
  },
  storage: { lead: "none", retentionDays: 30 },
  analytics: { enabled: false },
  qualification: { maxQuestions: 3, hardCap: 5 },
  server: {
    allowedOrigins: ["https://your-site.example"],
  },
});
