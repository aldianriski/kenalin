import { defineKenalinElement, KenalinElement } from "./element.js";

/**
 * Script embed entry (PRD D7 option A). Registers <kenalin-ai>, then — if the
 * loading <script> carries data-api-url — auto-mounts one instance so a single
 * <script> tag is enough:
 *
 *   <script src="…/kenalin.js" data-api-url="https://api.example"
 *           data-config-url="…" data-project-id="…" defer></script>
 */
defineKenalinElement();

function autoMount(): void {
  const current =
    (document.currentScript as HTMLScriptElement | null) ??
    document.querySelector<HTMLScriptElement>("script[data-api-url]");
  const apiUrl = current?.getAttribute("data-api-url");
  if (!apiUrl) return;
  if (document.querySelector("kenalin-ai")) return; // host placed the element manually

  const el = new KenalinElement();
  el.setAttribute("api-url", apiUrl);
  const passthrough = ["data-config-url", "data-page-type", "data-project-id", "data-start-open"];
  for (const attr of passthrough) {
    const v = current?.getAttribute(attr);
    if (v !== null && v !== undefined) el.setAttribute(attr.replace(/^data-/, ""), v);
  }
  document.body.appendChild(el);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount, { once: true });
  } else {
    autoMount();
  }
}

export { defineKenalinElement, KenalinElement };
