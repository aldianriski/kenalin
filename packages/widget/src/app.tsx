import { useState, useRef, useCallback, useEffect } from "preact/hooks";
import type { JSX } from "preact";
import { KenalinClient } from "./api.js";
import { t, detectLang } from "./i18n.js";
import type {
  Action,
  ConversationState,
  Evidence,
  Lang,
  PageContext,
  PublicConfig,
  UiMessage,
} from "./types.js";

export interface AppProps {
  apiUrl: string;
  configUrl?: string;
  config: PublicConfig;
  pageContext?: PageContext;
  startOpen?: boolean;
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
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `s-${Math.random().toString(36).slice(2)}`;
}

export function App({ apiUrl, configUrl, config, pageContext, startOpen }: AppProps): JSX.Element {
  const [open, setOpen] = useState(Boolean(startOpen));
  const [lang, setLang] = useState<Lang>(detectLang((config.assistant.languages[0] as Lang) ?? "id", config.assistant.languages));
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const stateRef = useRef<ConversationState>({ ...EMPTY_STATE, language: lang });
  const sessionRef = useRef<string>(uuid());
  const clientRef = useRef(new KenalinClient(apiUrl));
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0 && config.assistant.openingMessage) {
      setMessages([{ role: "assistant", content: config.assistant.openingMessage }]);
    }
  }, [open]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [messages]);

  const send = useCallback(
    async (text: string, seedIntent?: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;
      setInput("");
      setBusy(true);
      if (seedIntent) stateRef.current = { ...stateRef.current, intent: seedIntent as ConversationState["intent"] };

      const history = messages
        .filter((m) => !m.pending)
        .map((m) => ({ role: m.role, content: m.content }));
      const outbound = [...history, { role: "user" as const, content: trimmed }];

      setMessages((prev) => [
        ...prev,
        { role: "user", content: trimmed },
        { role: "assistant", content: "", pending: true },
      ]);

      let streamed = "";
      const finish = (patch: Partial<UiMessage>) =>
        setMessages((prev) => {
          const next = [...prev];
          for (let i = next.length - 1; i >= 0; i--) {
            if (next[i]!.role === "assistant") {
              next[i] = { ...next[i]!, pending: false, ...patch };
              break;
            }
          }
          return next;
        });

      await clientRef.current.chat(
        {
          sessionId: sessionRef.current,
          messages: outbound.slice(-12),
          state: stateRef.current,
          pageContext,
          locale: lang,
        },
        {
          onDelta: (d) => {
            streamed += d;
            setMessages((prev) => {
              const next = [...prev];
              for (let i = next.length - 1; i >= 0; i--) {
                if (next[i]!.role === "assistant") {
                  next[i] = { ...next[i]!, content: streamed };
                  break;
                }
              }
              return next;
            });
          },
          onPayload: (res) => {
            stateRef.current = { ...stateRef.current, ...res.stateUpdates } as ConversationState;
            const actions = [...(res.suggestedActions ?? [])];
            if (res.handoff?.url) {
              actions.unshift({ id: "handoff", label: handoffLabel(res.handoff.channel, lang), type: res.handoff.channel === "webhook" ? "custom" : res.handoff.channel, url: res.handoff.url } as Action);
            }
            finish({ content: res.answer || streamed, evidence: res.evidence, actions });
          },
          onError: () => finish({ content: streamed || t(lang, "error") }),
        },
      );
      setBusy(false);
    },
    [messages, busy, lang, pageContext],
  );

  if (!open) {
    return (
      <button class="launcher" aria-label={t(lang, "openLabel")} onClick={() => setOpen(true)}>
        <span aria-hidden="true">💬</span>
        {config.assistant.launcherLabel}
      </button>
    );
  }

  return (
    <div class="panel" role="dialog" aria-label={config.assistant.name}>
      <div class="header">
        <div>
          <div class="title">{config.assistant.name}</div>
          <div class="role">{config.owner.preferredName ?? config.owner.name} · {config.owner.role}</div>
        </div>
        <button class="iconbtn" aria-label={t(lang, "close")} onClick={() => setOpen(false)}>×</button>
      </div>

      <div class="log" ref={logRef}>
        {messages.map((m, i) => (
          <MessageView key={i} m={m} lang={lang} />
        ))}
      </div>

      {messages.filter((m) => !m.pending).length <= 1 && config.quickActions.length > 0 && (
        <div class="quick">
          {config.quickActions.map((q) => (
            <button class="chip" key={q.id} onClick={() => send(q.label[lang] ?? q.label.en, q.seedIntent)}>
              {q.label[lang] ?? q.label.en}
            </button>
          ))}
        </div>
      )}

      <form
        class="composer"
        onSubmit={(e: Event) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          value={input}
          placeholder={t(lang, "placeholder")}
          onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => setInput(e.currentTarget.value)}
          aria-label={t(lang, "placeholder")}
        />
        <button type="submit" disabled={busy || !input.trim()}>{t(lang, "send")}</button>
      </form>
      <div class="foot">{t(lang, "poweredBy")}</div>
    </div>
  );
}

function MessageView({ m, lang }: { m: UiMessage; lang: Lang }): JSX.Element {
  return (
    <div class={`msg ${m.role}`}>
      <div class="bubble">
        {m.pending && !m.content ? (
          <span class="dots" aria-label={t(lang, "thinking")}><span /><span /><span /></span>
        ) : (
          m.content
        )}
      </div>
      {m.evidence && m.evidence.length > 0 && (
        <div class="evidence">
          {m.evidence.map((e) => (
            <EvidenceCard key={e.id} e={e} lang={lang} />
          ))}
        </div>
      )}
      {m.actions && m.actions.length > 0 && (
        <div class="actions">
          {m.actions.map((a, i) => (
            <ActionButton key={a.id} a={a} primary={i === 0 && a.id === "handoff"} />
          ))}
        </div>
      )}
    </div>
  );
}

function EvidenceCard({ e, lang }: { e: Evidence; lang: Lang }): JSX.Element {
  const target = e.url && isExternal(e.url) ? "_blank" : "_self";
  const body = (
    <>
      <span class="evtype">{e.type}</span>
      <div class="evtitle">{e.title}</div>
      {e.snippet && <div>{e.snippet.slice(0, 140)}</div>}
    </>
  );
  return e.url ? (
    <a class="evcard" href={e.url} target={target} rel="noopener">{body}</a>
  ) : (
    <div class="evcard" aria-label={t(lang, "evidence")}>{body}</div>
  );
}

function ActionButton({ a, primary }: { a: Action; primary: boolean }): JSX.Element {
  const href = a.url ?? "#";
  const target = a.url && isExternal(a.url) ? "_blank" : "_self";
  return (
    <a class={`action ${primary ? "primary" : ""}`} href={href} target={target} rel="noopener">
      {a.label}
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
