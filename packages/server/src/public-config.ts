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
  };
  owner: { name: string; preferredName?: string; role: string };
  modules: string[];
  quickActions: { id: string; label: { id: string; en: string }; seedIntent?: string }[];
  channels: string[];
}

export function toPublicConfig(config: KenalinConfig): PublicConfig {
  return {
    assistant: {
      name: config.assistant.name,
      launcherLabel: config.assistant.launcherLabel,
      description: config.assistant.description,
      languages: config.assistant.languages,
      openingMessage: config.assistant.openingMessage,
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
  };
}
