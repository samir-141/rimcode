"use client";

import { usePathname } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { useNarration } from "@/components/rimy/useNarration";
import { RIMY_CHAT_SLOT_ID } from "@/components/rimy/rimy-config";
import { useCurrency } from "@/lib/currency";
import { getRimy, getSettings } from "@/lib/db";
import { recordRimyAction } from "@/lib/rimy/client-events";
import type { ChatAction, ChatState, RecentTurn } from "@/lib/rimy/intent";
import { pauseNarration, resumeNarration, setNarrationVolume, speakRimy, stopNarration } from "@/lib/rimy/narration";
import type { AnswerTable } from "@/lib/rimy/knowledge";
import type { ConversationContext } from "@/lib/rimy/conversation";
import { QUOTE_SCENARIO_KEY, type LandingScenario } from "@/lib/quote";
import Link from "next/link";

type Message = {
    id: number;
    role: "bot" | "user";
    text: string;
    table?: AnswerTable;
    voiceGrant?: string;
    scenario?: LandingScenario;
    actions?: ChatAction[];
    turnGrant?: string;
};

type ChatResult = {
    ok: boolean;
    reply?: string;
    table?: AnswerTable;
    voiceGrant?: string;
    suggestions?: string[];
    context?: ConversationContext;
    estado?: ChatState;
    actions?: ChatAction[];
    turnGrant?: string;
    action?: "quote";
    error?: string;
};

type Recognition = {
    lang: string;
    onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    abort: () => void;
};

const { chat } = getRimy();
const limits = getSettings().chat;
const smallButton = "inline-flex min-h-9 items-center rounded-md border border-[var(--header-border)] px-2.5 py-1 text-xs hover:border-[var(--accent)]";
const initialMessage: Message = { id: 0, role: "bot", text: chat.welcome };

function ChatTable({ table }: { table: AnswerTable }) {
    return (
        <div className="mt-2 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
                <thead>
                    <tr>{table.headers.map((header) => <th key={header} scope="col" className="border-b border-[var(--header-border)] p-2">{header}</th>)}</tr>
                </thead>
                <tbody>
                    {table.rows.map((row, index) => (
                        <tr key={index}>
                            {row.map((cell, column) => (
                                <td key={column} className="border-b border-[var(--header-border)] p-2 [overflow-wrap:anywhere]">{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function RimBotAssistant() {
    const pathname = usePathname();
    const { currency } = useCurrency();
    const narration = useNarration();
    const [open, setOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [suggestions, setSuggestions] = useState(chat.suggestions.slice(0, 4));
    const [messages, setMessages] = useState<Message[]>([initialMessage]);
    const [error, setError] = useState("");
    const [pending, setPending] = useState(false);
    const [listening, setListening] = useState(false);
    const [autoVoice, setAutoVoice] = useState(false);
    const [volume, setVolume] = useState(100);
    const [explaining, setExplaining] = useState(false);

    const nextId = useRef(1);
    const conversation = useRef<ConversationContext | undefined>(undefined);
    const session = useRef<ChatState>({ ya_se_presento: true });
    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const openerRef = useRef<HTMLElement | null>(null);
    const activeRequest = useRef<AbortController | null>(null);
    const recognition = useRef<Recognition | null>(null);
    const isOpen = useRef(false);
    const voiceEnabled = useRef(false);
    const speaking = narration.status === "speaking";
    const paused = narration.status === "paused";
    const loadingAudio = narration.status === "loading";
    const voiceError = narration.status === "error" || narration.status === "unsupported";
    const status = !open ? "idle" : speaking ? "speaking" : listening ? "listening" :
        pending ? "searching" : loadingAudio ? "thinking" : error ? (error.startsWith("Sin conexión") ? "offline" : "error") :
        explaining ? "explaining" : !autoVoice ? "muted" : "idle";

    useEffect(() => {
        function toggle() {
            if (!isOpen.current) openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            isOpen.current = !isOpen.current;
            setOpen(isOpen.current);
            if (!isOpen.current) {
                recognition.current?.abort();
                stopNarration();
            }
        }
        window.addEventListener("rimy:toggle-chat", toggle);
        return () => window.removeEventListener("rimy:toggle-chat", toggle);
    }, []);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent("rimy:chat-state", { detail: { open } }));
        if (open) inputRef.current?.focus({ preventScroll: true });
    }, [open]);

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }, [open, messages, pending]);

    useEffect(() => {
        window.dispatchEvent(new CustomEvent("rimy:chat-phase", { detail: status }));
        if (!explaining) return;
        const timer = window.setTimeout(() => setExplaining(false), 1700);
        return () => clearTimeout(timer);
    }, [status, explaining]);

    useEffect(() => () => {
        activeRequest.current?.abort();
        recognition.current?.abort();
        stopNarration();
    }, [pathname]);

    function minimize() {
        isOpen.current = false;
        setOpen(false);
        recognition.current?.abort();
        stopNarration();
        openerRef.current?.focus({ preventScroll: true });
    }

    function readMessage(message: Message, useDevice = false) {
        const reference = message.text === chat.welcome ? { greeting: true as const } :
            message.voiceGrant ? { grant: message.voiceGrant } : undefined;
        speakRimy(message.text, reference, useDevice);
    }

    async function send(value: string) {
        const message = value.trim();
        if (!message || activeRequest.current) return;
        if (message.length < limits.minMessageLength || message.length > limits.maxMessageLength) {
            setError(`Escribe entre ${limits.minMessageLength} y ${limits.maxMessageLength} caracteres.`);
            return;
        }

        stopNarration();
        recognition.current?.abort();
        const controller = new AbortController();
        activeRequest.current = controller;
        setPending(true);
        setExplaining(false);
        setError("");
        const id = nextId.current++;
        setMessages((previous) => [...previous.slice(-29), { id, text: message, role: "user" }]);
        setQuestion("");

        try {
            const history: RecentTurn[] = messages.slice(-4).map(({ role, text }) => ({
                rol: role === "bot" ? "asistente" : "usuario", contenido: text.slice(0, 600),
            }));
            const response = await fetch("/api/rimy/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message, currency, context: conversation.current, estado: session.current, historial_reciente: history }),
                signal: controller.signal,
            });
            const result = await response.json() as ChatResult;
            if (!response.ok || !result.ok || typeof result.reply !== "string") {
                setError(result.error || "Rimy está ocupado. Intenta de nuevo.");
                setQuestion((current) => current || message);
                return;
            }
            const reply: Message = {
                id: nextId.current++, role: "bot", text: result.reply,
                table: result.table, voiceGrant: result.voiceGrant,
                actions: result.actions, turnGrant: result.turnGrant,
                scenario: result.action === "quote" && result.context?.topic === "landing" ? result.context : undefined,
            };
            conversation.current = result.context;
            if (result.estado) session.current = result.estado;
            setMessages((previous) => [...previous, reply]);
            if (result.suggestions?.length) setSuggestions(result.suggestions.slice(0, 4));
            setExplaining(true);
            if (voiceEnabled.current && isOpen.current) readMessage(reply);
        } catch {
            if (!controller.signal.aborted) {
                setError("Sin conexión con Rimy. Vuelve a intentarlo en un momento.");
                setQuestion((current) => current || message);
            }
        } finally {
            if (activeRequest.current === controller) {
                activeRequest.current = null;
                setPending(false);
            }
        }
    }

    function toggleMicrophone() {
        if (recognition.current) {
            recognition.current.abort();
            return;
        }

        const browser = window as Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
        const Recognizer = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
        if (!Recognizer) {
            setError("El dictado no está disponible en este navegador.");
            return;
        }

        stopNarration();
        setError("");
        const instance = new Recognizer();
        recognition.current = instance;
        instance.lang = "es-PE";
        instance.onresult = (event) => setQuestion(event.results[0][0].transcript.slice(0, limits.maxMessageLength));
        instance.onerror = (event) => {
            if (event.error !== "aborted") setError("El navegador no pudo usar el micrófono. Puedes escribir tu pregunta.");
        };
        instance.onend = () => {
            recognition.current = null;
            setListening(false);
        };
        try {
            instance.start();
            setListening(true);
        } catch {
            recognition.current = null;
            setError("No se pudo iniciar el micrófono.");
        }
    }

    function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        void send(question);
    }

    function openAction(action: ChatAction, source: Message) {
        recordRimyAction(source.turnGrant, action.id);
        if ("message" in action) {
            void send(action.message);
            return;
        }
        if (action.id === "simulador" && source.scenario) {
            try { sessionStorage.setItem(QUOTE_SCENARIO_KEY, JSON.stringify(source.scenario)); } catch { /* El evento cubre la landing abierta. */ }
            window.dispatchEvent(new CustomEvent(QUOTE_SCENARIO_KEY, { detail: source.scenario }));
        }
        if (action.id === "simulador" || action.id === "formulario") minimize();
    }

    if (!open) return null;

    return (
        <section id="rimy-assistant" aria-labelledby="rimy-chat-title" onKeyDown={(event) => {
            if (event.key === "Escape") minimize();
        }} className="rimy-chat-panel fixed inset-x-0 bottom-0 z-[100] flex max-h-[calc(100dvh-72px)] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--header-border)] bg-[var(--background)] shadow-2xl sm:inset-x-auto sm:bottom-16 sm:right-4 sm:max-h-[min(640px,calc(100dvh-150px))] sm:w-[420px] sm:rounded-2xl">
            <header className="flex shrink-0 items-center gap-2 border-b border-[var(--header-border)] px-3 py-1">
                <div id={RIMY_CHAT_SLOT_ID} aria-hidden="true" className="size-12 shrink-0 sm:size-14" />
                <div className="min-w-0 flex-1">
                    <h2 id="rimy-chat-title" className="font-bold">{chat.title}</h2>
                    <p className="text-xs text-[var(--header-muted)]">{chat.subtitle}</p>
                </div>
                <button type="button" onClick={minimize} className={`${smallButton} shrink-0`}>Minimizar</button>
            </header>
            <div ref={listRef} role="log" aria-label="Conversación con Rimy" aria-relevant="additions" tabIndex={0}
                className="min-h-12 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3">
                {messages.map((message) => (
                    <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex flex-col items-start"}>
                        <div className={`min-w-0 max-w-[96%] rounded-xl p-2.5 text-sm leading-relaxed [overflow-wrap:anywhere] ${message.role === "user" ?
                            "bg-cyan-800 text-white dark:bg-cyan-900" : "bg-black/5 dark:bg-white/10"}`}>
                            <p className="whitespace-pre-wrap">{message.text}</p>
                            {message.table && <ChatTable table={message.table} />}
                            {!!message.actions?.length && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {message.actions.map((action) => "message" in action ? (
                                        <button key={action.id} type="button" disabled={pending} className={`${smallButton} font-semibold`}
                                            onClick={() => openAction(action, message)}>{action.label}</button>
                                    ) : (
                                        <Link key={action.id} href={action.href} onClick={() => openAction(action, message)}
                                            target={action.id === "whatsapp" ? "_blank" : undefined} rel={action.id === "whatsapp" ? "noopener noreferrer" : undefined}
                                            className={`${smallButton} font-semibold text-[var(--accent)]`}>{action.label}</Link>
                                    ))}
                                </div>
                            )}
                        </div>
                        {message.role === "bot" && (
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => readMessage(message)}
                                    className="min-h-9 px-2 text-xs font-semibold text-[var(--header-muted)] hover:text-[var(--header-text)]">
                                    {narration.text === message.text && !voiceError ? "Volver a escuchar" : "Escuchar"}
                                </button>
                                {(message.voiceGrant || message.text === chat.welcome) && voiceError && narration.text === message.text && narration.source === "natural" && (
                                    <button type="button" onClick={() => readMessage(message, true)} className={smallButton}>Cambiar a voz del dispositivo</button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
                {pending && <p className="text-sm text-[var(--header-muted)]">Buscando información de RimCode…</p>}
            </div>
            {error && <p role="alert" className="px-3 py-1 text-sm text-red-700 dark:text-red-300">{error}</p>}
            {(speaking || paused || loadingAudio || voiceError) && (
                <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-[var(--header-border)] px-3 py-1 text-xs">
                    <p role="status" className="flex-1 text-[var(--header-muted)]">
                        {voiceError ? narration.error : loadingAudio ? "Preparando voz…" : paused ? "Voz en pausa" : "Rimy está hablando"}
                    </p>
                    {(speaking || paused) && <button type="button" className={smallButton}
                        onClick={speaking ? pauseNarration : resumeNarration}>{speaking ? "Pausar" : "Continuar"}</button>}
                    {!voiceError && <button type="button" className={smallButton} onClick={stopNarration}>Detener</button>}
                </div>
            )}
            <details className="shrink-0 border-t border-[var(--header-border)] px-3 text-xs">
                <summary className="flex min-h-9 cursor-pointer items-center font-semibold">Preguntas sugeridas y voz</summary>
                <div className="max-h-[26dvh] space-y-2 overflow-y-auto overscroll-contain pb-2">
                    <div className="flex flex-wrap gap-1">
                        {suggestions.map((suggestion) => <button type="button" key={suggestion} disabled={pending}
                            onClick={() => void send(suggestion)} className={smallButton}>{suggestion}</button>)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <label className="flex items-center gap-2">
                            <input type="checkbox" checked={autoVoice} onChange={(event) => {
                                voiceEnabled.current = event.target.checked;
                                setAutoVoice(event.target.checked);
                                if (!event.target.checked) stopNarration();
                            }} /> Reproducir respuestas
                        </label>
                        <label className="flex items-center gap-2">
                            Volumen
                            <input type="range" min={0} max={100} value={volume} className="w-20" onChange={(event) => {
                                const value = event.target.valueAsNumber;
                                setVolume(value);
                                setNarrationVolume(value / 100);
                            }} />
                        </label>
                        <button type="button" onClick={toggleMicrophone} className={smallButton}>
                            {listening ? "Detener dictado" : "Dictar con micrófono"}
                        </button>
                    </div>
                    <p className="text-[var(--header-muted)]">El navegador puede procesar el audio del dictado. RimCode recibe el texto cuando lo envías y puede registrar consultas y uso de botones para mejorar el chat. Evita incluir datos personales.</p>
                </div>
            </details>
            <form onSubmit={onSubmit} className="flex shrink-0 gap-2 border-t border-[var(--header-border)] p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
                <input ref={inputRef} value={question} onChange={(event) => setQuestion(event.target.value)}
                    placeholder={chat.inputPlaceholder} maxLength={limits.maxMessageLength}
                    className="min-w-0 flex-1 rounded-xl bg-black/5 px-3 py-2.5 text-base text-[var(--foreground)] dark:bg-white/10"
                    aria-label="Escribe tu pregunta sobre RimCode" />
                <button type="submit" disabled={!question.trim() || pending}
                    className="min-h-11 rounded-xl bg-cyan-800 px-3 text-sm font-semibold text-white hover:bg-cyan-900 disabled:opacity-50">
                    Enviar
                </button>
            </form>
        </section>
    );
}
