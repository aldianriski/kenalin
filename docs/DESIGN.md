---
design_system: Kenalin
last_updated: 2026-07-06
source_of_truth: assets/design/guideline.png
applies_to: packages/widget
---

# Kenalin — Design System

> The visual identity for the embeddable assistant. The canonical reference is
> [`assets/design/guideline.png`](../assets/design/guideline.png); this file is the
> machine-readable token contract the widget implements.

## Brand

Kenalin is **calm, credible, compact, and native to its host** (PRD B8). No glowing
orbs, no purple-blue AI gradient, no mascots. The signature is the **K-mark** — a
navy bracket and teal chevron cradling a chat bubble — echoing "a conversation at
the heart of the profile."

## Color tokens

| Token | Hex | Role |
|---|---|---|
| Navy | `#0F2742` | Header, primary text, logo bracket |
| Teal | `#22B8A7` | Accent, primary CTA, send, links, logo chevron |
| Teal strong | `#1AA090` | CTA hover |
| Soft teal | `#8DE2D4` | Soft accent, subtle highlights |
| Amber | `#D99A2B` | Complexity value (`Medium`), status |
| Background | `#F8F7F3` | Panel background (light) |
| Surface | `#FFFFFF` | Cards, bubbles, composer (light) |
| Text | `#172033` | Body text |
| Muted | `#66708B` | Captions, secondary text |
| Border | `#E4E7EC` | Dividers, card borders |
| User bubble | `#E7F6F2` | Visitor message background |

Dark mode flips background/surface/text/border to a navy scale; the **header stays
navy** in both themes. The widget follows `prefers-color-scheme` and a
`data-theme="dark|light"` attribute on the host element.

## Typography

**Inter**, with a system fallback. Scale (size / line-height / weight):

| Role | Size/LH | Weight |
|---|---|---|
| Heading 1 | 24 / 32 | 600 |
| Heading 2 | 18 / 24 | 600 |
| Body | 14 / 20 | 400 |
| Caption | 12 / 16 | 400 |

## Component library

Evidence card · suggestion chip · quick-action card · composer · primary button
(teal, e.g. *Continue to WhatsApp*) · secondary button (outline, e.g. *Schedule a
call*) · complexity block (eyebrow + amber value + disclaimer) · conversation-brief
checklist · loading (three teal dots) · fallback (message + *Try again*). Line-icon
family: search, project, briefcase, calendar, message, WhatsApp, profile, evidence,
close, minimize, send.

## Interaction cues

`Launcher open → Panel expand → Evidence reveal → Brief summary → Handoff to WhatsApp`.
Answer text streams; evidence cards and actions render after the structured payload
completes (PRD B8). Motion respects `prefers-reduced-motion`.

## Host theming

Override on the `<kenalin-ai>` element (all optional):

```css
kenalin-ai {
  --kenalin-accent: #22B8A7;
  --kenalin-navy:   #0F2742;
  --kenalin-radius: 18px;
  --kenalin-font:   "Inter", system-ui, sans-serif;
  --kenalin-surface: #ffffff;
  /* …-bg, -text, -muted, -border, -accent-soft, -amber, -user-bg */
}
```
