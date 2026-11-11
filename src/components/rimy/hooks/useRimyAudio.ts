"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
    RIMY_GREETING_AUDIO_TEXT,
    RIMY_MUTED_KEY,
    RIMY_WELCOME_AUDIO,
} from "../rimy-config";
import type { RimyAudioState } from "../types";

type UseRimyAudioResult = RimyAudioState & {
    playWelcome: (force?: boolean) => Promise<boolean>;
    enable: () => Promise<boolean>;
    toggle: () => void;
    stop: () => void;
};

function pickSpanishVoice(): SpeechSynthesisVoice | null {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return null;
    }

    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const spanish = voices.filter((voice) =>
        voice.lang.toLowerCase().startsWith("es")
    );

    const preferredNames = [
        "helena",
        "sabina",
        "monica",
        "mónica",
        "paulina",
        "laura",
        "elvira",
        "google",
        "natural",
    ];

    for (const name of preferredNames) {
        const match = spanish.find((voice) =>
            voice.name.toLowerCase().includes(name)
        );
        if (match) return match;
    }

    return spanish[0] ?? null;
}

/**
 * Audio de RIMY.
 *
 * Se intenta primero el audio pregrabado (voz Helena, es-ES). Si el navegador
 * bloquea el autoplay se expone el estado `blocked` para que la UI muestre un
 * botón de activación manual. Web Speech API queda como fallback.
 */
export function useRimyAudio(): UseRimyAudioResult {
    const [muted, setMuted] = useState(false);
    const [blocked, setBlocked] = useState(false);
    const [speaking, setSpeaking] = useState(false);
    const [supported, setSupported] = useState(true);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const mutedRef = useRef(false);
    const stoppedRef = useRef(false);
    const ttsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearTtsTimer = useCallback(() => {
        if (ttsTimerRef.current) {
            clearTimeout(ttsTimerRef.current);
            ttsTimerRef.current = null;
        }
    }, []);

    const stop = useCallback(() => {
        stoppedRef.current = true;
        clearTtsTimer();

        if (audioRef.current) {
            audioRef.current.pause();
            try {
                audioRef.current.currentTime = 0;
            } catch {
                // Algunos navegadores no permiten resetear antes de cargar.
            }
        }

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        setSpeaking(false);
    }, [clearTtsTimer]);

    useEffect(() => {
        let mutedTimer: ReturnType<typeof setTimeout> | null = null;

        try {
            const storedMuted = localStorage.getItem(RIMY_MUTED_KEY) === "1";
            mutedRef.current = storedMuted;

            if (storedMuted) {
                // Diferido para evitar un render en cascada dentro del efecto.
                mutedTimer = setTimeout(() => setMuted(true), 0);
            }
        } catch {
            // localStorage puede estar deshabilitado; seguimos con los valores por defecto.
        }

        const audio = new Audio(RIMY_WELCOME_AUDIO);
        audio.preload = "auto";
        audio.volume = 0.92;

        const handleEnded = () => setSpeaking(false);
        const handleError = () => setSupported(false);

        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);

        audioRef.current = audio;

        return () => {
            if (mutedTimer) clearTimeout(mutedTimer);
            clearTtsTimer();
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("error", handleError);
            audio.pause();
            audioRef.current = null;

            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, [clearTtsTimer]);

    const speakFallback = useCallback(async (): Promise<boolean> => {
        if (
            typeof window === "undefined" ||
            !("speechSynthesis" in window) ||
            typeof SpeechSynthesisUtterance === "undefined"
        ) {
            setSupported(false);
            setBlocked(true);
            return false;
        }

        window.speechSynthesis.cancel();
        stoppedRef.current = false;

        const utterance = new SpeechSynthesisUtterance(
            RIMY_GREETING_AUDIO_TEXT
        );
        utterance.lang = "es-ES";
        utterance.rate = 1.02;
        utterance.pitch = 1.15;
        utterance.volume = 1;

        const voice = pickSpanishVoice();
        if (voice) utterance.voice = voice;

        return new Promise<boolean>((resolve) => {
            let started = false;

            const fail = () => {
                clearTtsTimer();
                if (!started) {
                    setSpeaking(false);
                    setBlocked(true);
                    setSupported(false);
                    resolve(false);
                }
            };

            utterance.onstart = () => {
                started = true;
                clearTtsTimer();
                setBlocked(false);
                setSpeaking(true);
            };

            utterance.onend = () => {
                clearTtsTimer();
                setSpeaking(false);
                resolve(true);
            };

            utterance.onerror = () => {
                clearTtsTimer();
                setSpeaking(false);
                if (!started) {
                    setBlocked(true);
                    setSupported(false);
                    resolve(false);
                }
            };

            ttsTimerRef.current = setTimeout(fail, 1400);

            try {
                window.speechSynthesis.speak(utterance);
            } catch {
                fail();
            }
        });
    }, [clearTtsTimer]);

    const playWelcome = useCallback(
        async (force = false): Promise<boolean> => {
            if (mutedRef.current && !force) return false;

            stoppedRef.current = false;
            clearTtsTimer();

            if ("speechSynthesis" in window) {
                window.speechSynthesis.cancel();
            }

            const audio = audioRef.current;
            if (!audio) {
                return speakFallback();
            }

            setSpeaking(true);

            try {
                audio.currentTime = 0;
                await audio.play();
                setBlocked(false);
                setSupported(true);
                return true;
            } catch (error) {
                setSpeaking(false);

                const name =
                    error instanceof DOMException ? error.name : "UnknownError";

                // NotAllowedError = política de autoplay. Se resolverá con un gesto.
                if (name === "NotAllowedError") {
                    setBlocked(true);
                    return false;
                }

                return speakFallback();
            }
        },
        [clearTtsTimer, speakFallback]
    );

    const enable = useCallback(async () => {
        mutedRef.current = false;
        setMuted(false);

        try {
            localStorage.setItem(RIMY_MUTED_KEY, "0");
        } catch {
            // Sin persistencia disponible.
        }

        return playWelcome(true);
    }, [playWelcome]);

    const toggle = useCallback(() => {
        if (blocked || mutedRef.current) {
            void enable();
            return;
        }

        if (speaking) {
            stop();
        }

        mutedRef.current = true;
        setMuted(true);

        try {
            localStorage.setItem(RIMY_MUTED_KEY, "1");
        } catch {
            // Sin persistencia disponible.
        }
    }, [blocked, enable, speaking, stop]);

    return {
        muted,
        blocked,
        speaking,
        supported,
        playWelcome,
        enable,
        toggle,
        stop,
    };
}
