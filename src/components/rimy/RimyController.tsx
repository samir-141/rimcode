"use client";

import dynamic from "next/dynamic";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from "react";

import RimyAudio from "./RimyAudio";
import RimyFloating from "./RimyFloating";
import RimyMascot from "./RimyMascot";
import RimySpeechBubble from "./RimySpeechBubble";
import { useNarration } from "./useNarration";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import { useRimyAudio } from "./hooks/useRimyAudio";
import { useRimyState } from "./hooks/useRimyState";
import { useScrollBehavior } from "./hooks/useScrollBehavior";
import {
    RIMY_GREETING_KEY,
    RIMY_GREETING_TEXT,
    RIMY_MESSAGES,
} from "./rimy-config";
import type { RimyAnimation, RimyMode, RimyTone } from "./types";
import styles from "./RimyUI.module.css";

const RIVE_SRC = process.env.NEXT_PUBLIC_RIMY_RIVE_SRC;
const RiveRimy = dynamic(() => import("./RiveRimy"), {
    ssr: false,
    loading: () => null,
});

const BASE_WIDTH = 260;
const BASE_HEIGHT = 362;
const HERO_SLOT_ID = "rimy-hero-slot";

type Target = {
    x: number;
    y: number;
    scale: number;
};

export default function RimyController() {
    const [mode, setMode] = useState<RimyMode>("hero");
    const [ready, setReady] = useState(false);
    const [moving, setMoving] = useState(false);
    const [riveFailed, setRiveFailed] = useState(false);
    const [viewport, setViewport] = useState({ width: 1280, height: 800 });
    const [slotSize, setSlotSize] = useState({ width: 0, height: 0 });

    const shellRef = useRef<HTMLDivElement>(null);
    const modeRef = useRef<RimyMode>("hero");
    const previousModeRef = useRef<RimyMode>("hero");
    const positionedRef = useRef(false);
    const transformRef = useRef<Target>({ x: 0, y: 0, scale: 1 });
    const animationFrameRef = useRef<number | null>(null);
    const lastAutoMessageRef = useRef(0);
    const lastHeroReturnRef = useRef(0);
    const hasDockedRef = useRef(false);
    const greetingScheduledRef = useRef(false);
    const greetingFiredRef = useRef(false);
    const lastTapRef = useRef(0);

    const reducedMotion = usePrefersReducedMotion();
    const { animation, message, request, showMessage, dismissMessage, reset } =
        useRimyState();
    const audio = useRimyAudio();
    const { playWelcome } = audio;
    const narration = useNarration();
    const narrationActive =
        narration.status === "speaking" || narration.status === "paused";

    const layout = useMemo(() => {
        const isMobile = viewport.width < 640;
        const isTablet = viewport.width >= 640 && viewport.width < 1024;
        const heroScale =
            slotSize.width > 40
                ? Math.min(
                      slotSize.width / BASE_WIDTH,
                      slotSize.height / BASE_HEIGHT,
                      1.5
                  )
                : 1;
        // Tamaño reducido en modo docked para no invadir el contenido
        const dockWidth = isMobile
            ? Math.min(96, Math.max(76, viewport.width * 0.24))
            : isTablet
              ? 100
              : 120;
        const dockScale = dockWidth / BASE_WIDTH;

        return {
            isMobile,
            isTablet,
            heroScale,
            dockWidth,
            dockScale,
            dockHeight: BASE_HEIGHT * dockScale,
        };
    }, [slotSize, viewport]);

    const setTransform = useCallback((target: Target) => {
        const shell = shellRef.current;
        if (!shell) return;

        transformRef.current = target;
        shell.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) scale(${target.scale})`;
    }, []);

    const getDockTarget = useCallback((): Target => {
        const marginX = layout.isMobile ? 8 : 14;
        // Margen inferior mínimo: RIMY queda pegada al borde inferior del viewport
        const marginBottom = layout.isMobile ? 8 : 10;

        return {
            x: Math.max(
                marginX,
                viewport.width - layout.dockWidth - marginX
            ),
            y: Math.max(
                88,
                viewport.height - layout.dockHeight - marginBottom
            ),
            scale: layout.dockScale,
        };
    }, [layout, viewport]);

    const getHeroTarget = useCallback((): Target | null => {
        const slot = document.getElementById(HERO_SLOT_ID);
        if (!slot) return null;

        const rect = slot.getBoundingClientRect();
        if (rect.width < 40 || rect.height < 40) return null;

        const scale = Math.min(
            rect.width / BASE_WIDTH,
            rect.height / BASE_HEIGHT,
            1.5
        );
        const width = BASE_WIDTH * scale;
        const height = BASE_HEIGHT * scale;

        return {
            x: rect.left + (rect.width - width) / 2,
            y: rect.top + (rect.height - height) / 2,
            scale,
        };
    }, []);

    const animateTo = useCallback(
        (
            getTarget: () => Target | null,
            duration: number,
            onDone?: () => void
        ) => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }

            const from = { ...transformRef.current };
            const start = performance.now();
            const total = Math.max(1, duration);

            const tick = (now: number) => {
                const progress = Math.min(1, (now - start) / total);
                const ease = 1 - Math.pow(1 - progress, 3);
                const target = getTarget();

                if (target) {
                    setTransform({
                        x: from.x + (target.x - from.x) * ease,
                        y: from.y + (target.y - from.y) * ease,
                        scale: from.scale + (target.scale - from.scale) * ease,
                    });
                }

                if (progress < 1) {
                    animationFrameRef.current = requestAnimationFrame(tick);
                } else {
                    animationFrameRef.current = null;
                    const finalTarget = getTarget();
                    if (finalTarget) setTransform(finalTarget);
                    onDone?.();
                }
            };

            animationFrameRef.current = requestAnimationFrame(tick);
        },
        [setTransform]
    );

    /* ------------------------------------------------------------------ */
    /* Medidas y layout                                                    */
    /* ------------------------------------------------------------------ */

    useEffect(() => {
        const handleResize = () =>
            setViewport({
                width: window.innerWidth,
                height: window.innerHeight,
            });

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const slot = document.getElementById(HERO_SLOT_ID);
        if (!slot) return;

        const measure = () => {
            const rect = slot.getBoundingClientRect();
            setSlotSize({ width: rect.width, height: rect.height });
        };

        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(slot);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (positionedRef.current) return;

        const target = mode === "docked" ? getDockTarget() : getHeroTarget();
        // El hueco del Hero puede medir 0 en el primer render (antes de que
        // ResizeObserver mida). Sin esta salida, `ready` nunca se activaría.
        if (!target) return;

        positionedRef.current = true;
        setTransform(target);

        // Se difiere un frame para no encadenar renders dentro del efecto.
        window.requestAnimationFrame(() => setReady(true));
    }, [
        mode,
        getDockTarget,
        getHeroTarget,
        setTransform,
        slotSize,
        viewport,
    ]);

    useEffect(() => {
        if (!ready) return;
        if (previousModeRef.current === mode) return;

        previousModeRef.current = mode;
        setMoving(true);

        const duration = reducedMotion ? 0 : 900;
        const targetFn = mode === "docked" ? getDockTarget : getHeroTarget;

        animateTo(targetFn, duration, () => setMoving(false));

        const safety = window.setTimeout(
            () => setMoving(false),
            duration + 160
        );

        return () => window.clearTimeout(safety);
    }, [
        mode,
        ready,
        reducedMotion,
        getDockTarget,
        getHeroTarget,
        animateTo,
    ]);

    // En el Hero la mascota sigue al hueco reservado mientras se hace scroll.
    useEffect(() => {
        if (!ready || mode !== "hero" || moving) return;

        let frame = 0;

        const update = () => {
            if (frame) return;
            frame = requestAnimationFrame(() => {
                frame = 0;
                const target = getHeroTarget();
                if (target) setTransform(target);
            });
        };

        update();
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);

        const slot = document.getElementById(HERO_SLOT_ID);
        const observer = slot ? new ResizeObserver(update) : null;
        if (slot && observer) observer.observe(slot);

        return () => {
            if (frame) cancelAnimationFrame(frame);
            window.removeEventListener("scroll", update);
            window.removeEventListener("resize", update);
            observer?.disconnect();
        };
    }, [ready, mode, moving, getHeroTarget, setTransform]);

    // En modo flotante se recalcula al cambiar el viewport (por ejemplo, barra
    // de direcciones móvil o rotación).
    useEffect(() => {
        if (!ready || mode !== "docked" || moving) return;
        setTransform(getDockTarget());
    }, [
        ready,
        mode,
        moving,
        viewport,
        layout.dockWidth,
        layout.dockHeight,
        getDockTarget,
        setTransform,
    ]);

    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    /* ------------------------------------------------------------------ */
    /* Sistema de comportamiento                                           */
    /* ------------------------------------------------------------------ */

    const announce = useCallback(
        (
            nextAnimation: RimyAnimation,
            text: string,
            tone: RimyTone,
            duration: number,
            messageDuration: number,
            cooldown = 6000
        ) => {
            const now = performance.now();
            if (now - lastAutoMessageRef.current < cooldown) return false;

            const accepted = request(nextAnimation, {
                message: text,
                tone,
                duration,
                messageDuration,
            });

            if (accepted) lastAutoMessageRef.current = now;
            return accepted;
        },
        [request]
    );

    useScrollBehavior({
        onSectionChange: (section) => {
            if (section === "hero" || modeRef.current !== "docked") return;

            const content = RIMY_MESSAGES.sections[section];
            if (!content) return;

            announce(
                content.animation,
                content.message,
                content.tone,
                1800,
                3800,
                7000
            );
        },
        onDwell: (section) => {
            if (section === "hero" || modeRef.current !== "docked") return;

            announce(
                "thinking",
                RIMY_MESSAGES.dwelling,
                "thinking",
                3200,
                4200,
                18000
            );
        },
        onFastScroll: () => {
            request("error", {
                message: RIMY_MESSAGES.fastScroll,
                tone: "surprised",
                duration: 1500,
                messageDuration: 3200,
            });
        },
        onRepetitiveScroll: () => {
            request("annoyed", {
                message: RIMY_MESSAGES.repetitiveScroll,
                tone: "annoyed",
                duration: 2600,
                messageDuration: 4200,
            });
        },
        onDockChange: (docked) => {
            modeRef.current = docked ? "docked" : "hero";
            setMode(docked ? "docked" : "hero");

            if (docked) {
                if (!hasDockedRef.current) {
                    hasDockedRef.current = true;
                    announce(
                        "run",
                        RIMY_MESSAGES.docked,
                        "happy",
                        1900,
                        3400,
                        5000
                    );
                }
                return;
            }

            const now = performance.now();
            if (
                hasDockedRef.current &&
                now - lastHeroReturnRef.current > 9000
            ) {
                lastHeroReturnRef.current = now;
                announce(
                    "happy",
                    RIMY_MESSAGES.returning,
                    "happy",
                    1800,
                    3400,
                    2500
                );
            }
        },
    });

    /* ------------------------------------------------------------------ */
    /* Bienvenida (una vez por sesión)                                     */
    /* ------------------------------------------------------------------ */

    useEffect(() => {
        if (greetingScheduledRef.current || greetingFiredRef.current) return;
        greetingScheduledRef.current = true;

        const timer = window.setTimeout(() => {
            greetingFiredRef.current = true;

            let alreadyGreeted = false;
            try {
                alreadyGreeted =
                    sessionStorage.getItem(RIMY_GREETING_KEY) === "1";
            } catch {
                // sessionStorage puede no estar disponible.
            }

            if (alreadyGreeted) {
                request("happy", {
                    message: RIMY_MESSAGES.alreadyGreeted,
                    tone: "happy",
                    duration: 1600,
                    messageDuration: 3200,
                });
                return;
            }

            try {
                sessionStorage.setItem(RIMY_GREETING_KEY, "1");
            } catch {
                // Sin persistencia: el saludo se repetirá al recargar.
            }

            request("greeting", {
                message: RIMY_GREETING_TEXT,
                tone: "happy",
                duration: 6400,
                messageDuration: 7000,
            });

            void playWelcome();
        }, 650);

        return () => {
            window.clearTimeout(timer);
            if (!greetingFiredRef.current) {
                greetingScheduledRef.current = false;
            }
        };
    }, [playWelcome, request]);

    /* ------------------------------------------------------------------ */
    /* Narración (TTS): RIMY habla mientras se reproduce una explicación    */
    /* ------------------------------------------------------------------ */

    useEffect(() => {
        if (narrationActive) {
            if (animation !== "talking") {
                request("talking", { duration: 60 * 60 * 1000 });
            }
            return;
        }

        if (animation === "talking") {
            reset();
        }
    }, [narrationActive, animation, request, reset]);

    /* ------------------------------------------------------------------ */
    /* Interacción directa                                                 */
    /* ------------------------------------------------------------------ */

    const handleInteract = useCallback(() => {
        if (audio.blocked) {
            void audio.enable();
        }

        if (
            animation === "greeting" ||
            animation === "fall" ||
            animation === "annoyed"
        ) {
            return;
        }

        // Doble toque rápido: RIMY tropieza y se recupera (easter egg).
        const now = performance.now();
        const isDoubleTap = now - lastTapRef.current < 340;
        lastTapRef.current = now;

        if (isDoubleTap) {
            request("fall", {
                message: RIMY_MESSAGES.trip,
                tone: "surprised",
                duration: 1900,
                messageDuration: 3200,
            });
            return;
        }

        const text =
            RIMY_MESSAGES.tap[
                Math.floor(Math.random() * RIMY_MESSAGES.tap.length)
            ];

        const accepted = request("happy", {
            message: text,
            tone: "happy",
            duration: 1600,
            messageDuration: 3200,
        });

        if (!accepted && animation === "idle") {
            showMessage(text, "happy", 3200);
        }

        // When docked, clicking RIMY opens/closes the chat panel
        if (modeRef.current === "docked") {
            window.dispatchEvent(new CustomEvent("rimy:toggle-chat"));
        }
    }, [animation, audio, request, showMessage]);

    const handleWave = useCallback(() => {
        if (audio.blocked) {
            void audio.enable();
        }

        if (animation === "greeting") return;

        request("greeting", {
            message: RIMY_MESSAGES.wave,
            tone: "happy",
            duration: 2900,
            messageDuration: 3200,
        });
    }, [animation, audio, request]);

    const handleEnableAudio = useCallback(() => {
        void audio.enable();
    }, [audio]);

    // Expone el modo actual para que otros widgets (p. ej. el asistente)
    // puedan apartarse mientras RIMY protagoniza el Hero.
    useEffect(() => {
        document.body.dataset.rimyActiveMode = mode;
        return () => {
            delete document.body.dataset.rimyActiveMode;
        };
    }, [mode]);

    /* ------------------------------------------------------------------ */
    /* Render                                                              */
    /* ------------------------------------------------------------------ */

    const useRive = Boolean(RIVE_SRC) && !riveFailed;
    const activeScale =
        mode === "docked" ? layout.dockScale : layout.heroScale;
    const inverseScale = 1 / Math.max(activeScale, 0.05);

    const shellStyle = {
        "--rimy-inv-scale": inverseScale.toFixed(4),
    } as CSSProperties;

    return (
        <div
            ref={shellRef}
            className={`${styles.shell} ${
                ready ? styles.shellReady : ""
            } ${moving ? styles.moving : ""}`}
            style={shellStyle}
            data-rimy-mode={mode}
            data-rimy-animation={animation}
        >
            <button
                type="button"
                className={styles.mascotButton}
                onClick={handleInteract}
                aria-label="Interactuar con RIMY"
                title="¡Tócame!"
            >
                {useRive ? (
                    <RiveRimy
                        animation={animation}
                        onUnavailable={() => setRiveFailed(true)}
                    />
                ) : (
                    <RimyMascot
                        animation={animation}
                        reducedMotion={reducedMotion}
                    />
                )}
            </button>

            {mode === "hero" &&
                (audio.blocked || audio.muted || audio.speaking) && (
                    <div className={styles.heroAudio}>
                        <RimyAudio
                            muted={audio.muted}
                            blocked={audio.blocked}
                            speaking={audio.speaking}
                            onToggle={audio.toggle}
                        />
                    </div>
                )}

            {mode === "docked" && !message && !moving && (
                <RimyFloating
                    muted={audio.muted}
                    blocked={audio.blocked}
                    speaking={audio.speaking}
                    onToggleAudio={audio.toggle}
                    onWave={handleWave}
                />
            )}

            {message && (
                <RimySpeechBubble
                    message={message}
                    mode={mode}
                    hidden={moving}
                    // La activación de voz solo acompaña a la bienvenida: es
                    // el único mensaje con audio pregrabado. El resto usa los
                    // controles de sonido del propio RIMY.
                    audioBlocked={
                        audio.blocked && message.text === RIMY_GREETING_TEXT
                    }
                    onEnableAudio={handleEnableAudio}
                    onDismiss={dismissMessage}
                />
            )}
        </div>
    );
}
