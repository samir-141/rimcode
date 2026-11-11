"use client";

import { useState } from "react";

import { getCurrencySymbol, useCurrency } from "@/lib/currency";
import { getServices } from "@/lib/db";

const servicesData = getServices();

const QUOTE_STORAGE_KEY = "rimcode:quote";

export default function SimulatorSection() {
    const { currency, rates } = useCurrency();

    // Mapear los servicios elegibles para presupuesto base (> 0)
    const baseProjects = servicesData.services.filter((s) => s.basePriceUSD > 0);

    const [selectedProjectId, setSelectedProjectId] = useState<string>(
        baseProjects[1]?.id || baseProjects[0]?.id || "webapp"
    );

    const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
        "auth",
        "admin",
    ]);

    const [isExpress, setIsExpress] = useState(false);

    const toggleFeature = (featId: string) => {
        setSelectedFeatures((prev) =>
            prev.includes(featId) ? prev.filter((f) => f !== featId) : [...prev, featId]
        );
    };

    const currentProject =
        baseProjects.find((p) => p.id === selectedProjectId) || baseProjects[0];

    const baseCostUSD = currentProject ? currentProject.basePriceUSD : 1800;

    const featuresCostUSD = selectedFeatures.reduce((acc, featId) => {
        const mod = servicesData.modules.find((m) => m.id === featId);
        return acc + (mod ? mod.priceUSD : 0);
    }, 0);

    const subtotalUSD = baseCostUSD + featuresCostUSD;
    const totalUSD = isExpress
        ? subtotalUSD * servicesData.delivery.expressMultiplier
        : subtotalUSD;

    // Conversión a moneda activa
    const rate = rates[currency] || 1;
    const finalAmount = Math.round(totalUSD * rate);
    const currencySymbol = getCurrencySymbol(currency);

    const handleTransferToContact = () => {
        const quote = {
            projectType: currentProject?.name || "",
            projectTypeId: currentProject?.id || "",
            service: currentProject?.contactLabel || currentProject?.name || "",
            modules: selectedFeatures
                .map((featId) => servicesData.modules.find((m) => m.id === featId)?.name)
                .filter((name): name is string => Boolean(name)),
            express: isExpress,
            totalUSD: Math.round(totalUSD),
            currency,
            total: finalAmount,
        };

        try {
            sessionStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(quote));
        } catch {
            // Sin sessionStorage: el formulario igual recibe el evento.
        }

        window.dispatchEvent(new CustomEvent("rimcode:quote", { detail: quote }));

        const contactSection = document.getElementById("contactanos");
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    return (
        <div className="relative w-full max-w-7xl mx-auto flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-6">
            {/* Luces decorativas ambientales */}
            {/* Luces decorativas */}
            <div className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />
            <div className="pointer-events-none absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-lime-500/10 blur-[100px]" />

            {/* ENCABEZADO */}
            <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[var(--header-border)] bg-[var(--header-bg)]/80 backdrop-blur-md mb-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-widest text-[var(--accent)] uppercase">
                        04 / SIMULADOR DE PRESUPUESTO
                    </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--header-text)] mb-2">
                    Calcula tu Inversión en Segundos
                </h2>

                <p className="text-xs sm:text-sm text-[var(--header-muted)] max-w-2xl mx-auto leading-relaxed">
                    {servicesData.helpText} ({currency}).
                </p>
            </div>

            {/* PANEL PRINCIPAL DEL SIMULADOR (DOS COLUMNAS EN DESKTOP, APILADO EN MÓVIL/TABLET) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
                {/* COLUMNA IZQUIERDA: CONTROLES INTERACTIVOS */}
                <div className="lg:col-span-7 space-y-4 rounded-3xl border border-[var(--header-border)] bg-[var(--header-bg)]/80 backdrop-blur-xl p-4 sm:p-6 flex flex-col justify-between">
                    {/* PASO 1: TIPO DE PROYECTO */}
                    <div>
                        <label className="text-xs font-mono font-semibold text-[var(--header-text)] uppercase tracking-wider block mb-2.5">
                            1. Selecciona el Tipo de Proyecto
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {baseProjects.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setSelectedProjectId(item.id)}
                                    className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all cursor-pointer min-h-[58px] ${
                                        selectedProjectId === item.id
                                            ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--header-text)] shadow-xs ring-1 ring-[var(--accent)]/50"
                                            : "border-[var(--header-border)] hover:border-[var(--accent)]/60 text-[var(--header-muted)] bg-black/5 dark:bg-white/5"
                                        }`}
                                >
                                    <div className="text-xs sm:text-sm font-bold text-[var(--header-text)]">
                                        {item.name}
                                    </div>
                                    <div className="text-[10px] sm:text-[11px] text-[var(--header-muted)] mt-0.5">
                                        {item.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PASO 2: CARACTERÍSTICAS Y MÓDULOS */}
                    <div>
                        <label className="text-xs font-mono font-semibold text-[var(--header-text)] uppercase tracking-wider block mb-2.5">
                            2. Módulos y Funcionalidades Clave
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {servicesData.modules.map((feat) => {
                                const isChecked = selectedFeatures.includes(feat.id);
                                return (
                                    <button
                                        key={feat.id}
                                        type="button"
                                        onClick={() => toggleFeature(feat.id)}
                                        className={`p-2.5 sm:p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between min-h-[44px] ${
                                            isChecked
                                                ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--header-text)] font-semibold ring-1 ring-[var(--accent)]/50"
                                                : "border-[var(--header-border)] text-[var(--header-muted)] hover:border-[var(--accent)]/40 bg-black/5 dark:bg-white/5"
                                            }`}
                                    >
                                        <span className="leading-tight">{feat.name}</span>
                                        <span
                                            className={`text-xs ml-1.5 shrink-0 ${
                                                isChecked
                                                    ? "text-[var(--accent)] font-bold"
                                                    : "opacity-40"
                                            }`}
                                        >
                                            {isChecked ? "✔" : "+"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* PASO 3: VELOCIDAD DE ENTREGA */}
                    <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5">
                        <div className="pr-2">
                            <span className="text-xs sm:text-sm font-bold text-[var(--header-text)] block">
                                Entrega Express Prioritaria
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-[var(--header-muted)]">
                                {servicesData.delivery.expressLabel}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsExpress(!isExpress)}
                            aria-label="Alternar entrega express"
                            className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                                isExpress ? "bg-[var(--accent)]" : "bg-zinc-300 dark:bg-zinc-700"
                            }`}
                        >
                            <span
                                className={`absolute top-1 left-1 bg-white dark:bg-zinc-950 w-4.5 h-4.5 rounded-full transition-transform ${isExpress ? "translate-x-5.5" : ""
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* COLUMNA DERECHA: RESULTADO EN VIVO Y COTIZACIÓN */}
                <div className="lg:col-span-5 rounded-3xl border border-[var(--accent)] bg-[var(--header-bg)] p-5 sm:p-6 shadow-2xl flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-[var(--header-border)] mb-4">
                            <span className="text-xs font-mono font-bold text-[var(--accent)] uppercase tracking-wider">
                                Resumen Estimado
                            </span>
                            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]">
                                Moneda: {currency}
                            </span>
                        </div>

                        <div className="text-center py-3 sm:py-5">
                            <span className="text-xs font-mono text-[var(--header-muted)] block mb-1">
                                Inversión estimada del proyecto
                            </span>
                            <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--accent)] tracking-tight font-mono">
                                {currencySymbol} {finalAmount.toLocaleString("es-ES")}{" "}
                                <span className="text-xs sm:text-sm font-normal text-[var(--header-muted)]">
                                    {currency}
                                </span>
                            </div>
                            <span className="text-[11px] text-[var(--header-muted)] mt-2 block">
                                Tiempo de entrega:{" "}
                                {isExpress
                                    ? servicesData.delivery.express
                                    : servicesData.delivery.standard}
                            </span>
                        </div>

                        {/* DESGLOSE RÁPIDO */}
                        <div className="space-y-2 p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--header-border)] text-[11px] font-mono text-[var(--header-muted)]">
                            <div className="flex justify-between">
                                <span>Proyecto Base:</span>
                                <span className="text-[var(--header-text)] font-semibold uppercase">
                                    {currentProject.name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Módulos incluidos:</span>
                                <span className="text-[var(--accent)] font-semibold">
                                    {selectedFeatures.length} adicionales
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Soporte post-lanzamiento:</span>
                                <span className="text-[var(--header-text)]">
                                    Incluido ({servicesData.delivery.postLaunchSupportDays} días)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[var(--header-border)]">
                        <button
                            type="button"
                            onClick={handleTransferToContact}
                            className="w-full py-3.5 sm:py-4 rounded-full font-bold text-xs uppercase tracking-wider bg-[var(--accent)] text-zinc-950 transition-all hover:opacity-90 hover:shadow-[0_0_20px_var(--accent)] cursor-pointer min-h-[44px] flex items-center justify-center"
                        >
                            Cotizar Formalmente con este Presupuesto ↗
                        </button>
                        <p className="text-[10px] text-[var(--header-muted)] text-center mt-2 font-mono">
                            {servicesData.disclaimer}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
