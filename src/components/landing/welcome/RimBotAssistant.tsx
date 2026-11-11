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
import { useCurrency } from "@/lib/currency";
import { getRimy, getSettings } from "@/lib/db";
import { answerLocally, type AnswerTable } from "@/lib/rimy/knowledge";

type Message = {
    id: number;
    role: "bot" | "user";
    text: string;
    table?: AnswerTable;
    animate?: boolean;
};

const rimy = getRimy();
const settings = getSettings();
const tts = rimy.tts;

let messageId = 0;
const nextId = () => {
    messageId += 1;
    return messageId;
};

function BotMessageContent({
    text,
    table,
    animate,
    onProgress,
}: {
    text: string;
    table?: AnswerTable;
    animate?: boolean;
    onProgress?: () => void;
}) {
    const [visibleLength, setVisibleLength] = useState(
        animate ? 0 : text.length
    );

    useEffect(() => {
        if (!animate) return;

        const step = Math.max(4, Math.ceil(text.length / 16));
        const timer = window.setInterval(() => {
            setVisibleLength((prev) => {
                const next = Math.min(text.length, prev + step);
                onProgress?.();
                if (next >= text.length) {
                    window.clearInterval(timer);
                }
                return next;
            });
        }, 16);

        return () => window.clearInterval(timer);
    }, [animate, text, onProgress]);

    const done = visibleLength >= text.length;
    const shownText = done ? text : text.slice(0, visibleLength);

    return (
        <div className="max-w-[92%] space-y-2.5 rounded-2xl bg-zinc-100 px-3.5 py-2.5 text-[13px] leading-relaxed text-zinc-700 dark:bg-white/10 dark:text-zinc-200">
            <p className="whitespace-pre-wrap">{shownText}</p>

            {done && table && table.rows.length > 0 && (
                table.headers.length === 3 && table.headers[0] === "Proyecto" ? (
                    <div className="space-y-2">
                        {table.rows.map(([name, category, status]) => (
                            <div
                                key={name}
                                className="rounded-xl border border-zinc-200/90 bg-white/90 p-3 shadow-2xs dark:border-white/10 dark:bg-black/30"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-xs font-semibold leading-snug text-zinc-900 dark:text-white">
                                        {name}
                                    </p>
                                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-lime-500/15 px-2 py-0.5 text-[10px] font-medium text-lime-700 dark:bg-lime-400/15 dark:text-lime-400">
                                        <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
                                        {status}
                                    </span>
                                </div>
                                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                    {category}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Vista cards apiladas en pantallas pequeñas (< sm) */}
                        <div className="space-y-2 sm:hidden">
                            {table.rows.map((row, rowIdx) => (
                                <div
                                    key={rowIdx}
                                    className="space-y-1 rounded-xl border border-zinc-200 bg-white/80 p-2.5 text-[11px] dark:border-white/10 dark:bg-black/25"
                                >
                                    {row.map((cell, cellIdx) => (
                                        <div
                                            key={cellIdx}
                                            className={
                                                cellIdx === 0
                                                    ? "font-semibold text-zinc-900 dark:text-white"
                                                    : "flex items-start justify-between gap-2 text-zinc-600 dark:text-zinc-300"
                                            }
                                        >
                                            {cellIdx > 0 && table.headers[cellIdx] && (
                                                <span className="shrink-0 font-mono text-[9px] uppercase tracking-wider text-zinc-400">
                                                    {table.headers[cellIdx]}:
                                                </span>
                                            )}
                                            <span className={cellIdx > 0 ? "text-right" : ""}>
                                                {cell}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Vista tabla en tablet/desktop (sm+) */}
                        <div className="hidden overflow-x-auto rounded-xl border border-zinc-200 bg-white/80 sm:block dark:border-white/10 dark:bg-black/25">
                            <table className="w-full border-collapse text-left text-[11px]">
                                <thead>
                                    <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-mono uppercase tracking-wider text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                                        {table.headers.map((header) => (
                                            <th
                                                key={header}
                                                className="px-2.5 py-1.5 font-semibold"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-200/70 dark:divide-white/10">
                                    {table.rows.map((row, rowIdx) => (
                                        <tr key={rowIdx}>
                                            {row.map((cell, cellIdx) => (
                                                <td
                                                    key={cellIdx}
                                                    className={`px-2.5 py-1.5 align-top leading-snug ${
                                                        cellIdx === 0
                                                            ? "font-semibold text-zinc-900 dark:text-white"
                                                            : "text-zinc-600 dark:text-zinc-300"
                                                    }`}
                                                >
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )
            )}
        </div>
    );
}

export default function RimBotAssistant() {
    const [open, setOpen] = useState(false);
    const [question, setQuestion] = useState("");
    const { currency } = useCurrency();
    const [suggestions, setSuggestions] = useState<string[]>(
        rimy.chat.suggestions.slice(0, 4)
    );
    const [error, setError] = useState("");
    const [messages, setMessages] = useState<Message[]>([
        {
            id: nextId(),
            role: "bot",
            text: rimy.chat.welcome,
            animate: false,
        },
    ]);

    const listRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const narration = useNarration();

    const scrollToBottom = () => {
        listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        if (!open) return;
        scrollToBottom();
        window.setTimeout(() => inputRef.current?.focus(), 100);
    }, [messages, open]);

    useEffect(() => {
        const toggle = () => setOpen((prev) => !prev);
        window.addEventListener("rimy:toggle-chat", toggle);
        return () => {
            window.removeEventListener("rimy:toggle-chat", toggle);
        };
    }, []);

    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent("rimy:chat-state", { detail: { open } })
        );
    }, [open]);

    const send = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return;

        if (trimmed.length > settings.chat.maxMessageLength) {
            setError(
                `El mensaje supera el máximo de ${settings.chat.maxMessageLength} caracteres.`
            );
            return;
        }

        stopNarration();
        setError("");

        const local = answerLocally(trimmed, currency);

        const userMessage: Message = {
            id: nextId(),
            role: "user",
            text: trimmed,
        };

        const botMessage: Message = {
            id: nextId(),
            role: "bot",
            text: local.reply,
            table: local.table,
            animate: true,
        };

        setMessages((current) => [...current, userMessage, botMessage]);
        setQuestion("");

        if (local.suggestions.length > 0) {
            setSuggestions(local.suggestions.slice(0, 4));
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        send(question);
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

    if (!open) return null;

    return (
        <div className="rimy-assistant fixed inset-x-0 bottom-0 z-[100] flex flex-col items-end sm:inset-auto sm:bottom-[158px] sm:right-6 lg:bottom-[186px]">
            <section
                className="relative flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:max-h-[min(600px,calc(100dvh-260px))] sm:w-[400px] sm:rounded-2xl dark:border-white/15 dark:bg-[#111827]"
                aria-label="Asistente Virtual RIMY"
                onWheel={(e) => e.stopPropagation()}
            >
                {/* ENCABEZADO */}
                <div className="flex shrink-0 items-center gap-3 border-b border-zinc-100 px-4 py-3 dark:border-white/10">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-cyan-100 p-1 dark:bg-cyan-950">
                        <RimyMascot
                            animation="happy"
                            interactiveEyes={false}
                            className="h-full w-full"
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-zinc-900 dark:text-white">
                            {rimy.chat.title}
                        </p>
                        <p className="flex items-center gap-1.5 text-[11px] text-lime-600 dark:text-lime-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
                            {rimy.chat.subtitle}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10 cursor-pointer"
                        aria-label="Cerrar asistente"
                    >
                        ✕
                    </button>
                </div>

                {/* CONVERSACIÓN */}
                <div
                    ref={listRef}
                    className="min-h-[140px] flex-1 space-y-3 overflow-y-auto p-3.5"
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
                            {message.role === "user" ? (
                                <p className="max-w-[86%] whitespace-pre-wrap rounded-2xl bg-cyan-600 px-3.5 py-2.5 text-[13px] leading-relaxed text-white">
                                    {message.text}
                                </p>
                            ) : (
                                <>
                                    <BotMessageContent
                                        text={message.text}
                                        table={message.table}
                                        animate={message.animate}
                                        onProgress={scrollToBottom}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            speakMessage(message.text)
                                        }
                                        className="mt-1 inline-flex items-center gap-1 px-1 font-mono text-[10px] text-zinc-400 transition hover:text-cyan-500 cursor-pointer"
                                        aria-label="Escuchar esta respuesta"
                                    >
                                        <span aria-hidden="true">🔊</span>
                                        Escuchar
                                    </button>
                                </>
                            )}
                        </div>
                    ))}

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
                    <div className="flex shrink-0 items-center gap-2 border-t border-zinc-100 px-3 py-1.5 font-mono text-[10px] text-zinc-500 dark:border-white/10 dark:text-zinc-400">
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
                                    className="rounded-md border border-zinc-200 px-2 py-1 hover:border-cyan-400 dark:border-white/10 cursor-pointer"
                                >
                                    {speaking ? "Pausar" : "Continuar"}
                                </button>
                                <button
                                    type="button"
                                    onClick={stopNarration}
                                    className="rounded-md border border-zinc-200 px-2 py-1 hover:border-red-400 dark:border-white/10 cursor-pointer"
                                >
                                    Detener
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* SUGERENCIAS FAQ */}
                {suggestions.length > 0 && (
                    <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-zinc-100 px-3 pt-2 pb-1 dark:border-white/10">
                        {suggestions.map((suggestion) => (
                            <button
                                key={suggestion}
                                type="button"
                                onClick={() => send(suggestion)}
                                className="rounded-full border border-zinc-200 px-2.5 py-1 text-[10px] text-zinc-600 transition hover:border-cyan-400 hover:text-cyan-600 dark:border-white/10 dark:text-zinc-300 dark:hover:text-cyan-400 cursor-pointer"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                )}

                {/* FORMULARIO */}
                <form
                    onSubmit={handleSubmit}
                    className="flex shrink-0 gap-2 border-t border-zinc-100 p-2.5 dark:border-white/10"
                >
                    <input
                        ref={inputRef}
                        value={question}
                        onChange={(event) => setQuestion(event.target.value)}
                        placeholder={rimy.chat.inputPlaceholder}
                        maxLength={settings.chat.maxMessageLength}
                        className="min-w-0 flex-1 rounded-xl bg-zinc-100 px-3 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-cyan-500 dark:bg-white/5 dark:text-white"
                        aria-label="Escribe tu pregunta sobre RimCode"
                    />

                    <button
                        type="submit"
                        disabled={!question.trim()}
                        className="rounded-xl bg-cyan-600 px-4 text-white transition hover:bg-cyan-500 disabled:opacity-40 cursor-pointer"
                        aria-label="Enviar mensaje"
                    >
                        ↑
                    </button>
                </form>
            </section>

            {/* Indicador visual apuntando hacia la cabeza de RIMY */}
            <div
                aria-hidden="true"
                className="mr-10 -mt-1.5 hidden h-3 w-3 rotate-45 border-r border-b border-zinc-200 bg-white sm:block dark:border-white/15 dark:bg-[#111827] lg:mr-14"
            />
        </div>
    );
}
