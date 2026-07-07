import { useState, useRef, useCallback, useEffect } from "preact/hooks";
import type { JSX } from "preact";
import { KenalinClient } from "./api.js";
import { t, quickSub, detectLang, errorMessage, isRetryable } from "./i18n.js";
import { avatarUrl } from "./branding.js";
import {
  Icon,
  LogoMark,
  IconClose,
  IconMinimize,
  IconChevron,
  IconSend,
  IconEvidence,
  IconRefresh,
  IconChart,
  quickActionIcon,
  actionIcon,
} from "./icons.js";
import type {
  Action,
  ConversationState,
  Evidence,
  Lang,
  PageContext,
  PublicConfig,
} from "./types.js";

export interface AppProps {
  apiUrl: string;
  configUrl?: string;
  config: PublicConfig;
  pageContext?: PageContext;
  startOpen?: boolean;
}

interface UiMessage {
  role: "user" | "assistant";
  content: string;
  time?: string;
  evidence?: Evidence[];
  actions?: Action[];
  replies?: string[];
  complexity?: string | null;
  pending?: boolean;
  failed?: boolean;
  errorCode?: string;
}

const EMPTY_STATE: ConversationState = {
  intent: "unknown",
  confidence: 0,
  intentHistory: [],
  language: "id",
  qualification: { stage: null, category: null, complexity: null, answers: [], questionCount: 0 },
  handoffOffered: false,
};

function uuid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `s-${Math.random().toString(36).slice(2)}`;
}
function now(): string {
  try {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function App({ apiUrl, config, pageContext, startOpen }: AppProps): JSX.Element {
  const [open, setOpen] = useState(Boolean(startOpen));
  const [lang] = useState<Lang>(detectLang((config.assistant.languages[0] as Lang) ?? "id", config.assistant.languages));
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const stateRef = useRef<ConversationState>({ ...EMPTY_STATE, language: lang });
  const sessionRef = useRef<string>(uuid());
  const clientRef = useRef(new KenalinClient(apiUrl));
  const logRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);
  const lastUserRef = useRef<{ text: string; seed?: string } | null>(null);

  useEffect(() => {
    if (open && messages.length === 0 && config.assistant.openingMessage) {
      setMessages([{ role: "assistant", content: config.assistant.openingMessage, time: now() }]);
    }
  }, [open]);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // A11y (TASK-006): move focus into the open panel, trap Tab within it, close on
  // Escape, and restore focus to the launcher on close. Shadow-DOM aware.
  useEffect(() => {
    if (!open) {
      if (restoreFocusRef.current) {
        launcherRef.current?.focus();
        restoreFocusRef.current = false;
      }
      return;
    }
    const panel = panelRef.current;
    if (!panel) return;
    const focusables = (): HTMLElement[] =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
    focusables()[0]?.focus();
    const activeEl = (): Element | null => {
      const root = panel.getRootNode();
      return root instanceof ShadowRoot ? root.activeElement : document.activeElement;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        restoreFocusRef.current = true;
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0]!;
      const lastEl = items[items.length - 1]!;
      const active = activeEl();
      if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    panel.addEventListener("keydown", onKeyDown);
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const patchLastAssistant = (patch: Partial<UiMessage>) =>
    setMessages((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i]!.role === "assistant") {
          next[i] = { ...next[i]!, ...patch };
          break;
        }
      }
      return next;
    });

  const send = useCallback(
    async (text: string, seedIntent?: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setInput("");
      setBusy(true);
      lastUserRef.current = { text: trimmed, seed: seedIntent };
      if (seedIntent) stateRef.current = { ...stateRef.current, intent: seedIntent as ConversationState["intent"] };

      const history = messages.filter((m) => !m.pending && !m.failed).map((m) => ({ role: m.role, content: m.content }));
      const outbound = [...history, { role: "user" as const, content: trimmed }];
      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed, time: now() },
        { role: "assistant", content: "", pending: true },
      ]);

      let streamed = "";
      await clientRef.current.chat(
        { sessionId: sessionRef.current, messages: outbound.slice(-12), state: stateRef.current, pageContext, locale: lang },
        {
          onDelta: (d) => {
            streamed += d;
            patchLastAssistant({ content: streamed });
          },
          onPayload: (res) => {
            stateRef.current = { ...stateRef.current, ...res.stateUpdates } as ConversationState;
            const actions: Action[] = [];
            if (res.handoff?.url) {
              actions.push({
                id: "handoff",
                label: handoffLabel(res.handoff.channel, lang),
                type: res.handoff.channel === "webhook" ? "custom" : res.handoff.channel,
                url: res.handoff.url,
              } as Action);
            }
            for (const a of res.suggestedActions ?? []) if (a.id !== "handoff") actions.push(a);
            patchLastAssistant({
              content: res.answer || streamed,
              evidence: res.evidence,
              actions,
              replies: res.suggestedReplies,
              complexity: res.qualification?.complexity ?? null,
              time: now(),
              pending: false,
            });
          },
          onError: (err) =>
            patchLastAssistant({ content: streamed, pending: false, failed: !streamed, errorCode: err.code }),
        },
      );
      setBusy(false);
    },
    [messages, busy, lang, pageContext],
  );

  const retry = () => {
    const last = lastUserRef.current;
    if (!last) return;
    setMessages((prev) => {
      // drop the failed assistant turn
      const next = [...prev];
      if (next.at(-1)?.role === "assistant") next.pop();
      return next;
    });
    void send(last.text, last.seed);
  };

  const brandLogo = config.branding?.logoUrl;
  const brandAvatar = avatarUrl(config);

  if (!open) {
    return (
      <button
        class="launcher"
        ref={launcherRef}
        aria-label={t(lang, "openLabel")}
        onClick={() => {
          restoreFocusRef.current = true;
          setOpen(true);
        }}
      >
        <span class="badge">
          {brandLogo ? <img class="brandimg" src={brandLogo} alt="" /> : <LogoMark size={20} />}
        </span>
        {config.assistant.launcherLabel}
      </button>
    );
  }

  const showQuick = messages.filter((m) => !m.pending).length <= 1 && config.quickActions.length > 0;

  return (
    <div class="panel" role="dialog" aria-modal="true" aria-label={config.assistant.name} ref={panelRef}>
      <div class="header">
        <span class="avatar">
          {brandAvatar ? <img class="brandimg" src={brandAvatar} alt="" /> : <LogoMark size={26} />}
        </span>
        <div class="meta">
          <span class="name">{config.assistant.name}</span>
          <span class="sub">{config.assistant.description ?? `${t(lang, "subtitle")} · ${config.owner.preferredName ?? config.owner.name}`}</span>
        </div>
        <span class="hspace" />
        <button class="iconbtn" aria-label={t(lang, "minimize")} onClick={() => setOpen(false)}><Icon name="minimize" fallback={<IconMinimize />} /></button>
        <button class="iconbtn" aria-label={t(lang, "close")} onClick={() => { setMessages([]); setOpen(false); }}><Icon name="close" fallback={<IconClose />} /></button>
      </div>

      <div class="log" ref={logRef} role="log" aria-live="polite" aria-relevant="additions text">
        {messages.map((m, i) => (
          <MessageView
            key={i}
            m={m}
            lang={lang}
            isLast={i === messages.length - 1}
            onRetry={retry}
            onReply={(txt) => send(txt)}
          />
        ))}

        {showQuick && (
          <div class="qgrid">
            {config.quickActions.map((q) => (
              <button class="qcard" key={q.id} onClick={() => send(q.label[lang] ?? q.label.en, q.seedIntent)}>
                <div class="qtop"><Icon name={`quick:${q.id}`} size={20} fallback={quickActionIcon(q.id)} /><IconChevron size={16} /></div>
                <div class="qtitle">{q.label[lang] ?? q.label.en}</div>
                <div class="qsub">{quickSub(lang, q.id)}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <form
        class="composer"
        onSubmit={(e: Event) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <div class="field">
          <input
            value={input}
            placeholder={t(lang, "placeholder")}
            onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => setInput(e.currentTarget.value)}
            aria-label={t(lang, "placeholder")}
          />
        </div>
        <button class="send" type="submit" disabled={busy || !input.trim()} aria-label={t(lang, "send")}><Icon name="send" fallback={<IconSend />} /></button>
      </form>
      <div class="foot">Powered by <b>Kenalin</b></div>
    </div>
  );
}

function MessageView({
  m,
  lang,
  isLast,
  onRetry,
  onReply,
}: {
  m: UiMessage;
  lang: Lang;
  isLast: boolean;
  onRetry: () => void;
  onReply: (text: string) => void;
}): JSX.Element {
  if (m.failed) {
    const code = m.errorCode ?? "generic";
    return (
      <div class="row assistant">
        <div class="fallback">
          <div class="fmsg">{errorMessage(lang, code)}</div>
          {isRetryable(code) && (
            <button class="retry" onClick={onRetry}><Icon name="refresh" size={16} fallback={<IconRefresh />} /> {t(lang, "retry")}</button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div class={`row ${m.role}`}>
      <div class="bubble">
        {m.pending && !m.content ? (
          <span class="dots" aria-label={t(lang, "thinking")}><span /><span /><span /></span>
        ) : (
          m.content
        )}
      </div>

      {m.complexity && (
        <div class="complex">
          <div class="eyebrow">{t(lang, "complexityEyebrow")}</div>
          <div class="clevel"><span class="cval">{m.complexity}</span><Icon name="chart" fallback={<IconChart />} /></div>
          <div class="cdisc">{t(lang, "complexityDisclaimer")}</div>
        </div>
      )}

      {m.evidence && m.evidence.length > 0 && (
        <div class="evlist">
          {m.evidence.map((e) => <EvidenceCard key={e.id} e={e} />)}
        </div>
      )}

      {m.actions && m.actions.length > 0 && (
        <div class="actions">
          {m.actions.map((a) => <ActionButton key={a.id} a={a} primary={a.id === "handoff"} />)}
        </div>
      )}

      {isLast && !m.pending && m.replies && m.replies.length > 0 && (
        <div class="chips" role="group">
          {m.replies.map((r) => (
            <button class="chip" key={r} onClick={() => onReply(r)}>
              <span>{r}</span>
              <IconChevron size={16} />
            </button>
          ))}
        </div>
      )}

      {m.time && !m.pending && (
        <div class="time">{m.time}{m.role === "user" && <span class="tick">✓✓</span>}</div>
      )}
    </div>
  );
}

function EvidenceCard({ e }: { e: Evidence }): JSX.Element {
  const target = e.url && isExternal(e.url) ? "_blank" : "_self";
  const body = (
    <>
      <div class="evhead"><Icon name="evidence" size={16} fallback={<IconEvidence />} /> <span>{e.type.replace(/_/g, " ")}</span></div>
      <div class="evtitle">{e.title}</div>
      {e.snippet && <div class="evsnippet">{e.snippet.slice(0, 130)}</div>}
      {e.tags && e.tags.length > 0 && (
        <div class="evtags">{e.tags.map((tg) => <span class="evtag" key={tg}>{tg}</span>)}</div>
      )}
      {e.url && <span class="evmore">View <IconChevron size={14} /></span>}
    </>
  );
  return e.url ? (
    <a class="evcard" href={e.url} target={target} rel="noopener">{body}</a>
  ) : (
    <div class="evcard">{body}</div>
  );
}

function ActionButton({ a, primary }: { a: Action; primary: boolean }): JSX.Element {
  const href = a.url ?? "#";
  const target = a.url && isExternal(a.url) ? "_blank" : "_self";
  const icon = actionIcon(a.type);
  return (
    <a class={`btn ${primary ? "btn-primary" : "btn-secondary"}`} href={href} target={target} rel="noopener">
      <Icon name={`action:${a.type}`} fallback={icon ?? <span />} />{a.label}
    </a>
  );
}

function isExternal(url: string): boolean {
  if (url.startsWith("/") || url.startsWith("#")) return false;
  try {
    return typeof location === "undefined" || new URL(url, location.href).origin !== location.origin;
  } catch {
    return true;
  }
}

function handoffLabel(channel: string, lang: Lang): string {
  const map: Record<string, { id: string; en: string }> = {
    whatsapp: { id: "Lanjut via WhatsApp", en: "Continue on WhatsApp" },
    email: { id: "Kirim email", en: "Send an email" },
    calendar: { id: "Jadwalkan panggilan", en: "Schedule a call" },
    contact_form: { id: "Hubungi", en: "Get in touch" },
  };
  return (map[channel] ?? map.contact_form!)[lang];
}
