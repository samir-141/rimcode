"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RIMY_DURATION, RIMY_PRIORITY } from "../rimy-config";
import type {
    RimyAnimation,
    RimyMessage,
    RimyRequestOptions,
    RimyTone,
} from "../types";

type UseRimyStateResult = {
    animation: RimyAnimation;
    message: RimyMessage | null;
    request: (animation: RimyAnimation, options?: RimyRequestOptions) => boolean;
    showMessage: (text: string, tone?: RimyTone, duration?: number) => void;
    dismissMessage: () => void;
    reset: () => void;
};

/**
 * Máquina de estados centralizada de RIMY.
 *
 * Reglas:
 * - Una animación con prioridad baja nunca interrumpe a una con prioridad alta.
 * - Mientras dura el saludo, RIMY no puede ser interrumpido (requisito de UX).
 * - Cada estado se libera automáticamente y vuelve a `idle`.
 */
export function useRimyState(): UseRimyStateResult {
    const [animation, setAnimation] = useState<RimyAnimation>("idle");
    const [message, setMessage] = useState<RimyMessage | null>(null);

    const animationRef = useRef<RimyAnimation>("idle");
    const lockUntilRef = useRef(0);
    const releaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const messageIdRef = useRef(0);
    const mountedRef = useRef(true);

    const clearReleaseTimer = useCallback(() => {
        if (releaseTimerRef.current) {
            clearTimeout(releaseTimerRef.current);
            releaseTimerRef.current = null;
        }
    }, []);

    const goIdle = useCallback(() => {
        animationRef.current = "idle";
        lockUntilRef.current = 0;
        setAnimation("idle");
    }, []);

    const dismissMessage = useCallback(() => {
        if (messageTimerRef.current) {
            clearTimeout(messageTimerRef.current);
            messageTimerRef.current = null;
        }
        setMessage(null);
    }, []);

    const showMessage = useCallback(
        (text: string, tone: RimyTone = "neutral", duration = 4200) => {
            messageIdRef.current += 1;
            const id = messageIdRef.current;

            setMessage({ id, text, tone });

            if (messageTimerRef.current) {
                clearTimeout(messageTimerRef.current);
            }

            messageTimerRef.current = setTimeout(() => {
                setMessage((current) => (current?.id === id ? null : current));
            }, duration);
        },
        []
    );

    const request = useCallback(
        (next: RimyAnimation, options: RimyRequestOptions = {}) => {
            if (!mountedRef.current) return false;

            const current = animationRef.current;
            const now = performance.now();
            const isLocked = now < lockUntilRef.current;

            // Una animación de menor/igual prioridad no puede romper el bloqueo.
            if (isLocked && RIMY_PRIORITY[next] <= RIMY_PRIORITY[current]) {
                return false;
            }

            // El saludo completo es sagrado: se muestra una sola vez.
            if (current === "greeting" && next !== "greeting") {
                return false;
            }

            const duration =
                options.duration ?? RIMY_DURATION[next] ?? 0;

            clearReleaseTimer();
            animationRef.current = next;
            setAnimation(next);

            if (duration > 0) {
                lockUntilRef.current = now + duration;
                releaseTimerRef.current = setTimeout(() => {
                    if (animationRef.current === next) {
                        goIdle();
                    }
                }, duration);
            } else {
                lockUntilRef.current = 0;
            }

            if (options.message) {
                showMessage(
                    options.message,
                    options.tone ?? "neutral",
                    options.messageDuration ??
                        Math.max(3200, Math.min(duration, 6000))
                );
            }

            return true;
        },
        [clearReleaseTimer, goIdle, showMessage]
    );

    const reset = useCallback(() => {
        clearReleaseTimer();
        dismissMessage();
        animationRef.current = "idle";
        lockUntilRef.current = 0;
        setAnimation("idle");
    }, [clearReleaseTimer, dismissMessage]);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            clearReleaseTimer();
            if (messageTimerRef.current) {
                clearTimeout(messageTimerRef.current);
            }
        };
    }, [clearReleaseTimer]);

    return {
        animation,
        message,
        request,
        showMessage,
        dismissMessage,
        reset,
    };
}
