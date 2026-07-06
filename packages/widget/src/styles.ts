/**
 * Widget CSS, injected into the Shadow DOM. Host controls look via CSS custom
 * properties on the <kenalin-ai> element (PRD B8). Neutral defaults ship here;
 * no glowing orbs, no purple-blue AI gradient, no mascots.
 */
export const STYLES = /* css */ `
:host {
  --k-accent: var(--kenalin-accent, #2d6cdf);
  --k-radius: var(--kenalin-radius, 14px);
  --k-font: var(--kenalin-font, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif);
  --k-surface: var(--kenalin-surface, #ffffff);
  --k-text: var(--kenalin-text, #16181d);
  --k-muted: var(--kenalin-muted, #667085);
  --k-border: var(--kenalin-border, #e4e7ec);
  --k-user-bg: var(--kenalin-user-bg, #eef2fb);
  all: initial;
  font-family: var(--k-font);
}
@media (prefers-color-scheme: dark) {
  :host {
    --k-surface: var(--kenalin-surface, #1a1c22);
    --k-text: var(--kenalin-text, #f0f2f5);
    --k-muted: var(--kenalin-muted, #9aa2b1);
    --k-border: var(--kenalin-border, #2c2f38);
    --k-user-bg: var(--kenalin-user-bg, #26314a);
  }
}
* { box-sizing: border-box; }
.launcher {
  position: fixed; bottom: 20px; inset-inline-end: 20px; z-index: 2147483000;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 16px; border: none; cursor: pointer;
  background: var(--k-accent); color: #fff; font: inherit; font-weight: 600; font-size: 14px;
  border-radius: 999px; box-shadow: 0 6px 20px rgba(16,24,40,.18);
}
.launcher:focus-visible { outline: 3px solid var(--k-accent); outline-offset: 2px; }
.panel {
  position: fixed; z-index: 2147483000; bottom: 20px; inset-inline-end: 20px;
  width: 380px; max-width: calc(100vw - 32px); height: 560px; max-height: calc(100vh - 40px);
  display: flex; flex-direction: column;
  background: var(--k-surface); color: var(--k-text);
  border: 1px solid var(--k-border); border-radius: var(--k-radius);
  box-shadow: 0 12px 40px rgba(16,24,40,.24); overflow: hidden;
}
@media (max-width: 480px) {
  .panel { inset: 0; width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; }
}
.header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-bottom: 1px solid var(--k-border);
}
.header .title { font-weight: 600; font-size: 15px; }
.header .role { font-size: 12px; color: var(--k-muted); }
.iconbtn { background: none; border: none; cursor: pointer; color: var(--k-muted); font-size: 18px; line-height: 1; padding: 4px; }
.log { flex: 1; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }
.msg { display: flex; flex-direction: column; gap: 6px; max-width: 92%; font-size: 14px; line-height: 1.5; }
.msg.user { align-self: flex-end; align-items: flex-end; }
.bubble { padding: 10px 12px; border-radius: 12px; white-space: pre-wrap; word-break: break-word; }
.msg.assistant .bubble { background: transparent; border: 1px solid var(--k-border); }
.msg.user .bubble { background: var(--k-user-bg); }
.evidence { display: flex; flex-direction: column; gap: 6px; margin-top: 2px; }
.evcard {
  display: block; text-decoration: none; color: inherit;
  border: 1px solid var(--k-border); border-radius: 10px; padding: 8px 10px; font-size: 12px;
}
.evcard .evtitle { font-weight: 600; }
.evcard .evtype { display: inline-block; font-size: 10px; text-transform: uppercase; letter-spacing: .04em;
  color: var(--k-muted); border: 1px solid var(--k-border); border-radius: 5px; padding: 1px 5px; margin-bottom: 4px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.action {
  display: inline-block; text-decoration: none; cursor: pointer;
  font-size: 13px; font-weight: 500; padding: 8px 12px; border-radius: 10px;
  border: 1px solid var(--k-accent); color: var(--k-accent); background: transparent;
}
.action.primary { background: var(--k-accent); color: #fff; }
.quick { display: flex; flex-wrap: wrap; gap: 8px; padding: 0 16px 10px; }
.chip { cursor: pointer; font-size: 13px; padding: 7px 11px; border-radius: 999px;
  border: 1px solid var(--k-border); background: transparent; color: var(--k-text); }
.composer { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--k-border); }
.composer input {
  flex: 1; font: inherit; font-size: 14px; padding: 10px 12px; color: var(--k-text);
  background: transparent; border: 1px solid var(--k-border); border-radius: 10px; outline: none;
}
.composer input:focus { border-color: var(--k-accent); }
.composer button { border: none; background: var(--k-accent); color: #fff; font: inherit; font-weight: 600;
  padding: 0 16px; border-radius: 10px; cursor: pointer; }
.composer button:disabled { opacity: .5; cursor: default; }
.foot { text-align: center; font-size: 10px; color: var(--k-muted); padding: 0 0 8px; }
.dots span { display: inline-block; width: 6px; height: 6px; margin: 0 1px; border-radius: 50%;
  background: var(--k-muted); animation: k-blink 1.2s infinite both; }
.dots span:nth-child(2){animation-delay:.2s}.dots span:nth-child(3){animation-delay:.4s}
@keyframes k-blink { 0%,80%,100%{opacity:.2} 40%{opacity:1} }
`;
