/**
 * Kenalin widget styles — the design-system implementation (assets/design/
 * guideline.png). Injected into the Shadow DOM. Brand tokens are exposed as CSS
 * custom properties the host can override on the <kenalin-ai> element.
 *
 * Palette: navy #0F2742 · teal #22B8A7 · soft teal #8DE2D4 · amber #D99A2B ·
 * bg #F8F7F3 · text #172033 · muted #66708B · border #E4E7EC. Type: Inter.
 */
export const STYLES = /* css */ `
:host {
  --k-navy: var(--kenalin-navy, #0F2742);
  --k-accent: var(--kenalin-accent, #22B8A7);
  --k-accent-strong: var(--kenalin-accent-strong, #1AA090);
  /* Accent used as TEXT on a light surface — darkened to meet WCAG AA (TASK-006).
     Overridden to the bright accent in dark mode below. */
  --k-accent-text: var(--kenalin-accent-text, #0F766E);
  --k-accent-soft: var(--kenalin-accent-soft, #8DE2D4);
  --k-amber: var(--kenalin-amber, #D99A2B);
  --k-bg: var(--kenalin-bg, #F8F7F3);
  --k-surface: var(--kenalin-surface, #FFFFFF);
  --k-text: var(--kenalin-text, #172033);
  --k-muted: var(--kenalin-muted, #66708B);
  --k-border: var(--kenalin-border, #E4E7EC);
  --k-user: var(--kenalin-user-bg, #E7F6F2);
  --k-radius: var(--kenalin-radius, 18px);
  --k-font: var(--kenalin-font, "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  /* Placement (TASK-034) — offsets/z-index overridable via config; safe-area added below. */
  --k-pos-x: var(--kenalin-pos-x, 22px);
  --k-pos-y: var(--kenalin-pos-y, 22px);
  /* Mobile bottom offset — set to clear a host app bottom-nav; falls back to --k-pos-y. */
  --k-pos-y-mobile: var(--kenalin-pos-y-mobile, var(--k-pos-y));
  --k-z: var(--kenalin-z, 2147483000);
  all: initial;
  font-family: var(--k-font);
  -webkit-font-smoothing: antialiased;
}
@media (prefers-color-scheme: dark) {
  :host {
    --k-bg: var(--kenalin-bg, #0E1420);
    --k-surface: var(--kenalin-surface, #172033);
    --k-text: var(--kenalin-text, #EEF1F6);
    --k-muted: var(--kenalin-muted, #9AA6B8);
    --k-border: var(--kenalin-border, #263042);
    --k-user: var(--kenalin-user-bg, #12303A);
    /* On dark surfaces the bright accent already exceeds AA — use it for text. */
    --k-accent-text: var(--kenalin-accent-text, #22B8A7);
  }
}
:host([data-theme="dark"]) {
  --k-bg: #0E1420; --k-surface: #172033; --k-text: #EEF1F6;
  --k-muted: #9AA6B8; --k-border: #263042; --k-user: #12303A;
  --k-accent-text: var(--kenalin-accent-text, #22B8A7);
}
* { box-sizing: border-box; }
button { font: inherit; cursor: pointer; }

/* Overridable icons (TASK-035): a config icon URL is painted via CSS mask so it still
   inherits currentColor (theme accent/navy at the call site). Built-in SVGs are the fallback. */
.k-icon {
  display: inline-block; flex: none; background-color: currentColor;
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  -webkit-mask-position: center; mask-position: center;
  -webkit-mask-size: contain; mask-size: contain;
}

/* ── Launcher ─────────────────────────────────────────────────────────── */
.launcher {
  position: fixed; z-index: var(--k-z);
  bottom: calc(var(--k-pos-y) + env(safe-area-inset-bottom, 0px));
  inset-inline-end: calc(var(--k-pos-x) + env(safe-area-inset-right, 0px));
  display: inline-flex; align-items: center; gap: 9px;
  padding: 10px 18px 10px 12px; border: none;
  background: var(--k-accent); color: #fff; font-weight: 600; font-size: 14.5px;
  border-radius: 999px; box-shadow: 0 8px 24px rgba(15,39,66,.28);
  transition: transform .15s ease, box-shadow .15s ease;
}
.launcher:hover { transform: translateY(-1px); box-shadow: 0 12px 30px rgba(15,39,66,.34); }
.launcher:focus-visible { outline: 3px solid var(--k-navy); outline-offset: 2px; }
.launcher .badge {
  display: grid; place-items: center; width: 26px; height: 26px;
  background: #fff; border-radius: 8px;
}

/* ── Panel ────────────────────────────────────────────────────────────── */
.panel {
  position: fixed; z-index: var(--k-z);
  bottom: calc(var(--k-pos-y) + env(safe-area-inset-bottom, 0px));
  inset-inline-end: calc(var(--k-pos-x) + env(safe-area-inset-right, 0px));
  width: 384px; max-width: calc(100vw - 32px);
  height: 600px; max-height: calc(100vh - 44px);
  display: flex; flex-direction: column; overflow: hidden;
  background: var(--k-bg); color: var(--k-text);
  border: 1px solid var(--k-border); border-radius: var(--k-radius);
  box-shadow: 0 20px 60px rgba(15,39,66,.28);
  animation: k-rise .18s ease;
}
@keyframes k-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }

/* Corner (TASK-034): default anchors to the inline-end (right in LTR); bottom-left flips it. */
:host([data-corner="bottom-left"]) .launcher,
:host([data-corner="bottom-left"]) .panel {
  inset-inline-end: auto;
  inset-inline-start: calc(var(--k-pos-x) + env(safe-area-inset-left, 0px));
}

/* Mobile (≤768px, where a host app bottom-nav typically shows): lift the launcher by
   the configured mobile offset so it clears the nav (safe-area alone doesn't). */
@media (max-width: 768px) {
  .launcher { bottom: calc(var(--k-pos-y-mobile) + env(safe-area-inset-bottom, 0px)); }
}
@media (max-width: 480px) {
  /* Full-screen on mobile (default) — but keep clear of the safe-area/notch. */
  :host([data-mobile="fullscreen"]) .panel,
  :host(:not([data-mobile])) .panel {
    inset: 0; width: 100vw; height: 100dvh; max-height: 100dvh; border: 0; border-radius: 0;
  }
  /* Docked: stay a floating panel above a host bottom nav instead of full-screen. */
  :host([data-mobile="docked"]) .panel {
    inset-inline-start: auto;
    inset-inline-end: calc(var(--k-pos-x) + env(safe-area-inset-right, 0px));
    bottom: calc(var(--k-pos-y-mobile) + env(safe-area-inset-bottom, 0px));
    width: calc(100vw - 24px); max-width: 384px;
    height: 72dvh; max-height: calc(100dvh - 96px);
  }
  :host([data-mobile="docked"][data-corner="bottom-left"]) .panel {
    inset-inline-end: auto;
    inset-inline-start: calc(var(--k-pos-x) + env(safe-area-inset-left, 0px));
  }
}

/* ── Header (always navy — brand) ─────────────────────────────────────── */
.header {
  display: flex; align-items: center; gap: 11px;
  padding: 13px 14px; background: var(--k-navy); color: #fff;
}
.header .avatar {
  display: grid; place-items: center; width: 38px; height: 38px; flex: none;
  background: #fff; border-radius: 11px;
}
/* Owner logo/avatar image (TASK-004) — fills the badge/avatar square, keeps its radius. */
.badge .brandimg, .avatar .brandimg {
  width: 100%; height: 100%; object-fit: cover; border-radius: inherit; display: block;
}
.header .meta { display: flex; flex-direction: column; line-height: 1.25; min-width: 0; }
.header .name { font-weight: 600; font-size: 15px; }
.header .sub { font-size: 12px; color: #9DB0C4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.header .hspace { flex: 1; }
.header .iconbtn { background: none; border: none; color: #B7C4D4; padding: 5px; border-radius: 8px; display: grid; }
.header .iconbtn:hover { color: #fff; background: rgba(255,255,255,.08); }

/* ── Log ──────────────────────────────────────────────────────────────── */
.log { flex: 1; overflow-y: auto; padding: 16px 14px 8px; display: flex; flex-direction: column; gap: 14px; }
.log::-webkit-scrollbar { width: 8px; }
.log::-webkit-scrollbar-thumb { background: var(--k-border); border-radius: 8px; }

.row { display: flex; flex-direction: column; gap: 6px; max-width: 90%; }
.row.user { align-self: flex-end; align-items: flex-end; }
.bubble {
  padding: 11px 13px; font-size: 14px; line-height: 1.5; border-radius: 14px;
  white-space: pre-wrap; word-break: break-word;
}
.row.assistant .bubble { background: var(--k-surface); border: 1px solid var(--k-border); border-top-left-radius: 5px; }
.row.user .bubble { background: var(--k-user); color: var(--k-text); border-top-right-radius: 5px; }
.time { font-size: 11px; color: var(--k-muted); display: flex; align-items: center; gap: 3px; padding: 0 3px; }
.time .tick { color: var(--k-accent-text); letter-spacing: -2px; }

/* ── Quick-action cards ───────────────────────────────────────────────── */
.qgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
.qcard {
  display: flex; flex-direction: column; gap: 6px; text-align: start;
  padding: 12px; background: var(--k-surface); border: 1px solid var(--k-border);
  border-radius: 13px; transition: border-color .15s, transform .1s;
}
.qcard:hover { border-color: var(--k-accent); transform: translateY(-1px); }
.qcard:focus-visible { outline: 2px solid var(--k-accent); outline-offset: 1px; }
.qcard .qtop { display: flex; align-items: center; justify-content: space-between; color: var(--k-accent); }
.qcard .qtitle { font-weight: 600; font-size: 13.5px; color: var(--k-text); }
.qcard .qsub { font-size: 11.5px; color: var(--k-muted); line-height: 1.35; }

/* ── Suggestion chips (screening) ─────────────────────────────────────── */
.chips { display: flex; flex-direction: column; gap: 8px; }
.chip {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 10px 13px; background: var(--k-surface); border: 1px solid var(--k-border);
  border-radius: 11px; color: var(--k-text); font-size: 13.5px; text-align: start;
}
.chip:hover { border-color: var(--k-accent); }
.chip svg { color: var(--k-muted); flex: none; }

/* ── Evidence cards ───────────────────────────────────────────────────── */
.evlist { display: flex; flex-direction: column; gap: 8px; }
.evcard {
  display: block; text-decoration: none; color: inherit;
  background: var(--k-surface); border: 1px solid var(--k-border); border-radius: 13px;
  padding: 11px; transition: border-color .15s;
}
.evcard:hover { border-color: var(--k-accent); }
.evcard .evhead { display: flex; align-items: center; gap: 6px; color: var(--k-muted); font-size: 11px; margin-bottom: 5px; }
.evcard .evtitle { font-weight: 600; font-size: 13.5px; color: var(--k-text); }
.evcard .evsnippet { font-size: 12px; color: var(--k-muted); line-height: 1.4; margin-top: 3px; }
.evtags { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
.evtag { font-size: 10.5px; color: var(--k-muted); background: var(--k-bg); border: 1px solid var(--k-border); border-radius: 6px; padding: 2px 7px; }
.evmore { display: inline-flex; align-items: center; gap: 3px; color: var(--k-accent-text); font-size: 12px; font-weight: 600; margin-top: 9px; }

/* ── Complexity block ─────────────────────────────────────────────────── */
.complex { background: var(--k-surface); border: 1px solid var(--k-border); border-radius: 13px; padding: 13px; }
.complex .eyebrow { font-size: 10.5px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: var(--k-accent-text); }
.complex .clevel { display: flex; align-items: center; gap: 8px; margin: 4px 0 6px; }
.complex .cval { font-size: 26px; font-weight: 700; color: var(--k-amber); text-transform: capitalize; }
.complex .cval svg { color: var(--k-amber); }
.complex .cnote { font-size: 12px; color: var(--k-muted); line-height: 1.45; }
.complex .cdisc { font-size: 11px; color: var(--k-muted); font-style: italic; margin-top: 6px; }

/* ── Actions / CTA buttons ────────────────────────────────────────────── */
.actions { display: flex; flex-direction: column; gap: 8px; }
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; padding: 11px 14px; border-radius: 11px; font-weight: 600; font-size: 13.5px;
  text-decoration: none; border: 1px solid transparent;
}
.btn-primary { background: var(--k-accent); color: #fff; }
.btn-primary:hover { background: var(--k-accent-strong); }
.btn-secondary { background: transparent; color: var(--k-text); border-color: var(--k-border); }
.btn-secondary:hover { border-color: var(--k-accent); }

/* ── Idle nudge (TASK-012) — static (no motion → reduced-motion-safe) ─────── */
.idle-nudge {
  text-align: center; font-size: 12px; color: var(--k-muted);
  padding: 7px 12px; background: var(--k-surface); border-top: 1px solid var(--k-border);
}

/* ── Composer ─────────────────────────────────────────────────────────── */
.composer { display: flex; align-items: center; gap: 8px; padding: 11px 12px; border-top: 1px solid var(--k-border); background: var(--k-surface); }
.composer .field { flex: 1; display: flex; align-items: center; gap: 8px; background: var(--k-bg); border: 1px solid var(--k-border); border-radius: 12px; padding: 8px 12px; }
.composer .field:focus-within { border-color: var(--k-accent); }
.composer input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; color: var(--k-text); }
.composer input::placeholder { color: var(--k-muted); }
.composer .send { display: grid; place-items: center; width: 38px; height: 38px; flex: none; border: none; background: var(--k-accent); color: #fff; border-radius: 11px; }
.composer .send:hover { background: var(--k-accent-strong); }
.composer .send:disabled { opacity: .45; }
.foot { text-align: center; font-size: 10px; color: var(--k-muted); padding: 6px 0 9px; background: var(--k-surface); }
.foot b { color: var(--k-accent-text); font-weight: 600; }

/* ── States ───────────────────────────────────────────────────────────── */
.dots span { display: inline-block; width: 6px; height: 6px; margin: 0 2px; border-radius: 50%; background: var(--k-accent); animation: k-blink 1.2s infinite both; }
.dots span:nth-child(2){ animation-delay: .18s; } .dots span:nth-child(3){ animation-delay: .36s; }
@keyframes k-blink { 0%,80%,100%{ opacity:.25; transform: translateY(0);} 40%{ opacity:1; transform: translateY(-2px);} }
.fallback { display: flex; flex-direction: column; align-items: flex-start; gap: 9px; background: var(--k-surface); border: 1px solid var(--k-border); border-radius: 13px; padding: 13px; }
.fallback .fmsg { font-size: 13px; color: var(--k-muted); line-height: 1.5; }
.fallback .retry { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border: 1px solid var(--k-border); border-radius: 9px; color: var(--k-text); font-size: 13px; font-weight: 500; background: transparent; }
.fallback .retry:hover { border-color: var(--k-accent); color: var(--k-accent-text); }

@media (prefers-reduced-motion: reduce) {
  .panel, .launcher, .dots span { animation: none; transition: none; }
}
`;
