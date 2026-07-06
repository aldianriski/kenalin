import type { Lang } from "./types.js";

/** UI strings (PRD B8 bilingual). Content answers come from the API; these are chrome. */
export const STRINGS: Record<Lang, Record<string, string>> = {
  id: {
    placeholder: "Ketik pesan…",
    send: "Kirim",
    close: "Tutup",
    minimize: "Kecilkan",
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
