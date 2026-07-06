import { render, h } from "preact";
import { App } from "./app.js";
import { STYLES } from "./styles.js";
import { KenalinClient } from "./api.js";
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

    render(
      h(App, {
        apiUrl,
        configUrl,
        config,
        pageContext,
        startOpen: this.hasAttribute("start-open"),
      }),
      mount,
    );
  }
}

/** Register the custom element once. */
export function defineKenalinElement(tag = "kenalin-ai"): void {
  if (typeof customElements !== "undefined" && !customElements.get(tag)) {
    customElements.define(tag, KenalinElement);
  }
}
