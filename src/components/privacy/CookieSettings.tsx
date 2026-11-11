"use client";

import Link from "next/link";
import { useState } from "react";
import type { ConsentCategories, ConsentRecord } from "@/types/consent";
import { getCookieCategories, type CookieCategory } from "@/lib/privacy/config";

type CookieSettingsProps = {
    open: boolean;
    initialRecord: ConsentRecord | null;
    onClose: () => void;
    onSave: (categories: ConsentCategories) => void;
    onAcceptAll: () => void;
    onRejectOptional: () => void;
};

export default function CookieSettings({
    open,
    initialRecord,
    onClose,
    onSave,
    onAcceptAll,
    onRejectOptional,
}: CookieSettingsProps) {
    const categories = getCookieCategories();

    const [selected, setSelected] = useState<ConsentCategories>({
        necessary: true,
        preferences: initialRecord?.categories.preferences ?? false,
        analytics: initialRecord?.categories.analytics ?? false,
        marketing: initialRecord?.categories.marketing ?? false,
    });

    if (!open) return null;

    const toggle = (id: keyof ConsentCategories) => {
        if (id === "necessary") return;
        setSelected((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-settings-title"
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
            <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-[var(--header-border)] bg-[var(--header-bg)] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--header-border)] p-5">
                    <div>
                        <h2
                            id="cookie-settings-title"
                            className="text-lg font-bold text-[var(--header-text)]"
                        >
                            Centro de Preferencias de Privacidad
                        </h2>
                        <p className="text-xs text-[var(--header-muted)] mt-0.5">
                            Configura qué cookies y tecnologías permites en RimCode
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-full p-2 text-[var(--header-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--header-text)] transition cursor-pointer"
                        aria-label="Cerrar modal"
                    >
                        ✕
                    </button>
                </div>

                {/* Body (scrollable) */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <p className="text-xs leading-relaxed text-[var(--header-muted)]">
                        Cumpliendo con la Ley N.º 29733 de Protección de Datos Personales del Perú y estándares internacionales, te damos el control total de tus datos. Las cookies necesarias siempre están activas para el correcto funcionamiento técnico.
                    </p>

                    <div className="space-y-3">
                        {categories.map((cat: CookieCategory) => {
                            const isNecessary = cat.id === "necessary";
                            const isChecked = isNecessary || selected[cat.id as keyof ConsentCategories];

                            return (
                                <div
                                    key={cat.id}
                                    className="p-4 rounded-2xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 space-y-2"
                                >
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <span className="text-sm font-bold text-[var(--header-text)] flex items-center gap-2">
                                                {cat.name}
                                                {isNecessary && (
                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-semibold">
                                                        Obligatoria
                                                    </span>
                                                )}
                                            </span>
                                            <p className="text-xs text-[var(--header-muted)] mt-0.5">
                                                {cat.shortDescription}
                                            </p>
                                        </div>

                                        <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                disabled={isNecessary}
                                                onChange={() => toggle(cat.id as keyof ConsentCategories)}
                                                className="sr-only peer"
                                                aria-label={`Permitir ${cat.name}`}
                                            />
                                            <div className="w-11 h-6 bg-zinc-300 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--accent)]"></div>
                                        </label>
                                    </div>

                                    <p className="text-[11px] text-[var(--header-muted)] leading-relaxed pt-1 border-t border-[var(--header-border)]/50">
                                        {cat.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-2 text-center text-xs text-[var(--header-muted)]">
                        Consulta más detalles en nuestra{" "}
                        <Link
                            href="/legal/cookies"
                            onClick={onClose}
                            className="text-[var(--accent)] underline hover:opacity-90 font-medium"
                        >
                            Política de Cookies
                        </Link>{" "}
                        y{" "}
                        <Link
                            href="/legal/privacidad"
                            onClick={onClose}
                            className="text-[var(--accent)] underline hover:opacity-90 font-medium"
                        >
                            Política de Privacidad
                        </Link>.
                    </div>
                </div>

                {/* Footer buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-[var(--header-border)] p-4 bg-black/5 dark:bg-white/5">
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onRejectOptional}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-full border border-[var(--header-border)] text-xs font-semibold text-[var(--header-text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition cursor-pointer"
                        >
                            Rechazar opcionales
                        </button>
                        <button
                            type="button"
                            onClick={onAcceptAll}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-full border border-[var(--header-border)] text-xs font-semibold text-[var(--header-text)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition cursor-pointer"
                        >
                            Aceptar todas
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => onSave(selected)}
                        className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[var(--accent)] text-zinc-950 font-bold text-xs uppercase tracking-wider hover:opacity-90 transition cursor-pointer shadow-sm"
                    >
                        Guardar Preferencias
                    </button>
                </div>
            </div>
        </div>
    );
}
