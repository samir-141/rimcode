"use client";

import { useState } from "react";
import RimyHero from "@/components/rimy/RimyHero";
import { getCompany, getRimy } from "@/lib/db";

const company = getCompany();
const rimy = getRimy();

const WELCOME_MESSAGES = [
    rimy.greeting.text,
    company.valueProposition,
    company.description,
    `Fundado por ${company.founder.name}. ¿Listo para construir tu solución?`,
];

export default function WelcomeSection() {
    const [messageIndex, setMessageIndex] = useState(0);

    const nextMessage = () => {
        setMessageIndex((current) => (current + 1) % WELCOME_MESSAGES.length);
    };

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    return (
        <div className="relative w-full max-w-7xl mx-auto flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-6">
            {/* Luces decorativas ambientales */}
            <div className="pointer-events-none absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px]" />
            <div className="pointer-events-none absolute -right-20 bottom-1/4 h-80 w-80 rounded-full bg-lime-500/10 blur-[100px]" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
                {/* COLUMNA TEXTO Y PROPUESTA (IZQUIERDA EN DESKTOP) */}
                <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-3.5 sm:space-y-4">
                    {/* BADGE DE BIENVENIDA */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--header-border)] bg-[var(--header-bg)]/80 backdrop-blur-md shadow-xs">
                        <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
                        <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-wider uppercase text-[var(--accent)]">
                            DIGITAL SOLUTIONS / {company.name.toUpperCase()}
                        </span>
                    </div>

                    {/* TITULAR PRINCIPAL */}
                    <div className="space-y-1.5">
                        <p className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.25em] text-cyan-500 dark:text-cyan-400 font-semibold">
                            {company.tagline}
                        </p>
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-[var(--header-text)]">
                            Tus ideas,
                            <br />
                            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-[var(--accent)] bg-clip-text text-transparent">
                                nuestro código.
                            </span>
                        </h1>
                    </div>

                    {/* DESCRIPCIÓN CENTRALIZADA */}
                    <p className="max-w-xl text-xs sm:text-sm md:text-base leading-relaxed text-[var(--header-muted)]">
                        {company.description}
                    </p>

                    {/* BADGE DEL FUNDADOR */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 text-[10px] sm:text-[11px] font-mono text-[var(--header-muted)]">
                        <span className="text-[var(--accent)] font-bold">⚡</span>
                        <span>
                            Fundador:{" "}
                            <strong className="text-[var(--header-text)]">
                                {company.founder.name}
                            </strong>
                        </span>
                    </div>

                    {/* DIÁLOGO INTERACTIVO DE RIMY (VISIBLE EN TABLET Y DESKTOP) */}
                    <div className="hidden sm:block w-full max-w-lg rounded-2xl border border-cyan-500/25 bg-[var(--header-bg)]/90 backdrop-blur-md p-3.5 sm:p-4 shadow-lg shadow-cyan-950/10 text-left transition-all hover:border-[var(--accent)]">
                        <div className="mb-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                                <span className="text-[10px] font-bold tracking-widest text-cyan-500 dark:text-cyan-400 uppercase font-mono">
                                    {rimy.name} SAYS
                                </span>
                            </div>
                            <span className="text-[10px] font-mono text-[var(--header-muted)]">
                                {messageIndex + 1}/{WELCOME_MESSAGES.length}
                            </span>
                        </div>

                        <p className="min-h-8 text-xs sm:text-sm leading-relaxed text-[var(--header-text)] font-medium">
                            {WELCOME_MESSAGES[messageIndex]}
                        </p>

                        <button
                            type="button"
                            onClick={nextMessage}
                            className="mt-1.5 text-xs font-semibold text-cyan-500 hover:text-[var(--accent)] transition-colors cursor-pointer flex items-center gap-1"
                        >
                            <span>Siguiente mensaje</span>
                            <span>→</span>
                        </button>
                    </div>

                    {/* BOTONES DE ACCIÓN RESPONSIVOS */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-2.5 sm:gap-3 w-full sm:w-auto pt-1">
                        <button
                            type="button"
                            onClick={() => scrollTo("contactanos")}
                            className="px-6 py-3 rounded-full font-bold text-xs uppercase tracking-wider bg-[var(--accent)] text-zinc-950 transition-all hover:opacity-90 hover:shadow-[0_0_20px_var(--accent)] cursor-pointer min-h-[44px] flex items-center justify-center"
                        >
                            Hablemos de tu proyecto ↗
                        </button>

                        <button
                            type="button"
                            onClick={() => scrollTo("simulador")}
                            className="px-5 py-3 rounded-full font-semibold text-xs tracking-wide border border-[var(--header-border)] bg-[var(--header-bg)] text-[var(--header-text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
                        >
                            Simular Presupuesto
                        </button>

                        <button
                            type="button"
                            onClick={() => scrollTo("tecnologias")}
                            className="px-4 py-3 rounded-full font-medium text-xs text-[var(--header-muted)] hover:text-[var(--header-text)] transition-colors cursor-pointer min-h-[44px] flex items-center justify-center"
                        >
                            Ver Tecnologías ↓
                        </button>
                    </div>
                </div>

                {/* COLUMNA DERECHA: RIMY, MASCOTA PROTAGONISTA DEL HERO */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center pt-2 lg:pt-0">
                    <RimyHero />
                </div>
            </div>
        </div>
    );
}
