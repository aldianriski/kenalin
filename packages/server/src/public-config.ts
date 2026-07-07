import { availableChannels, quickActions, enabledModules, type KenalinConfig } from "@kenalin/core";

/**
 * The widget bootstrap payload (PRD D6 `/api/config/public`). Contains only what
 * the client needs to render — NEVER keys, webhook URLs, prompts, or secrets.
 */
export interface PublicConfig {
  assistant: {
    name: string;
    launcherLabel: string;
    description?: string;
    languages: string[];
    openingMessage?: string;
    /** Idle nudge/auto-minimize thresholds (TASK-012). */
    idle?: { nudgeSeconds: number; closeSeconds: number };
  };
  owner: { name: string; preferredName?: string; role: string };
  modules: string[];
  quickActions: { id: string; label: { id: string; en: string }; seedIntent?: string }[];
  channels: string[];
  /** Owner branding (TASK-004): imagery + theme tokens. Public-safe (URLs + colors). */
  branding?: {
    logoUrl?: string;
    avatarUrl?: string;
    theme?: Record<string, string>;
    /** Widget placement + stacking (TASK-034). */
    position?: {
      corner: "bottom-right" | "bottom-left";
      offsetX: string;
      offsetY: string;
      offsetYMobile?: string;
      zIndex: number;
      mobile: "fullscreen" | "docked";
    };
    /** Per-icon URL overrides (TASK-035). */
    icons?: Record<string, string>;
    /** Built-in mark selection for launcher/header (logo|chat|robot). */
    marks?: { launcher?: "logo" | "chat" | "robot"; header?: "logo" | "chat" | "robot" };
  };
}

export function toPublicConfig(config: KenalinConfig): PublicConfig {
  return {
    assistant: {
      name: config.assistant.name,
      launcherLabel: config.assistant.launcherLabel,
      description: config.assistant.description,
      languages: config.assistant.languages,
      openingMessage: config.assistant.openingMessage,
      idle: config.assistant.idle,
    },
    owner: {
      name: config.owner.name,
      preferredName: config.owner.preferredName,
      role: config.owner.role,
    },
    modules: enabledModules(config).map((m) => m.key),
    quickActions: quickActions(config).map((q) => ({
      id: q.id,
      label: q.label,
      seedIntent: q.seedIntent,
    })),
    channels: availableChannels(config),
    // Branding is already public-safe (image URLs + theme colors, no secrets).
    ...(config.branding
      ? {
          branding: {
            logoUrl: config.branding.logoUrl,
            avatarUrl: config.branding.avatarUrl,
            theme: config.branding.theme as Record<string, string> | undefined,
            position: config.branding.position,
            icons: config.branding.icons,
            marks: config.branding.marks,
          },
        }
      : {}),
  };
}
