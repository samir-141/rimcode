"use client";

import { useState } from "react";
import { getMethodology, getCompany } from "@/lib/db";

const methodology = getMethodology();
const company = getCompany();

export default function MethodologySection() {
    const [activeStep, setActiveStep] = useState(0);

    return (
        <div className="relative w-full max-w-7xl mx-auto flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-6">
            {/* Luces decorativas ambientales */}
            <div className="pointer-events-none absolute -left-20 bottom-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />
            <div className="pointer-events-none absolute -right-20 top-1/4 h-72 w-72 rounded-full bg-lime-500/10 blur-[100px]" />

            {/* ENCABEZADO */}
            <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[var(--header-border)] bg-[var(--header-bg)]/80 backdrop-blur-md mb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-widest text-[var(--accent)] uppercase">
                        05 / METODOLOGÍA CLEAN CODE
                    </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--header-text)] mb-2">
                    Cómo Trabajamos: Del Concepto a Producción
                </h2>

                <p className="text-xs sm:text-sm text-[var(--header-muted)] max-w-2xl mx-auto leading-relaxed">
                    {methodology.intro}
                </p>
            </div>

            {/* FASES EN 4 BLOQUES RESPONSIVOS (DESDE DB/METHODOLOGY.JSON) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {methodology.steps.map((step, idx) => {
                    const isSelected = activeStep === idx;
                    return (
                        <div
                            key={step.num}
                            onClick={() => setActiveStep(idx)}
                            onMouseEnter={() => setActiveStep(idx)}
                            className={`group p-4 sm:p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                                isSelected
                                    ? "border-[var(--accent)] bg-[var(--header-bg)] shadow-xl shadow-[var(--accent)]/10 -translate-y-1 ring-1 ring-[var(--accent)]/40"
                                    : "border-[var(--header-border)] bg-[var(--header-bg)]/70 hover:border-[var(--accent)]/60"
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <span className="font-mono text-3xl font-black text-[var(--accent)]">
                                        {step.num}
                                    </span>
                                    <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full border border-[var(--header-border)] text-[var(--header-muted)] bg-black/5 dark:bg-white/5">
                                        {step.tag}
                                    </span>
                                </div>

                                <h3 className="text-sm sm:text-base font-bold text-[var(--header-text)] mb-2 group-hover:text-[var(--accent)] transition-colors leading-snug">
                                    {step.title}
                                </h3>

                                <p className="text-xs text-[var(--header-muted)] leading-relaxed mb-4">
                                    {step.description}
                                </p>
                            </div>

                            <div className="pt-3 border-t border-[var(--header-border)]">
                                <span className="text-[10px] font-mono text-[var(--header-muted)] block mb-0.5">
                                    Entregable garantizado:
                                </span>
                                <span className="text-xs font-semibold text-[var(--header-text)] flex items-start sm:items-center gap-1.5 leading-tight">
                                    <span className="text-[var(--accent)] shrink-0">✔</span>
                                    <span>{step.deliverable}</span>
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* GARANTÍA RIMCODE RESPONSIVE */}
            <div className="mt-4 sm:mt-6 p-4 sm:p-5 rounded-2xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3">
                    <span className="text-2xl shrink-0">🛡️</span>
                    <div>
                        <h4 className="text-xs sm:text-sm font-bold text-[var(--header-text)]">
                            {methodology.guarantee.title}
                        </h4>
                        <p className="text-[11px] text-[var(--header-muted)] mt-0.5 leading-relaxed">
                            {methodology.guarantee.description}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        document.getElementById("contactanos")?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                    }}
                    className="w-full sm:w-auto px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--accent)] text-[var(--accent-ink)] hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer min-h-[44px] flex items-center justify-center shrink-0"
                >
                    Iniciar Proyecto ↗
                </button>
            </div>

            {/* VALORES DE RIMCODE (desde company.json > values[]) */}
            {company.values.length > 0 && (
                <div className="mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    {company.values.map((value) => (
                        <div
                            key={value.name}
                            className="p-3 sm:p-4 rounded-2xl border border-[var(--header-border)] bg-[var(--header-bg)]/60 text-center"
                        >
                            <div className="text-[11px] sm:text-xs font-bold text-[var(--accent)] font-mono mb-1">
                                {value.name}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-[var(--header-muted)] leading-relaxed">
                                {value.description}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
