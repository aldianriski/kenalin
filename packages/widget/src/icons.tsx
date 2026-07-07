import type { JSX } from "preact";
import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { iconOverride } from "./branding.js";

/**
 * Kenalin icon set — the K-mark logo + a line-icon family (1.6px stroke,
 * currentColor) matching the design system. Inlined SVG so the widget has zero
 * asset requests inside the Shadow DOM.
 *
 * Icons are overridable per deployment (TASK-035): `branding.icons` maps an icon
 * NAME → image URL, provided via IconOverrideContext at the tree root. An override
 * renders as a CSS-masked shape (`.k-icon`) that inherits `currentColor`, so it still
 * tints with the theme; unset names fall back to the built-in SVG below.
 */

/** Owner icon overrides (name → URL), provided once at the App root (element.ts). */
export const IconOverrideContext = createContext<Record<string, string> | undefined>(undefined);

/** A single-color icon painted from an image URL via CSS mask (inherits currentColor). */
function MaskedIcon({ url, size = 18 }: { url: string; size?: number }): JSX.Element {
  const s = `${size}px`;
  return (
    <span
      class="k-icon"
      style={`width:${s};height:${s};-webkit-mask-image:url("${url}");mask-image:url("${url}")`}
      aria-hidden="true"
    />
  );
}

/**
 * Render icon `name`: the configured override if present, else `fallback`. Use this
 * at call sites that should honor `branding.icons` (TASK-035).
 */
export function Icon({
  name,
  size,
  fallback,
}: {
  name: string;
  size?: number;
  fallback: JSX.Element;
}): JSX.Element {
  const url = iconOverride(useContext(IconOverrideContext), name);
  return url ? <MaskedIcon url={url} size={size} /> : fallback;
}

/** The Kenalin K-mark: navy left bracket + teal chevron cradling a chat bubble. */
export function LogoMark({ size = 28 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      {/* left navy bracket of the K */}
      <path
        d="M6 5h6.2a2 2 0 0 1 2 2v26a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
        fill="var(--k-navy, #0F2742)"
      />
      {/* teal chevron — the right arm of the K */}
      <path
        d="M31.5 4.6a2 2 0 0 1 2.9 2.7L22.1 20l12.3 12.7a2 2 0 0 1-2.9 2.7L16.4 21.4a2 2 0 0 1 0-2.8L31.5 4.6Z"
        fill="var(--k-accent, #22B8A7)"
      />
      {/* chat bubble at the heart of the mark */}
      <path
        d="M9.5 15.5h11a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-4l-3.6 3v-3h-3.4a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3Z"
        fill="#fff"
      />
      <circle cx="12.4" cy="20.5" r="1.35" fill="var(--k-navy, #0F2742)" />
      <circle cx="16.4" cy="20.5" r="1.35" fill="var(--k-navy, #0F2742)" />
      <circle cx="20.4" cy="20.5" r="1.35" fill="var(--k-navy, #0F2742)" />
    </svg>
  );
}

type IconProps = { size?: number; class?: string };
const base = (size: number): JSX.SVGAttributes<SVGSVGElement> => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 1.6,
  "stroke-linecap": "round" as const,
  "stroke-linejoin": "round" as const,
  "aria-hidden": "true",
});

export function IconSend({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)}>
      <path d="M4 12 20 4l-4 16-4-6-8-2Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconClose({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
export function IconMinimize({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)}>
      <path d="M6 12h12" />
    </svg>
  );
}
export function IconChevron({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
export function IconProject({ size = 20 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 9h18M8 5V3M16 5V3" />
    </svg>
  );
}
export function IconProfile({ size = 20 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}
export function IconBriefcase({ size = 20 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </svg>
  );
}
export function IconMessage({ size = 20 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)}>
      <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
export function IconEvidence({ size = 16 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)}>
      <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M13 3v5h5" />
    </svg>
  );
}
export function IconWhatsApp({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.8 4.9-1.3A10 10 0 1 0 12 2Zm5.2 14.1c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.2-.9-2.7-1.2-4.4-4-4.5-4.2-.1-.2-1-1.4-1-2.6 0-1.3.7-1.9.9-2.1.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.1.2-.2.4-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 2 1.1.9 1.9 1.2 2.2 1.3.3.1.5.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l1.7.8c.2.1.4.2.5.3.1.2.1.6-.1 1.1Z" />
    </svg>
  );
}
export function IconCalendar({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 3v4M16 3v4" />
    </svg>
  );
}
export function IconLink({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)}>
      <path d="M10 14a4 4 0 0 0 6 .5l2-2a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-6-.5l-2 2A4 4 0 0 0 11.7 17l1-1" />
    </svg>
  );
}
export function IconRefresh({ size = 16 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)}>
      <path d="M20 11a8 8 0 1 0-.6 4M20 5v6h-6" />
    </svg>
  );
}
export function IconChart({ size = 18 }: IconProps): JSX.Element {
  return (
    <svg {...base(size)}>
      <path d="M5 20V10M12 20V4M19 20v-7" />
    </svg>
  );
}

/** Map a quick-action id (or intent) to an icon. */
export function quickActionIcon(id: string): JSX.Element {
  switch (id) {
    case "see_projects":
      return <IconProject />;
    case "know_profile":
      return <IconProfile />;
    case "im_hiring":
      return <IconBriefcase />;
    case "business_need":
      return <IconMessage />;
    default:
      return <IconMessage />;
  }
}

/** Map a handoff/action type to an icon for CTA buttons. */
export function actionIcon(type: string): JSX.Element | null {
  switch (type) {
    case "whatsapp":
      return <IconWhatsApp />;
    case "calendar":
      return <IconCalendar />;
    case "link":
    case "contact_form":
    case "custom":
      return <IconLink />;
    default:
      return null;
  }
}
