"use client";

import { useState } from "react";
import { getTechnologies } from "@/lib/db";

const techData = getTechnologies();

export default function TechSection() {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const filteredTechs =
        selectedCategory === "all"
            ? techData.items
            : techData.items.filter((t) => t.category === selectedCategory);

    return (
        <div className="relative w-full max-w-7xl mx-auto flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-6">
            {/* Luces decorativas ambientales */}
            <div className="pointer-events-none absolute -left-20 bottom-10 h-64 sm:h-72 w-64 sm:w-72 rounded-full bg-cyan-500/10 blur-[80px] sm:blur-[100px]" />
            <div className="pointer-events-none absolute -right-20 top-10 h-64 sm:h-72 w-64 sm:w-72 rounded-full bg-lime-500/10 blur-[80px] sm:blur-[100px]" />

            {/* ENCABEZADO DEL BLOQUE */}
            <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full border border-[var(--header-border)] bg-[var(--header-bg)]/80 backdrop-blur-md mb-2 sm:mb-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-widest text-[var(--accent)] uppercase">
                        02 / STACK TECNOLÓGICO
                    </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--header-text)] mb-1.5 sm:mb-2">
                    Arquitectura de Vanguardia & Código Limpio
                </h2>

                <p className="text-xs sm:text-sm text-[var(--header-muted)] max-w-2xl mx-auto leading-relaxed">
                    {techData.intro}
                </p>

                {/* FILTROS POR CATEGORÍA (CENTRALIZADOS DESDE DB) */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                    {techData.categories.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedCategory(tab.id)}
                            className={`px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-medium transition-all cursor-pointer ${
                                selectedCategory === tab.id
                                    ? "bg-[var(--accent)] text-zinc-950 font-bold shadow-xs"
                                    : "border border-[var(--header-border)] bg-[var(--header-bg)]/60 text-[var(--header-muted)] hover:text-[var(--header-text)] hover:border-[var(--accent)]"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* GRID DE TECNOLOGÍAS RESPONSIVO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3.5">
                {filteredTechs.map((tech) => (
                    <div
                        key={tech.id}
                        className="group relative p-3 sm:p-4 rounded-2xl border border-[var(--header-border)] bg-[var(--header-bg)]/80 backdrop-blur-md hover:border-[var(--accent)] transition-all duration-300 hover:-translate-y-1 shadow-xs hover:shadow-md flex flex-col justify-between"
                    >
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
                                    {tech.tag}
                                </span>
                                <span className="text-[9px] font-mono text-[var(--header-muted)] px-1.5 py-0.5 rounded-full bg-black/5 dark:bg-white/5">
                                    {tech.highlight}
                                </span>
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-[var(--header-text)] group-hover:text-[var(--accent)] transition-colors">
                                {tech.name}
                            </h3>

                            <p className="text-[11px] leading-relaxed text-[var(--header-muted)] mt-1">
                                {tech.description}
                            </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-[var(--header-border)] flex items-center justify-between text-[10px] text-[var(--header-muted)] font-mono">
                            <span>Clean Code</span>
                            <span className="text-[var(--accent)]">● Activo</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* BARRA DE MÉTRICAS INFERIOR (DESDE DB/TECHNOLOGIES.JSON) */}
            <div className="mt-4 sm:mt-6 pt-3 border-t border-[var(--header-border)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {techData.metrics.map((metric, idx) => (
                    <div
                        key={idx}
                        className="p-2 rounded-xl bg-black/5 dark:bg-white/5 sm:bg-transparent"
                    >
                        <div className="text-base sm:text-xl font-extrabold text-[var(--accent)] font-mono">
                            {metric.value}
                        </div>
                        <div className="text-[10px] text-[var(--header-muted)] font-mono">
                            {metric.label}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
