import type { Lang } from "./types.js";

/** UI strings (PRD B8 bilingual). Content answers come from the API; these are chrome. */
export const STRINGS: Record<Lang, Record<string, string>> = {
  id: {
    placeholder: "Tulis pertanyaan Anda…",
    send: "Kirim",
    close: "Tutup",
    evidence: "Bukti",
    thinking: "Sedang menyiapkan jawaban…",
    error: "Maaf, ada kendala. Coba lagi ya.",
    poweredBy: "Ditenagai Kenalin",
    openLabel: "Buka asisten",
  },
  en: {
    placeholder: "Type your question…",
    send: "Send",
    close: "Close",
    evidence: "Evidence",
    thinking: "Preparing an answer…",
    error: "Sorry, something went wrong. Please try again.",
    poweredBy: "Powered by Kenalin",
    openLabel: "Open assistant",
  },
};

export function t(lang: Lang, key: string): string {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key;
}

/** Pick the initial language from the host <html lang> or a config default. */
export function detectLang(fallback: Lang, langs: string[]): Lang {
  const htmlLang = typeof document !== "undefined" ? document.documentElement.lang.slice(0, 2) : "";
  if (htmlLang === "id" || htmlLang === "en") {
    if (langs.includes(htmlLang)) return htmlLang;
  }
  return fallback;
}
