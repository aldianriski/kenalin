import { render, h } from "preact";
import { App } from "./app.js";
import { STYLES } from "./styles.js";
import { KenalinClient } from "./api.js";
import { themeCssVars, positionCssVars } from "./branding.js";
import { IconOverrideContext } from "./icons.js";
import type { PageContext, PublicConfig } from "./types.js";

/**
 * <kenalin-ai api-url="…" config-url="…" page-type="…" project-id="…" start-open>
 * A Shadow-DOM-isolated Web Component. Theming via CSS custom properties on the
 * element (PRD D7). Talks only to the API.
 */
export class KenalinElement extends HTMLElement {
  private mounted = false;

  async connectedCallback(): Promise<void> {
    if (this.mounted) return;
    this.mounted = true;

    const apiUrl = this.getAttribute("api-url") ?? "";
    const configUrl = this.getAttribute("config-url") ?? undefined;
    if (!apiUrl) {
      console.warn("[kenalin] <kenalin-ai> requires an api-url attribute");
      return;
    }

    const shadow = this.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = STYLES;
    shadow.appendChild(style);
    const mount = document.createElement("div");
    shadow.appendChild(mount);

    const pageContext: PageContext = {
      url: location.href,
      title: document.title || undefined,
      pageType: this.getAttribute("page-type") ?? undefined,
      projectId: this.getAttribute("project-id") ?? undefined,
    };

    let config: PublicConfig;
    try {
      config = await new KenalinClient(apiUrl).fetchConfig(configUrl);
    } catch (err) {
      console.warn("[kenalin] failed to load config:", err);
      return;
    }

    // Apply owner theme tokens (TASK-004) as `--kenalin-*` overrides on the host,
    // which `:host` in the Shadow-DOM styles resolves. Unset tokens keep defaults.
    for (const [name, value] of themeCssVars(config.branding?.theme)) {
      this.style.setProperty(name, value);
    }

    // Apply widget placement (TASK-034): offsets/z-index as CSS vars; corner + mobile
    // mode as host attributes the `:host([data-*])` selectors read. safe-area insets are
    // added in styles.ts, but only resolve to non-zero when the host viewport opts in.
    const position = config.branding?.position;
    for (const [name, value] of positionCssVars(position)) {
      this.style.setProperty(name, value);
    }
    this.setAttribute("data-corner", position?.corner ?? "bottom-right");
    this.setAttribute("data-mobile", position?.mobile ?? "fullscreen");
    ensureViewportFitCover();

    render(
      h(
        IconOverrideContext.Provider,
        { value: config.branding?.icons },
        h(App, {
          apiUrl,
          configUrl,
          config,
          pageContext,
          startOpen: this.hasAttribute("start-open"),
        }),
      ),
      mount,
    );
  }
}

/**
 * `env(safe-area-inset-*)` resolves to 0 unless the host page's viewport meta opts in
 * with `viewport-fit=cover` (TASK-034). Patch it additively — never create one (that
 * could disrupt a host that intentionally omits it); if absent, insets just stay 0.
 */
function ensureViewportFitCover(): void {
  if (typeof document === "undefined") return;
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;
  const content = meta.getAttribute("content") ?? "";
  if (/viewport-fit/.test(content)) return;
  meta.setAttribute("content", content ? `${content}, viewport-fit=cover` : "viewport-fit=cover");
}

/** Register the custom element once. */
export function defineKenalinElement(tag = "kenalin-ai"): void {
  if (typeof customElements !== "undefined" && !customElements.get(tag)) {
    customElements.define(tag, KenalinElement);
  }
}
