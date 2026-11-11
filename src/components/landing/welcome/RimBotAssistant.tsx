"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import RimyMascot from "@/components/rimy/RimyMascot";
import { useNarration } from "@/components/rimy/useNarration";
import {
    pauseNarration,
    resumeNarration,
    speak,
    stopNarration,
} from "@/lib/rimy/narration";
import { getRimy, getSettings } from "@/lib/db";

type Message = {
    id: number;
    role: "bot" | "user";
    text: string;
    mode?: "local" | "ai";
};

type ChatResponse = {
    ok?: boolean;
    mode?: "local" | "ai";
    modeLabel?: string;
    reply?: string;
    suggestions?: string[];
    error?: string;
    detail?: string;
    note?: string;
    missing?: string[];
};

const rimy = getRimy();
const settings = getSettings();
const tts = rimy.tts;

let messageId = 0;
const nextId = () => {
    messageId += 1;
    return messageId;
};

export default function RimBotAssistant() {
    const [open, setOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const [thinking, setThinking] = useState(false);
    const [mode, setMode] = useState<"local" | "ai" | null>(null);
    const [modeLabel, setModeLabel] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>(
        rimy.chat.suggestions
    );
    const [error, setError] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: nextId(),
            role: "bot",
            text: rimy.chat.welcome,
        },
    ]);

    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const narration = useNarration();

    useEffect(() => {
        if (!open) return;
        listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [messages, thinking, open]);

    useEffect(() => {
        if (open) {
            window.setTimeout(() => inputRef.current?.focus(), 120);
        }
    }, [open]);

    useEffect(() => {
        const toggle = () => setOpen((prev) => !prev);
        window.addEventListener("rimy:toggle-chat", toggle);
        return () => window.removeEventListener("rimy:toggle-chat", toggle);
    }, []);

    const send = async (value: string, forceLocal = false) => {
        const trimmed = value.trim();
        if (!trimmed || thinking) return;

        if (trimmed.length > settings.chat.maxMessageLength) {
            setError(
                `El mensaje supera el máximo de ${settings.chat.maxMessageLength} caracteres.`
            );
            return;
        }

        stopNarration();
        setError("");

        const userMessage: Message = {
            id: nextId(),
            role: "user",
            text: trimmed,
        };

        const history = messages
            .slice(-settings.chat.historyLimit)
            .map((message) => ({
                role: message.role === "bot" ? "assistant" : "user",
                content: message.text,
            }));

        setMessages((current) => [...current, userMessage]);
        setQuestion("");
        setThinking(true);

        try {
            const response = await fetch("/api/rimy/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: trimmed,
                    history,
                    currency: "PEN",
                    ...(forceLocal ? { forceLocal: true } : {}),
                }),
            });

            const data = (await response.json().catch(() => ({}))) as ChatResponse;

            if (!response.ok || data.ok !== true || !data.reply) {
                setError(
                    data.error ||
                        "No pude procesar tu mensaje. Inténtalo de nuevo."
                );
                setThinking(false);
                return;
            }

            setMessages((current) => [
                ...current,
                {
                    id: nextId(),
                    role: "bot",
                    text: data.reply as string,
                    mode: data.mode,
                },
            ]);

            if (data.mode) setMode(data.mode);
            if (data.modeLabel) setModeLabel(data.modeLabel);
            if (data.suggestions?.length) {
                setSuggestions(data.suggestions.slice(0, 4));
            }
        } catch {
            setError(
                "No hay conexión con el servidor de RimCode. Revisa tu red e inténtalo de nuevo."
            );
        } finally {
            setThinking(false);
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void send(question);
    };

    const speakMessage = (text: string) => {
        speak(text, {
            lang: tts.lang,
            rate: tts.rate,
            pitch: tts.pitch,
            volume: tts.volume,
            sentencePauseMs: tts.sentencePauseMs,
        });
    };

    const speaking = narration.status === "speaking";
    const paused = narration.status === "paused";
    const unsupported = narration.status === "unsupported";

    return (
        <div className="rimy-assistant fixed bottom-5 right-5 z-[100] flex flex-col items-end gap-3">
            {open && (
                <section
                    className="flex h-[520px] max-h-[calc(100dvh-120px)] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111827]"
                    aria-label="Chat con RIMY"
                    onWheel={(e) => e.stopPropagation()}
                >
                    {/* ENCABEZADO */}
                    <div className="flex items-center gap-3 border-b border-zinc-100 p-4 dark:border-white/10">
                        <div className="h-12 w-12 overflow-hidden rounded-full bg-cyan-100 p-1 dark:bg-cyan-950">
                            <RimyMascot
                                animation={thinking ? "thinking" : "happy"}
                                interactiveEyes={false}
                                className="h-full w-full"
                            />
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="font-bold text-zinc-900 dark:text-white">
                                {rimy.chat.title}
                            </p>
                            <p className="flex items-center gap-1.5 text-xs text-lime-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
                                {mode ? modeLabel : rimy.chat.subtitle}
                            </p>
                        </div>

                        <button
                            onClick={() => setOpen(false)}
                            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
                            aria-label="Cerrar asistente"
                        >
                            ✕
                        </button>
                    </div>

                    {/* MODO + ALCANCE */}
                    <div className="border-b border-zinc-100 bg-zinc-50 px-4 py-2 text-[10px] leading-relaxed text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                        <p>{rimy.chat.scopeNotice}</p>
                        {mode === "local" && (
                            <p className="mt-1 font-mono text-[9px] text-amber-600 dark:text-amber-400">
                                ◐ {rimy.chat.localModeLabel}: información de
                                db/*.json, sin proveedor de IA conectado.
                            </p>
                        )}
                        {mode === "ai" && (
                            <p className="mt-1 font-mono text-[9px] text-lime-600 dark:text-lime-400">
                                ● {rimy.chat.aiModeLabel}
                            </p>
                        )}
                    </div>

                    {/* CONVERSACIÓN */}
                    <div
                        ref={listRef}
                        className="flex-1 space-y-3 overflow-y-auto p-4"
                        style={{ overscrollBehavior: "contain" }}
                        onWheel={(e) => e.stopPropagation()}
                        aria-live="polite"
                    >
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex flex-col ${
                                    message.role === "user"
                                        ? "items-end"
                                        : "items-start"
                                }`}
                            >
                                <p
                                    className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                                        message.role === "user"
                                            ? "bg-cyan-600 text-white"
                                            : "bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200"
                                    }`}
                                >
                                    {message.text}
                                </p>

                                {message.role === "bot" && (
                                    <button
                                        type="button"
                                        onClick={() => speakMessage(message.text)}
                                        className="mt-1 inline-flex items-center gap-1 px-1 text-[10px] font-mono text-zinc-400 transition hover:text-cyan-500"
                                        aria-label="Escuchar esta respuesta"
                                    >
                                        <span aria-hidden="true">🔊</span>
                                        Escuchar
                                    </button>
                                )}
                            </div>
                        ))}

                        {thinking && (
                            <div className="flex items-start gap-2">
                                <div className="h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0">
                                    <span className="text-[10px]">🤖</span>
                                </div>
                                <div className="max-w-[88%] rounded-2xl px-4 py-3 bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0ms]" />
                                        <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:150ms]" />
                                        <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:300ms]" />
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-1">{rimy.chat.thinkingLabel}</p>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div
                                role="alert"
                                className="rounded-xl border border-red-200 bg-red-50 p-3 text-[11px] leading-relaxed text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                            >
                                {error}
                            </div>
                        )}
                    </div>

                    {/* CONTROLES DE VOZ */}
                    {(speaking || paused || unsupported) && (
                        <div className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2 text-[10px] font-mono text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                            <span className="flex-1">
                                {speaking && "🔊 Narrando respuesta..."}
                                {paused && "⏸ Narración en pausa"}
                                {unsupported &&
                                    "Este navegador no admite voz. Puedes leer la respuesta."}
                            </span>
                            {(speaking || paused) && (
                                <>
                                    <button
                                        type="button"
                                        onClick={
                                            speaking
                                                ? pauseNarration
                                                : resumeNarration
                                        }
                                        className="rounded-md border border-zinc-200 px-2 py-1 hover:border-cyan-400 dark:border-white/10"
                                    >
                                        {speaking ? "Pausar" : "Continuar"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={stopNarration}
                                        className="rounded-md border border-zinc-200 px-2 py-1 hover:border-red-400 dark:border-white/10"
                                    >
                                        Detener
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* SUGERENCIAS */}
                    {suggestions.length > 0 && !thinking && (
                        <div className="flex flex-wrap gap-1.5 border-t border-zinc-100 px-3 pt-2 dark:border-white/10">
                            {suggestions.map((suggestion) => (
                                <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => void send(suggestion, true)}
                                    className="rounded-full border border-zinc-200 px-2.5 py-1 text-[10px] text-zinc-500 transition hover:border-cyan-400 hover:text-cyan-600 dark:border-white/10 dark:text-zinc-400"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* FORMULARIO */}
                    <form
                        onSubmit={handleSubmit}
                        className="flex gap-2 border-t border-zinc-100 p-3 dark:border-white/10"
                    >
                        <input
                            ref={inputRef}
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            placeholder={rimy.chat.inputPlaceholder}
                            maxLength={settings.chat.maxMessageLength}
                            className="min-w-0 flex-1 rounded-xl bg-zinc-100 px-3 py-3 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-white/5 dark:text-white"
                            aria-label="Escribe tu pregunta sobre RimCode"
                        />

                        <button
                            type="submit"
                            disabled={!question.trim() || thinking}
                            className="rounded-xl bg-cyan-600 px-4 text-white transition hover:bg-cyan-500 disabled:opacity-40"
                            aria-label="Enviar mensaje"
                        >
                            ↑
                        </button>
                    </form>
                </section>
            )}

        </div>
    );
}
