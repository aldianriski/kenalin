import type { KenalinConfig } from "../config/schema.js";
import type { Handoff } from "../schemas/conversation.js";
import type { HandoffChannel } from "../schemas/primitives.js";

/**
 * Resolve a user-facing handoff channel + deep link from config (PRD C5).
 * Channel priority: WhatsApp → email → calendar. The webhook channel is
 * server-to-server and never surfaced as a visitor URL. Returns null when no
 * user-facing channel is configured.
 */
export function resolveHandoff(config: KenalinConfig, brief: string): Handoff | null {
  const h = config.handoff;
  if (h.whatsapp) {
    const number = h.whatsapp.number.replace(/[^\d]/g, "");
    return { channel: "whatsapp", brief, url: `https://wa.me/${number}?text=${encodeURIComponent(brief)}` };
  }
  if (h.email) {
    const subject = encodeURIComponent("Intro via " + config.assistant.name);
    return {
      channel: "email",
      brief,
      url: `mailto:${h.email.address}?subject=${subject}&body=${encodeURIComponent(brief)}`,
    };
  }
  if (h.calendar) {
    return { channel: "calendar", brief, url: h.calendar.url };
  }
  return null;
}

/** Channels a config exposes to visitors (for the config/public endpoint). */
export function availableChannels(config: KenalinConfig): HandoffChannel[] {
  const h = config.handoff;
  const channels: HandoffChannel[] = [];
  if (h.whatsapp) channels.push("whatsapp");
  if (h.email) channels.push("email");
  if (h.calendar) channels.push("calendar");
  if (h.webhook) channels.push("webhook");
  return channels;
}
