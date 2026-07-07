import type { Lang } from "./types.js";

/** UI strings (PRD B8 bilingual). Content answers come from the API; these are chrome. */
export const STRINGS: Record<Lang, Record<string, string>> = {
  id: {
    placeholder: "Ketik pesan…",
    send: "Kirim",
    close: "Tutup",
    minimize: "Kecilkan",
    home: "Beranda",
    idleNudge: "Masih di sana? Saya siap kapan pun Anda mau melanjutkan.",
    thinking: "Sedang menyiapkan jawaban…",
    error: "Sepertinya saya kehilangan koneksi. Coba lagi dalam sebentar.",
    retry: "Coba lagi",
    poweredBy: "Ditenagai Kenalin",
    openLabel: "Buka asisten",
    subtitle: "AI assistant",
    complexityEyebrow: "Klasifikasi awal",
    complexityDisclaimer: "Ini klasifikasi awal, bukan penawaran harga.",
  },
  en: {
    placeholder: "Type a message…",
    send: "Send",
    close: "Close",
    minimize: "Minimize",
    home: "Home",
    idleNudge: "Still there? I'm here whenever you'd like to continue.",
    thinking: "Preparing an answer…",
    error: "Looks like I lost the connection. Please try again in a moment.",
    retry: "Try again",
    poweredBy: "Powered by Kenalin",
    openLabel: "Open assistant",
    subtitle: "AI assistant",
    complexityEyebrow: "Initial complexity",
    complexityDisclaimer: "This is an initial classification, not a quotation.",
  },
};

/** Sub-copy for the quick-action cards, keyed by action id. */
export const QUICK_SUB: Record<string, Record<Lang, string>> = {
  see_projects: { id: "Lihat karya & case study terpilih.", en: "Selected work & case studies." },
  know_profile: { id: "Latar belakang & fokus utama.", en: "Background & main focus." },
  im_hiring: { id: "Cari tahu peran & cara bergabung.", en: "Roles & how to join." },
  business_need: { id: "Ceritakan kebutuhan Anda.", en: "Tell us what you need." },
};

/** Friendly, localized copy per server error code (never a raw message). */
export const ERROR_MESSAGES: Record<string, Record<Lang, string>> = {
  rate_limited: {
    id: "Wah, pesannya cepat sekali. Tunggu sebentar lalu coba lagi ya.",
    en: "That's a lot of messages quickly — wait a moment, then try again.",
  },
  payload_too_large: {
    id: "Pesannya terlalu panjang. Coba persingkat, ya.",
    en: "That message is too long — please shorten it.",
  },
  too_many_messages: {
    id: "Percakapan ini sudah panjang. Mari lanjutkan lewat kontak langsung.",
    en: "This chat has gotten long — let's continue via direct contact.",
  },
  conversation_too_long: {
    id: "Percakapan ini sudah panjang. Mari lanjutkan lewat kontak langsung.",
    en: "This chat has gotten long — let's continue via direct contact.",
  },
  usage_limit: {
    id: "Asisten sedang sibuk saat ini. Coba lagi nanti atau hubungi langsung.",
    en: "The assistant is busy right now — try again later or reach out directly.",
  },
  offline: {
    id: "Sepertinya Anda sedang offline. Cek koneksi lalu coba lagi.",
    en: "You appear to be offline — check your connection and try again.",
  },
};

/** Codes the visitor can meaningfully retry (vs. informational ones). */
const RETRYABLE = new Set(["rate_limited", "offline", "upstream_error", "bad_payload", "generic"]);

export function errorMessage(lang: Lang, code: string): string {
  return ERROR_MESSAGES[code]?.[lang] ?? t(lang, "error");
}
export function isRetryable(code: string): boolean {
  return RETRYABLE.has(code);
}

export function t(lang: Lang, key: string): string {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}

export function quickSub(lang: Lang, id: string): string {
  return QUICK_SUB[id]?.[lang] ?? "";
}

/** Pick the initial language from the host <html lang> or a config default. */
export function detectLang(fallback: Lang, langs: string[]): Lang {
  const htmlLang = typeof document !== "undefined" ? document.documentElement.lang.slice(0, 2) : "";
  if ((htmlLang === "id" || htmlLang === "en") && langs.includes(htmlLang)) return htmlLang;
  return fallback;
}
