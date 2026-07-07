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
  private themeObserver?: MutationObserver;
  private branding?: PublicConfig["branding"];

  /** Apply `theme` merged with `modes[<host data-mode>]` as `--kenalin-*` host vars.
   *  Clears every token any mode could set first, so switching modes leaves no stale var. */
  private applyTheme(): void {
    const base = this.branding?.theme ?? {};
    const modes = this.branding?.modes ?? {};
    const mode = (typeof document !== "undefined" && document.documentElement.getAttribute("data-mode")) || "";
    const merged = { ...base, ...(modes[mode] ?? {}) };
    const all: Record<string, string> = { ...base };
    for (const m of Object.values(modes)) Object.assign(all, m);
    for (const [name] of themeCssVars(all)) this.style.removeProperty(name);
    for (const [name, value] of themeCssVars(merged)) this.style.setProperty(name, value);
  }

  /**
   * Follow the host page's theme + persona mode. Mirrors the light/dark signal (the
   * Tailwind/next-themes `dark` class or a `data-theme` attribute) onto this element's
   * `data-theme`, and re-applies the mode theme when the host's `data-mode` changes —
   * so a "code"/"product" persona toggle recolors the widget.
   */
  private followHost(): void {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const resolveTheme = (): "dark" | "light" => {
      const attr = root.getAttribute("data-theme");
      if (attr === "dark" || attr === "light") return attr;
      return root.classList.contains("dark") ? "dark" : "light";
    };
    const apply = (): void => {
      this.setAttribute("data-theme", resolveTheme());
      this.applyTheme();
    };
    apply();
    this.themeObserver = new MutationObserver(apply);
    this.themeObserver.observe(root, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-mode"],
    });
  }

  disconnectedCallback(): void {
    this.themeObserver?.disconnect();
  }

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

    // Owner theme tokens (TASK-004) + per-mode overrides are applied by followHost()
    // below (merged for the current host data-mode), and re-applied on theme/mode change.
    this.branding = config.branding;

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
    this.followHost();

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
