"use client";

import { useEffect, useId, useRef } from "react";
import type { RimyAnimation } from "./types";
import styles from "./RimyMascot.module.css";

type RimyMascotProps = {
    animation: RimyAnimation;
    reducedMotion?: boolean;
    interactiveEyes?: boolean;
    className?: string;
};

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

export default function RimyMascot({
    animation,
    reducedMotion = false,
    interactiveEyes = true,
    className = "",
}: RimyMascotProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const rawId = useId();
    const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
    const shellId = `rimy-shell-${uid}`;
    const screenId = `rimy-screen-${uid}`;
    const blueId = `rimy-blue-${uid}`;
    const orangeId = `rimy-orange-${uid}`;
    const limbId = `rimy-limb-${uid}`;
    const mouthId = `rimy-mouth-${uid}`;
    const eyeId = `rimy-eye-${uid}`;
    const glowId = `rimy-glow-${uid}`;
    const softGlowId = `rimy-soft-${uid}`;
    const smokeId = `rimy-smoke-${uid}`;
    const angryId = `rimy-angry-${uid}`;

    // Seguimiento suave del cursor sin re-renderizar React (solo CSS vars).
    useEffect(() => {
        if (!interactiveEyes || reducedMotion) return;

        const svg = svgRef.current;
        if (!svg) return;

        let frame = 0;

        const handlePointer = (event: PointerEvent) => {
            if (frame) return;

            frame = requestAnimationFrame(() => {
                frame = 0;
                const node = svgRef.current;
                if (!node) return;

                const rect = node.getBoundingClientRect();
                if (!rect.width || !rect.height) return;

                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height * 0.34;
                const x = clamp(
                    (event.clientX - centerX) / (rect.width * 0.75),
                    -1,
                    1
                );
                const y = clamp(
                    (event.clientY - centerY) / (rect.height * 0.5),
                    -1,
                    1
                );

                node.style.setProperty(
                    "--rimy-look-x",
                    `${(x * 4.2).toFixed(2)}px`
                );
                node.style.setProperty(
                    "--rimy-look-y",
                    `${(y * 3.2).toFixed(2)}px`
                );
            });
        };

        window.addEventListener("pointermove", handlePointer, {
            passive: true,
        });

        return () => {
            window.removeEventListener("pointermove", handlePointer);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [interactiveEyes, reducedMotion]);

    const eyeFilter = `url(#${glowId})`;
    const mouthFill = `url(#${mouthId})`;
    const eyeFill = `url(#${eyeId})`;
    const canBlink = ![
        "error",
        "annoyed",
        "thinking",
        "fall",
    ].includes(animation);

    const renderEyes = () => {
        if (animation === "greeting" || animation === "happy") {
            return (
                <g
                    className={styles.eyeLook}
                    fill="none"
                    stroke={eyeFill}
                    strokeWidth="8"
                    strokeLinecap="round"
                    filter={eyeFilter}
                >
                    <path d="M87 126 Q100 105 113 126" />
                    <path d="M147 126 Q160 105 173 126" />
                </g>
            );
        }

        if (animation === "annoyed") {
            return (
                <g
                    className={styles.eyeLook}
                    fill="none"
                    stroke="#ff9a3d"
                    strokeWidth="8.5"
                    strokeLinecap="round"
                    filter={eyeFilter}
                >
                    <path d="M88 126 L112 113" />
                    <path d="M148 113 L172 126" />
                    <path
                        d="M91 137 L109 137"
                        stroke="#ff7a18"
                        strokeWidth="3.5"
                        opacity="0.7"
                    />
                    <path
                        d="M151 137 L169 137"
                        stroke="#ff7a18"
                        strokeWidth="3.5"
                        opacity="0.7"
                    />
                </g>
            );
        }

        if (animation === "thinking") {
            return (
                <g className={styles.eyeLook} filter={eyeFilter}>
                    <g className={styles.gear}>
                        <Gear cx={100} cy={120} />
                    </g>
                    <g className={styles.gearReverse}>
                        <Gear cx={160} cy={120} />
                    </g>
                </g>
            );
        }

        if (animation === "error") {
            return (
                <g
                    className={styles.eyeLook}
                    stroke={eyeFill}
                    strokeWidth="6.5"
                    strokeLinecap="round"
                    filter={eyeFilter}
                >
                    <path d="M89 110 L111 130 M111 110 L89 130" />
                    <path d="M149 110 L171 130 M171 110 L149 130" />
                </g>
            );
        }

        if (animation === "fall") {
            return (
                <g
                    className={styles.eyeLook}
                    fill="none"
                    stroke={eyeFill}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter={eyeFilter}
                >
                    <path d="M89 111 L104 120 L89 129" />
                    <path d="M171 111 L156 120 L171 129" />
                </g>
            );
        }

        if (animation === "run") {
            return (
                <g className={styles.eyeLook} filter={eyeFilter}>
                    <rect
                        x="89"
                        y="109"
                        width="22"
                        height="27"
                        rx="11"
                        fill={eyeFill}
                    />
                    <rect
                        x="149"
                        y="109"
                        width="22"
                        height="27"
                        rx="11"
                        fill={eyeFill}
                    />
                    <circle cx="96" cy="117" r="3" fill="#ffffff" opacity="0.9" />
                    <circle cx="156" cy="117" r="3" fill="#ffffff" opacity="0.9" />
                    <path
                        d="M88 102 L112 107"
                        stroke="#8ff6ff"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        opacity="0.75"
                    />
                    <path
                        d="M172 102 L148 107"
                        stroke="#8ff6ff"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        opacity="0.75"
                    />
                </g>
            );
        }

        return (
            <g className={styles.eyeLook} filter={eyeFilter}>
                <rect
                    x="88"
                    y="104"
                    width="24"
                    height="34"
                    rx="12"
                    fill={eyeFill}
                />
                <rect
                    x="148"
                    y="104"
                    width="24"
                    height="34"
                    rx="12"
                    fill={eyeFill}
                />
                <circle cx="96" cy="113" r="3.6" fill="#ffffff" opacity="0.92" />
                <circle cx="156" cy="113" r="3.6" fill="#ffffff" opacity="0.92" />
                <circle cx="104" cy="126" r="1.8" fill="#ffffff" opacity="0.3" />
                <circle cx="164" cy="126" r="1.8" fill="#ffffff" opacity="0.3" />
            </g>
        );
    };

    const renderMouth = () => {
        if (animation === "greeting" || animation === "happy") {
            return (
                <g filter={eyeFilter}>
                    <path
                        d="M111 148 Q130 156 149 148 Q149 172 130 175 Q111 172 111 148 Z"
                        fill={mouthFill}
                    />
                    <path
                        d="M120 164 Q130 169 140 164"
                        stroke="#e6ffff"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.55"
                        fill="none"
                    />
                </g>
            );
        }

        if (animation === "annoyed") {
            return (
                <path
                    d="M117 160 H143"
                    stroke="#ff9a3d"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    filter={eyeFilter}
                />
            );
        }

        if (animation === "error") {
            return (
                <ellipse
                    cx="130"
                    cy="160"
                    rx="5.5"
                    ry="7.5"
                    fill="none"
                    stroke={eyeFill}
                    strokeWidth="4"
                    filter={eyeFilter}
                />
            );
        }

        if (animation === "fall") {
            return (
                <path
                    d="M114 160 Q121 152 128 160 T143 160"
                    fill="none"
                    stroke={eyeFill}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    filter={eyeFilter}
                />
            );
        }

        if (animation === "run") {
            return (
                <ellipse
                    cx="130"
                    cy="158"
                    rx="7.5"
                    ry="5.5"
                    fill={mouthFill}
                    filter={eyeFilter}
                />
            );
        }

        if (animation === "thinking") {
            return (
                <g filter={eyeFilter}>
                    <path
                        d="M121 158 H139"
                        stroke="#7ceffc"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                    />
                    <circle
                        cx="146"
                        cy="156"
                        r="2"
                        fill="#7ceffc"
                        opacity="0.8"
                    />
                </g>
            );
        }

        if (animation === "talking") {
            return (
                <g className={styles.talkingMouth} filter={eyeFilter}>
                    <ellipse
                        cx="130"
                        cy="159"
                        rx="10"
                        ry="8"
                        fill={mouthFill}
                    />
                    <path
                        d="M123 159 Q130 163 137 159"
                        stroke="#e6ffff"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        opacity="0.55"
                        fill="none"
                    />
                </g>
            );
        }

        return (
            <path
                d="M117 151 Q130 161 143 151"
                fill="none"
                stroke="#7ceffc"
                strokeWidth="3.8"
                strokeLinecap="round"
                filter={eyeFilter}
            />
        );
    };

    return (
        <svg
            ref={svgRef}
            viewBox="0 0 260 362"
            className={`${styles.svg} ${styles[animation] ?? ""} ${
                reducedMotion ? styles.reduced : ""
            } ${className}`}
            role="img"
            aria-label={`RIMY, mascota de RimCode, ${animation}`}
            data-animation={animation}
        >
            <defs>
                <linearGradient id={shellId} x1="70" y1="50" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="0.55" stopColor="#f2f9ff" />
                    <stop offset="1" stopColor="#d8ecff" />
                </linearGradient>
                <linearGradient id={screenId} x1="70" y1="76" x2="190" y2="174" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#0a3157" />
                    <stop offset="0.5" stopColor="#051a31" />
                    <stop offset="1" stopColor="#020e1c" />
                </linearGradient>
                <linearGradient id={blueId} x1="70" y1="200" x2="190" y2="292" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#2f88e8" />
                    <stop offset="0.55" stopColor="#1d63ba" />
                    <stop offset="1" stopColor="#123f7d" />
                </linearGradient>
                <linearGradient id={orangeId} x1="100" y1="10" x2="150" y2="40" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#ffb347" />
                    <stop offset="0.45" stopColor="#ff8a1f" />
                    <stop offset="1" stopColor="#f25f00" />
                </linearGradient>
                <linearGradient id={limbId} x1="60" y1="210" x2="200" y2="330" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#ffffff" />
                    <stop offset="0.62" stopColor="#eef8ff" />
                    <stop offset="1" stopColor="#cfe6ff" />
                </linearGradient>
                <radialGradient id={eyeId} cx="35%" cy="28%" r="80%">
                    <stop offset="0" stopColor="#e6ffff" />
                    <stop offset="0.35" stopColor="#8cf7ff" />
                    <stop offset="0.8" stopColor="#2ce4f7" />
                    <stop offset="1" stopColor="#0bbcd6" />
                </radialGradient>
                <linearGradient id={mouthId} x1="112" y1="150" x2="150" y2="174" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#a6fbff" />
                    <stop offset="0.55" stopColor="#3ce8f7" />
                    <stop offset="1" stopColor="#12c3dc" />
                </linearGradient>
                <linearGradient id={smokeId} x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#e9edf3" />
                    <stop offset="1" stopColor="#aeb7c5" />
                </linearGradient>
                <radialGradient id={angryId} cx="50%" cy="50%" r="55%">
                    <stop offset="0" stopColor="#ff7a18" stopOpacity="0.35" />
                    <stop offset="0.7" stopColor="#ff5a00" stopOpacity="0.12" />
                    <stop offset="1" stopColor="#ff5a00" stopOpacity="0" />
                </radialGradient>
                <filter id={glowId} x="-70%" y="-70%" width="240%" height="240%">
                    <feGaussianBlur stdDeviation="3.4" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id={softGlowId} x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="4" result="softBlur" />
                    <feMerge>
                        <feMergeNode in="softBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Sombra en el suelo */}
            <ellipse
                className={styles.groundShadow}
                cx="130"
                cy="354"
                rx="78"
                ry="10"
            />

            {/* Líneas de velocidad al correr (detrás del personaje) */}
            {animation === "run" && (
                <g className={styles.speedLayer} aria-hidden="true">
                    <line
                        className={styles.speedLine}
                        x1="10"
                        y1="212"
                        x2="56"
                        y2="212"
                    />
                    <line
                        className={styles.speedLine}
                        x1="18"
                        y1="238"
                        x2="50"
                        y2="238"
                        style={{ animationDelay: "-0.18s" }}
                    />
                    <line
                        className={styles.speedLine}
                        x1="6"
                        y1="266"
                        x2="48"
                        y2="266"
                        style={{ animationDelay: "-0.32s" }}
                    />
                    <line
                        className={styles.speedLine}
                        x1="24"
                        y1="292"
                        x2="54"
                        y2="292"
                        style={{ animationDelay: "-0.44s" }}
                    />
                    <ellipse
                        className={styles.dust}
                        cx="76"
                        cy="348"
                        rx="12"
                        ry="5"
                    />
                    <ellipse
                        className={styles.dust}
                        cx="188"
                        cy="348"
                        rx="10"
                        ry="4"
                        style={{ animationDelay: "-0.28s" }}
                    />
                </g>
            )}

            <g className={styles.stage}>
                <g className={styles.float}>
                    <g className={styles.bodyRoot}>
                        {/* Antena */}
                        <g className={styles.antenna}>
                            <circle
                                cx="130"
                                cy="22"
                                r="20"
                                fill="#ff8a1f"
                                opacity="0.18"
                                filter={`url(#${softGlowId})`}
                            />
                            <line
                                x1="130"
                                y1="30"
                                x2="130"
                                y2="56"
                                stroke="#1b5ca3"
                                strokeWidth="7"
                                strokeLinecap="round"
                            />
                            <line
                                x1="128"
                                y1="33"
                                x2="128"
                                y2="50"
                                stroke="#78c6ff"
                                strokeWidth="2"
                                strokeLinecap="round"
                                opacity="0.65"
                            />
                            <circle
                                cx="130"
                                cy="22"
                                r="11"
                                fill={`url(#${orangeId})`}
                                stroke="#c85a00"
                                strokeWidth="2"
                            />
                            <circle
                                cx="126.5"
                                cy="18.5"
                                r="3.2"
                                fill="#ffe3b8"
                                opacity="0.95"
                            />
                        </g>

                        {/* Piernas */}
                        <g className={`${styles.leg} ${styles.legLeft}`}>
                            <rect
                                x="92"
                                y="292"
                                width="28"
                                height="36"
                                rx="14"
                                fill={`url(#${limbId})`}
                                stroke="#1e63b7"
                                strokeWidth="2.5"
                            />
                            <circle
                                cx="106"
                                cy="314"
                                r="7.5"
                                fill={`url(#${orangeId})`}
                                stroke="#cf6500"
                                strokeWidth="1.6"
                            />
                            <rect
                                x="93"
                                y="320"
                                width="26"
                                height="26"
                                rx="12"
                                fill={`url(#${limbId})`}
                                stroke="#1e63b7"
                                strokeWidth="2.5"
                            />
                            <rect
                                x="86"
                                y="338"
                                width="42"
                                height="20"
                                rx="10"
                                fill={`url(#${blueId})`}
                                stroke="#0d3c73"
                                strokeWidth="2.5"
                            />
                            <rect
                                x="90"
                                y="350"
                                width="34"
                                height="7"
                                rx="3.5"
                                fill={`url(#${orangeId})`}
                            />
                        </g>

                        <g className={`${styles.leg} ${styles.legRight}`}>
                            <rect
                                x="140"
                                y="292"
                                width="28"
                                height="36"
                                rx="14"
                                fill={`url(#${limbId})`}
                                stroke="#1e63b7"
                                strokeWidth="2.5"
                            />
                            <circle
                                cx="154"
                                cy="314"
                                r="7.5"
                                fill={`url(#${orangeId})`}
                                stroke="#cf6500"
                                strokeWidth="1.6"
                            />
                            <rect
                                x="141"
                                y="320"
                                width="26"
                                height="26"
                                rx="12"
                                fill={`url(#${limbId})`}
                                stroke="#1e63b7"
                                strokeWidth="2.5"
                            />
                            <rect
                                x="132"
                                y="338"
                                width="42"
                                height="20"
                                rx="10"
                                fill={`url(#${blueId})`}
                                stroke="#0d3c73"
                                strokeWidth="2.5"
                            />
                            <rect
                                x="136"
                                y="350"
                                width="34"
                                height="7"
                                rx="3.5"
                                fill={`url(#${orangeId})`}
                            />
                        </g>

                        {/* Brazo izquierdo */}
                        <g className={`${styles.arm} ${styles.armLeft}`}>
                            <rect
                                x="52"
                                y="216"
                                width="26"
                                height="44"
                                rx="13"
                                fill={`url(#${limbId})`}
                                stroke="#1e63b7"
                                strokeWidth="2.5"
                            />
                            <circle
                                cx="72"
                                cy="218"
                                r="12.5"
                                fill={`url(#${blueId})`}
                                stroke="#0d3c73"
                                strokeWidth="2.5"
                            />
                            <path
                                d="M65 215 Q72 211 79 215"
                                stroke="#8fd8ff"
                                strokeWidth="2"
                                strokeLinecap="round"
                                fill="none"
                                opacity="0.7"
                            />
                            <circle
                                cx="61"
                                cy="258"
                                r="8"
                                fill={`url(#${orangeId})`}
                                stroke="#cf6500"
                                strokeWidth="2"
                            />
                            <rect
                                x="50"
                                y="252"
                                width="23"
                                height="40"
                                rx="11"
                                fill={`url(#${limbId})`}
                                stroke="#1e63b7"
                                strokeWidth="2.5"
                            />
                            <g className={styles.handLeft}>
                                <circle
                                    cx="62"
                                    cy="296"
                                    r="13"
                                    fill={`url(#${blueId})`}
                                    stroke="#0d3c73"
                                    strokeWidth="2.5"
                                />
                                <path
                                    d="M56 292 H68 M55.5 297 H69 M57 302 H68"
                                    stroke="#d9f4ff"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    opacity="0.75"
                                />
                            </g>
                        </g>

                        {/* Brazo derecho */}
                        <g className={`${styles.arm} ${styles.armRight}`}>
                            <rect
                                x="182"
                                y="216"
                                width="26"
                                height="44"
                                rx="13"
                                fill={`url(#${limbId})`}
                                stroke="#1e63b7"
                                strokeWidth="2.5"
                            />
                            <circle
                                cx="188"
                                cy="218"
                                r="12.5"
                                fill={`url(#${blueId})`}
                                stroke="#0d3c73"
                                strokeWidth="2.5"
                            />
                            <path
                                d="M181 215 Q188 211 195 215"
                                stroke="#8fd8ff"
                                strokeWidth="2"
                                strokeLinecap="round"
                                fill="none"
                                opacity="0.7"
                            />
                            <circle
                                cx="199"
                                cy="258"
                                r="8"
                                fill={`url(#${orangeId})`}
                                stroke="#cf6500"
                                strokeWidth="2"
                            />
                            <rect
                                x="187"
                                y="252"
                                width="23"
                                height="40"
                                rx="11"
                                fill={`url(#${limbId})`}
                                stroke="#1e63b7"
                                strokeWidth="2.5"
                            />
                            <g className={styles.handRight}>
                                <circle
                                    cx="198"
                                    cy="296"
                                    r="13"
                                    fill={`url(#${blueId})`}
                                    stroke="#0d3c73"
                                    strokeWidth="2.5"
                                />
                                <path
                                    d="M192 292 H204 M191.5 297 H205 M193 302 H204"
                                    stroke="#d9f4ff"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    opacity="0.75"
                                />
                            </g>
                        </g>

                        {/* Torso */}
                        <g className={styles.torso}>
                            <rect
                                x="70"
                                y="202"
                                width="120"
                                height="94"
                                rx="34"
                                fill={`url(#${limbId})`}
                                stroke="#1e63b7"
                                strokeWidth="3.2"
                            />
                            <path
                                d="M82 206 Q130 196 178 206"
                                stroke="#ffffff"
                                strokeWidth="3"
                                strokeLinecap="round"
                                fill="none"
                                opacity="0.9"
                            />
                            <rect
                                x="80"
                                y="210"
                                width="100"
                                height="72"
                                rx="26"
                                fill={`url(#${blueId})`}
                            />
                            <path
                                d="M86 220 Q104 212 130 212"
                                stroke="#8fd8ff"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                fill="none"
                                opacity="0.45"
                            />
                            <rect
                                x="103"
                                y="220"
                                width="54"
                                height="42"
                                rx="12"
                                fill="#f8fcff"
                                stroke="#c7e4ff"
                                strokeWidth="1.6"
                            />
                            <text
                                x="130"
                                y="237"
                                textAnchor="middle"
                                fill="#0a2a4f"
                                fontSize="9.5"
                                fontWeight="800"
                                fontFamily="Arial, sans-serif"
                                letterSpacing="0.7"
                            >
                                RIM
                            </text>
                            <text
                                x="130"
                                y="248"
                                textAnchor="middle"
                                fill="#0a2a4f"
                                fontSize="9.5"
                                fontWeight="800"
                                fontFamily="Arial, sans-serif"
                                letterSpacing="0.7"
                            >
                                CODE
                            </text>
                            <rect
                                x="100"
                                y="251"
                                width="60"
                                height="3.4"
                                rx="1.7"
                                fill={`url(#${orangeId})`}
                            />
                            <rect
                                x="88"
                                y="268"
                                width="84"
                                height="12"
                                rx="6"
                                fill={`url(#${orangeId})`}
                            />
                            <rect
                                x="88"
                                y="282"
                                width="84"
                                height="18"
                                rx="9"
                                fill="#1457a7"
                                stroke="#0d3c73"
                                strokeWidth="1.5"
                            />
                            <rect
                                x="78"
                                y="248"
                                width="7"
                                height="18"
                                rx="3.5"
                                fill={`url(#${orangeId})`}
                                opacity="0.95"
                            />
                            <rect
                                x="175"
                                y="248"
                                width="7"
                                height="18"
                                rx="3.5"
                                fill={`url(#${orangeId})`}
                                opacity="0.95"
                            />
                        </g>

                        {/* Cuello */}
                        <rect
                            x="116"
                            y="190"
                            width="28"
                            height="20"
                            rx="8"
                            fill="#12365d"
                        />

                        {/* Orejeras / pods laterales */}
                        <g className={styles.sidePods}>
                            <rect
                                x="18"
                                y="104"
                                width="27"
                                height="56"
                                rx="13.5"
                                fill={`url(#${blueId})`}
                                stroke="#0d3c73"
                                strokeWidth="2.5"
                            />
                            <rect
                                x="22"
                                y="116"
                                width="19"
                                height="30"
                                rx="9.5"
                                fill={`url(#${orangeId})`}
                            />
                            <circle cx="31" cy="152" r="2.4" fill="#8ff6ff" />
                            <rect
                                x="215"
                                y="104"
                                width="27"
                                height="56"
                                rx="13.5"
                                fill={`url(#${blueId})`}
                                stroke="#0d3c73"
                                strokeWidth="2.5"
                            />
                            <rect
                                x="219"
                                y="116"
                                width="19"
                                height="30"
                                rx="9.5"
                                fill={`url(#${orangeId})`}
                            />
                            <circle cx="229" cy="152" r="2.4" fill="#8ff6ff" />
                        </g>

                        {/* Cabeza */}
                        <g className={styles.head}>
                            <rect
                                x="34"
                                y="44"
                                width="192"
                                height="152"
                                rx="66"
                                fill={`url(#${shellId})`}
                                stroke="#1e63b7"
                                strokeWidth="4"
                            />
                            <path
                                d="M60 52 Q130 36 200 52 L194 68 Q130 55 66 68 Z"
                                fill={`url(#${blueId})`}
                            />
                            <path
                                d="M94 56 Q130 47 166 56"
                                stroke={`url(#${orangeId})`}
                                strokeWidth="6"
                                strokeLinecap="round"
                                fill="none"
                            />
                            <path
                                d="M52 72 Q90 60 148 64"
                                stroke="#ffffff"
                                strokeWidth="4"
                                strokeLinecap="round"
                                fill="none"
                                opacity="0.75"
                            />
                            <rect
                                x="52"
                                y="74"
                                width="156"
                                height="100"
                                rx="33"
                                fill="#051525"
                                stroke="#0d4a82"
                                strokeWidth="3"
                            />
                            <rect
                                x="56"
                                y="78"
                                width="148"
                                height="92"
                                rx="29"
                                fill={`url(#${screenId})`}
                            />
                            {animation === "annoyed" && (
                                <rect
                                    className={styles.angryWash}
                                    x="56"
                                    y="78"
                                    width="148"
                                    height="92"
                                    rx="29"
                                    fill={`url(#${angryId})`}
                                />
                            )}
                            <path
                                d="M72 92 H188 M72 104 H188"
                                stroke="#7dd3fc"
                                strokeWidth="1"
                                opacity="0.045"
                            />
                            <ellipse
                                cx="130"
                                cy="124"
                                rx="54"
                                ry="30"
                                fill="#2ce4f7"
                                opacity="0.055"
                            />
                            <path
                                d="M68 86 Q100 77 142 81"
                                stroke="#ffffff"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                fill="none"
                                opacity="0.12"
                            />

                            <g
                                className={
                                    canBlink
                                        ? styles.blink
                                        : styles.blinkDisabled
                                }
                            >
                                {renderEyes()}
                            </g>
                            {renderMouth()}
                        </g>

                        {/* Brazos cruzados (annoyed) */}
                        <g className={styles.crossedArms}>
                            <rect
                                x="76"
                                y="232"
                                width="108"
                                height="19"
                                rx="9.5"
                                fill={`url(#${limbId})`}
                                stroke="#1e63b7"
                                strokeWidth="2.5"
                                transform="rotate(9 130 241)"
                            />
                            <rect
                                x="76"
                                y="244"
                                width="108"
                                height="19"
                                rx="9.5"
                                fill={`url(#${limbId})`}
                                stroke="#1e63b7"
                                strokeWidth="2.5"
                                transform="rotate(-9 130 253)"
                            />
                            <circle
                                cx="84"
                                cy="240"
                                r="11"
                                fill={`url(#${blueId})`}
                                stroke="#0d3c73"
                                strokeWidth="2"
                            />
                            <circle
                                cx="176"
                                cy="252"
                                r="11"
                                fill={`url(#${blueId})`}
                                stroke="#0d3c73"
                                strokeWidth="2"
                            />
                            <path
                                d="M79 240 H89 M174 252 H184"
                                stroke="#d9f4ff"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                opacity="0.7"
                            />
                        </g>

                        {/* Brazo pensativo (thinking) */}
                        <g className={styles.thinkingArm}>
                            <path
                                d="M186 220 Q199 242 183 218 Q173 198 151 184"
                                fill="none"
                                stroke="#1e63b7"
                                strokeWidth="27"
                                strokeLinecap="round"
                            />
                            <path
                                d="M186 220 Q199 242 183 218 Q173 198 151 184"
                                fill="none"
                                stroke={`url(#${limbId})`}
                                strokeWidth="21"
                                strokeLinecap="round"
                            />
                            <circle
                                cx="149"
                                cy="182"
                                r="12"
                                fill={`url(#${blueId})`}
                                stroke="#0d3c73"
                                strokeWidth="2.5"
                            />
                            <path
                                d="M144 180 H154 M144 185 H154"
                                stroke="#d9f4ff"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                opacity="0.7"
                            />
                        </g>
                    </g>
                </g>

                {/* Efectos de estado */}
                {(animation === "greeting" || animation === "happy") && (
                    <g className={styles.sparkles} aria-hidden="true">
                        <Sparkle
                            className={styles.sparkle}
                            x={224}
                            y={156}
                            size={8}
                            color="#8ff6ff"
                        />
                        <Sparkle
                            className={styles.sparkle}
                            x={242}
                            y={184}
                            size={5}
                            color="#ffb347"
                            delay="-0.5s"
                        />
                        <Sparkle
                            className={styles.sparkle}
                            x={210}
                            y={132}
                            size={5}
                            color="#ffffff"
                            delay="-1s"
                        />
                        {animation === "happy" && (
                            <>
                                <Sparkle
                                    className={styles.sparkle}
                                    x={38}
                                    y={150}
                                    size={7}
                                    color="#8ff6ff"
                                    delay="-0.3s"
                                />
                                <Sparkle
                                    className={styles.sparkle}
                                    x={24}
                                    y={212}
                                    size={5}
                                    color="#ffb347"
                                    delay="-0.8s"
                                />
                                <circle
                                    className={styles.confetti}
                                    cx="48"
                                    cy="256"
                                    r="3.4"
                                    fill="#ffb347"
                                />
                                <circle
                                    className={styles.confetti}
                                    cx="212"
                                    cy="270"
                                    r="3.2"
                                    fill="#8ff6ff"
                                    style={{ animationDelay: "-0.4s" }}
                                />
                                <rect
                                    className={styles.confetti}
                                    x="218"
                                    y="222"
                                    width="6"
                                    height="10"
                                    rx="2"
                                    fill="#4fd1ff"
                                    style={{ animationDelay: "-0.7s" }}
                                />
                            </>
                        )}
                    </g>
                )}

                {animation === "annoyed" && (
                    <g className={styles.angryEffects} aria-hidden="true">
                        <g className={styles.smoke}>
                            <circle
                                className={styles.smokePuff}
                                cx="196"
                                cy="56"
                                r="8"
                                fill={`url(#${smokeId})`}
                            />
                            <circle
                                className={styles.smokePuff}
                                cx="210"
                                cy="44"
                                r="11"
                                fill={`url(#${smokeId})`}
                                style={{ animationDelay: "-0.7s" }}
                            />
                            <circle
                                className={styles.smokePuff}
                                cx="228"
                                cy="50"
                                r="7"
                                fill={`url(#${smokeId})`}
                                style={{ animationDelay: "-1.3s" }}
                            />
                        </g>
                        <path
                            className={styles.angerMark}
                            d="M208 84 l10 -14 l2 12 l12 -6 l-7 14 l12 2 l-14 8 l4 10 l-14 -5 l-3 12 l-6 -13 l-10 7 l3 -13 l-12 -2 l13 -6 z"
                            fill="#ff6b2c"
                            opacity="0.8"
                        />
                    </g>
                )}

                {animation === "thinking" && (
                    <g className={styles.thoughts} aria-hidden="true">
                        <circle
                            className={styles.thoughtDot}
                            cx="196"
                            cy="58"
                            r="4"
                        />
                        <circle
                            className={styles.thoughtDot}
                            cx="212"
                            cy="42"
                            r="6"
                            style={{ animationDelay: "-0.5s" }}
                        />
                        <circle
                            className={styles.thoughtDot}
                            cx="230"
                            cy="24"
                            r="8"
                            style={{ animationDelay: "-1s" }}
                        />
                    </g>
                )}

                {(animation === "error" || animation === "fall") && (
                    <g className={styles.bursts} aria-hidden="true">
                        <line
                            className={styles.burstLine}
                            x1="46"
                            y1="84"
                            x2="28"
                            y2="70"
                        />
                        <line
                            className={styles.burstLine}
                            x1="214"
                            y1="88"
                            x2="232"
                            y2="72"
                            style={{ animationDelay: "-0.2s" }}
                        />
                        <line
                            className={styles.burstLine}
                            x1="42"
                            y1="142"
                            x2="22"
                            y2="148"
                            style={{ animationDelay: "-0.4s" }}
                        />
                        <line
                            className={styles.burstLine}
                            x1="218"
                            y1="146"
                            x2="238"
                            y2="154"
                            style={{ animationDelay: "-0.6s" }}
                        />
                        <Sparkle
                            className={styles.sparkle}
                            x={40}
                            y={190}
                            size={6}
                            color="#ffb347"
                            delay="-0.3s"
                        />
                        <Sparkle
                            className={styles.sparkle}
                            x={224}
                            y={196}
                            size={6}
                            color="#8ff6ff"
                            delay="-0.9s"
                        />
                    </g>
                )}
            </g>
        </svg>
    );
}

function Gear({ cx, cy }: { cx: number; cy: number }) {
    const teeth = Array.from({ length: 8 }, (_, index) => index * 45);

    return (
        <g transform={`translate(${cx} ${cy})`}>
            {teeth.map((angle) => (
                <rect
                    key={angle}
                    x="-2.6"
                    y="-14"
                    width="5.2"
                    height="7"
                    rx="1.6"
                    fill="#7ceffc"
                    transform={`rotate(${angle})`}
                />
            ))}
            <circle r="9.5" fill="#7ceffc" />
            <circle r="4.5" fill="#06263f" />
        </g>
    );
}

function Sparkle({
    x,
    y,
    size,
    color,
    className,
    delay,
}: {
    x: number;
    y: number;
    size: number;
    color: string;
    className?: string;
    delay?: string;
}) {
    return (
        <path
            className={className}
            d={`M${x} ${y - size} Q${x + size * 0.24} ${y - size * 0.24} ${x + size} ${y} Q${x + size * 0.24} ${y + size * 0.24} ${x} ${y + size} Q${x - size * 0.24} ${y + size * 0.24} ${x - size} ${y} Q${x - size * 0.24} ${y - size * 0.24} ${x} ${y - size} Z`}
            fill={color}
            style={delay ? { animationDelay: delay } : undefined}
        />
    );
}
