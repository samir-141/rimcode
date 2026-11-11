/* eslint-disable react-hooks/immutability */
"use client";

import { useEffect, useRef, useState } from "react";
import {
    useRive,
    useStateMachineInput,
} from "@rive-app/react-webgl2";

const RIVE_FILE = "/mascot/rimbot.riv";
const MACHINE = "RimBotMachine";

type RimBotProps = {
    emotion?: number;
    talking?: boolean;
    hovered?: boolean;
    onWave?: boolean;
    onCelebrate?: boolean;
    className?: string;
    showSpeechBubble?: boolean;
    speechText?: string;
};

export default function RimBot({
    emotion = 0,
    talking = false,
    hovered = false,
    onWave = false,
    onCelebrate = false,
    className = "",
    showSpeechBubble = false,
    speechText,
}: RimBotProps) {
    const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Intentar inicializar Rive (si el archivo .riv es válido)
    const { rive, RiveComponent } = useRive({
        src: RIVE_FILE,
        stateMachine: MACHINE,
        autoplay: true,
    });

    const isRiveReady = Boolean(rive);

    const hoverInput = useStateMachineInput(rive, MACHINE, "isHover");
    const talkingInput = useStateMachineInput(rive, MACHINE, "isTalking");
    const darkInput = useStateMachineInput(rive, MACHINE, "isDark");
    const emotionInput = useStateMachineInput(rive, MACHINE, "emotion");
    const waveInput = useStateMachineInput(rive, MACHINE, "wave");
    const celebrateInput = useStateMachineInput(rive, MACHINE, "celebrate");

    // Sincronizar inputs de Rive
    useEffect(() => {
        if (hoverInput) hoverInput.value = hovered || isHovered;
    }, [hoverInput, hovered, isHovered]);

    useEffect(() => {
        if (talkingInput) talkingInput.value = talking;
    }, [talkingInput, talking]);

    useEffect(() => {
        if (emotionInput) emotionInput.value = emotion;
    }, [emotionInput, emotion]);

    useEffect(() => {
        const root = document.documentElement;
        const updateTheme = () => {
            if (darkInput) {
                darkInput.value = root.classList.contains("dark");
            }
        };
        updateTheme();
        const observer = new MutationObserver(updateTheme);
        observer.observe(root, {
            attributes: true,
            attributeFilter: ["class"],
        });
        return () => observer.disconnect();
    }, [darkInput]);

    useEffect(() => {
        if (onWave) waveInput?.fire();
    }, [onWave, waveInput]);

    useEffect(() => {
        if (onCelebrate) celebrateInput?.fire();
    }, [onCelebrate, celebrateInput]);

    // Seguimiento del cursor para los ojos interactivos (modo SVG)
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const maxOffset = 7;
        const dx = Math.max(-maxOffset, Math.min(maxOffset, (e.clientX - centerX) / 10));
        const dy = Math.max(-maxOffset, Math.min(maxOffset, (e.clientY - centerY) / 10));
        setMouseOffset({ x: dx, y: dy });
    };

    const isWaving = hovered || isHovered || onWave || onCelebrate;
    const isHappy = emotion === 1 || onCelebrate;
    const isThinking = emotion === 2;

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => {
                setIsHovered(true);
                if (hoverInput) hoverInput.value = true;
            }}
            onMouseLeave={() => {
                setIsHovered(false);
                setMouseOffset({ x: 0, y: 0 });
                if (hoverInput) hoverInput.value = false;
            }}
            className={`relative flex flex-col items-center justify-center select-none ${className}`}
        >
            {/* BURBUJA DE DIÁLOGO DINÁMICA */}
            {showSpeechBubble && speechText && (
                <div
                    className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 w-max max-w-[280px] sm:max-w-[340px] px-4 py-2.5 rounded-2xl border backdrop-blur-xl shadow-2xl animate-bounce-subtle pointer-events-none"
                    style={{
                        backgroundColor: "var(--header-bg)",
                        borderColor: "var(--header-border)",
                        color: "var(--header-text)",
                    }}
                >
                    <p className="text-xs sm:text-sm font-medium leading-snug text-center">
                        {speechText}
                    </p>
                    <div
                        className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3 h-3 rotate-45 border-r border-b"
                        style={{
                            backgroundColor: "var(--header-bg)",
                            borderColor: "var(--header-border)",
                        }}
                    />
                </div>
            )}

            {/* HALO DE LUZ NEÓN */}
            <div
                className="absolute inset-0 rounded-full blur-3xl opacity-30 dark:opacity-45 pointer-events-none transition-opacity duration-700"
                style={{
                    background:
                        "radial-gradient(circle, var(--accent) 0%, rgba(56, 189, 248, 0.3) 50%, transparent 75%)",
                    transform: "scale(1.15)",
                }}
            />

            {/* SI RIVE ESTÁ CARGADO, MOSTRAR CANVAS RIVE */}
            {isRiveReady ? (
                <RiveComponent
                    className="relative z-10 h-full w-full"
                    aria-label="RimBot, mascota interactiva de RimCode"
                />
            ) : (
                /* MASCOTA VECTORIAL INTERACTIVA DE ALTO RENDIMIENTO (FALLBACK & NATIVO) */
                <div className="relative z-10 w-full h-full max-w-[380px] max-h-[380px] flex items-center justify-center transition-transform duration-300 hover:scale-105">
                    <svg
                        viewBox="0 0 200 200"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)]"
                    >
                        {/* SOMBRA DINÁMICA FLOTANTE */}
                        <ellipse
                            cx="100"
                            cy="188"
                            rx={isHovered ? "50" : "44"}
                            ry="7"
                            className="fill-black/30 dark:fill-black/60 transition-all duration-500"
                        />

                        {/* CUERPO PRINCIPAL ANIMADO */}
                        <g className="animate-float">
                            {/* ANTENA NEÓN */}
                            <line
                                x1="100"
                                y1="40"
                                x2="100"
                                y2="18"
                                stroke="currentColor"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                className="text-zinc-600 dark:text-zinc-400"
                            />
                            {/* Foco de la antena */}
                            <circle
                                cx="100"
                                cy="15"
                                r="8"
                                fill="var(--accent)"
                                className="animate-pulse shadow-lg"
                            />
                            <circle
                                cx="100"
                                cy="15"
                                r="14"
                                fill="var(--accent)"
                                opacity="0.35"
                                className="animate-ping"
                            />

                            {/* AURICULARES CYBERPUNK CON LUCES */}
                            <rect
                                x="30"
                                y="66"
                                width="14"
                                height="38"
                                rx="7"
                                fill="#1e2433"
                                stroke="var(--accent)"
                                strokeWidth="1.8"
                            />
                            <rect
                                x="156"
                                y="66"
                                width="14"
                                height="38"
                                rx="7"
                                fill="#1e2433"
                                stroke="var(--accent)"
                                strokeWidth="1.8"
                            />
                            <circle cx="37" cy="85" r="3.5" fill="var(--accent)" />
                            <circle cx="163" cy="85" r="3.5" fill="var(--accent)" />

                            {/* CABEZA PRINCIPAL */}
                            <rect
                                x="38"
                                y="34"
                                width="124"
                                height="102"
                                rx="30"
                                fill="#131722"
                                stroke="rgba(255,255,255,0.14)"
                                strokeWidth="2.5"
                                className="transition-colors duration-300"
                            />

                            {/* PANTALLA VISOR OSCURA */}
                            <rect
                                x="48"
                                y="46"
                                width="104"
                                height="78"
                                rx="20"
                                fill="#0a0d14"
                                stroke="rgba(255,255,255,0.08)"
                                strokeWidth="1.5"
                            />

                            {/* LÍNEAS DE ESCANEO DE VISOR */}
                            <path
                                d="M52 56 L148 56"
                                stroke="rgba(255, 255, 255, 0.05)"
                                strokeWidth="1"
                            />
                            <path
                                d="M52 66 L148 66"
                                stroke="rgba(255, 255, 255, 0.05)"
                                strokeWidth="1"
                            />

                            {/* OJOS DIGITALES */}
                            {isHappy ? (
                                <g className="transition-all duration-300">
                                    <path
                                        d="M68 85 Q78 70 88 85"
                                        stroke="var(--accent)"
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                    <path
                                        d="M112 85 Q122 70 132 85"
                                        stroke="var(--accent)"
                                        strokeWidth="5"
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                </g>
                            ) : isThinking ? (
                                <g className="transition-all duration-300">
                                    <circle cx="78" cy="74" r="8" fill="var(--accent)" />
                                    <circle cx="122" cy="74" r="8" fill="var(--accent)" />
                                    <circle cx="81" cy="71" r="2.5" fill="#ffffff" />
                                    <circle cx="125" cy="71" r="2.5" fill="#ffffff" />
                                </g>
                            ) : (
                                <g
                                    style={{
                                        transform: `translate(${mouseOffset.x}px, ${mouseOffset.y}px)`,
                                        transition: "transform 0.12s ease-out",
                                    }}
                                >
                                    {/* Ojo izquierdo */}
                                    <ellipse
                                        cx="78"
                                        cy="82"
                                        rx="9"
                                        ry="13"
                                        fill="var(--accent)"
                                    />
                                    <circle cx="81" cy="78" r="3" fill="#ffffff" />

                                    {/* Ojo derecho */}
                                    <ellipse
                                        cx="122"
                                        cy="82"
                                        rx="9"
                                        ry="13"
                                        fill="var(--accent)"
                                    />
                                    <circle cx="125" cy="78" r="3" fill="#ffffff" />
                                </g>
                            )}

                            {/* BOCA / VOZ */}
                            {talking ? (
                                <g className="animate-pulse">
                                    <line
                                        x1="86"
                                        y1="105"
                                        x2="86"
                                        y2="109"
                                        stroke="var(--accent)"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                    <line
                                        x1="93"
                                        y1="102"
                                        x2="93"
                                        y2="112"
                                        stroke="var(--accent)"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                    <line
                                        x1="100"
                                        y1="99"
                                        x2="100"
                                        y2="115"
                                        stroke="var(--accent)"
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                    />
                                    <line
                                        x1="107"
                                        y1="102"
                                        x2="107"
                                        y2="112"
                                        stroke="var(--accent)"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                    <line
                                        x1="114"
                                        y1="105"
                                        x2="114"
                                        y2="109"
                                        stroke="var(--accent)"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                    />
                                </g>
                            ) : (
                                <path
                                    d="M92 105 Q100 111 108 105"
                                    stroke="rgba(255,255,255,0.4)"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            )}

                            {/* CUELLO */}
                            <rect
                                x="90"
                                y="136"
                                width="20"
                                height="8"
                                rx="3"
                                fill="#1e2433"
                            />

                            {/* CUERPO TORSO */}
                            <rect
                                x="62"
                                y="144"
                                width="76"
                                height="38"
                                rx="16"
                                fill="#131722"
                                stroke="rgba(255,255,255,0.12)"
                                strokeWidth="2"
                            />

                            {/* BADGE CENTRAL RIMCODE </ > */}
                            <rect
                                x="80"
                                y="151"
                                width="40"
                                height="20"
                                rx="6"
                                fill="#0b0e14"
                            />
                            <text
                                x="100"
                                y="165"
                                textAnchor="middle"
                                fill="var(--accent)"
                                fontSize="11"
                                fontWeight="800"
                                fontFamily="monospace"
                            >
                                &lt;/&gt;
                            </text>

                            {/* BRAZO IZQUIERDO */}
                            <rect
                                x="46"
                                y="148"
                                width="12"
                                height="26"
                                rx="6"
                                fill="#1e2433"
                            />

                            {/* BRAZO DERECHO (SALUDO CON ONDA) */}
                            <g
                                className={
                                    isWaving
                                        ? "origin-[144px_148px] animate-wave"
                                        : ""
                                }
                            >
                                <rect
                                    x="142"
                                    y="148"
                                    width="12"
                                    height="26"
                                    rx="6"
                                    fill="#1e2433"
                                />
                                <circle
                                    cx="148"
                                    cy="176"
                                    r="6.5"
                                    fill="var(--accent)"
                                />
                            </g>
                        </g>
                    </svg>
                </div>
            )}

            {/* ESTILOS DE ANIMACIÓN */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-8px);
                    }
                }
                @keyframes wave {
                    0%, 100% {
                        transform: rotate(0deg);
                    }
                    25% {
                        transform: rotate(-28deg);
                    }
                    75% {
                        transform: rotate(28deg);
                    }
                }
                @keyframes bounce-subtle {
                    0%, 100% {
                        transform: translate(-50%, 0);
                    }
                    50% {
                        transform: translate(-50%, -4px);
                    }
                }
                .animate-float {
                    animation: float 3.5s ease-in-out infinite;
                }
                .animate-wave {
                    animation: wave 0.8s ease-in-out infinite;
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
