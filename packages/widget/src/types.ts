import type {
  ChatResponse,
  ChatMessage,
  ConversationState,
  Action,
  Evidence,
  PageContext,
} from "@kenalin/core";

/** Type-only re-exports (erased at build — zero bytes in the bundle). */
export type { ChatResponse, ChatMessage, ConversationState, Action, Evidence, PageContext };

/** The public bootstrap payload from GET /api/config/public. */
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
  branding?: {
    logoUrl?: string;
    avatarUrl?: string;
    theme?: Record<string, string>;
    position?: {
      corner: "bottom-right" | "bottom-left";
      offsetX: string;
      offsetY: string;
      zIndex: number;
      mobile: "fullscreen" | "docked";
    };
    icons?: Record<string, string>;
  };
}

export type Lang = "id" | "en";

/** A rendered chat turn in the widget UI. */
export interface UiMessage {
  role: "user" | "assistant";
  content: string;
  evidence?: Evidence[];
  actions?: Action[];
  pending?: boolean;
}
