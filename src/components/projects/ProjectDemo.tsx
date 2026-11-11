"use client";

import { useEffect, useRef, useState } from "react";

import type { Project } from "@/lib/db/types";

type ProjectDemoProps = {
    project: Project;
};

export default function ProjectDemo({ project }: ProjectDemoProps) {
    const { demo } = project;
    const [loaded, setLoaded] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!demo.enabled || !demo.url) return;

        timerRef.current = window.setTimeout(() => {
            if (!loaded) setTimedOut(true);
        }, 12000);

        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, [demo.enabled, demo.url, loaded]);

    if (!demo.enabled || !demo.url) {
        return (
            <div className="rounded-3xl border border-dashed border-[var(--header-border)] bg-[var(--header-bg)]/60 p-6 text-center">
                <p className="text-sm font-semibold text-[var(--header-text)]">
                    Demostración pública pendiente
                </p>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[var(--header-muted)]">
                    Este proyecto todavía no cuenta con una URL de demostración
                    documentada. No se muestra una demo simulada ni un enlace
                    inventado.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="text-sm font-semibold text-[var(--header-text)]">
                        {demo.title}
                    </p>
                    {demo.description && (
                        <p className="mt-0.5 text-xs text-[var(--header-muted)]">
                            {demo.description}
                        </p>
                    )}
                </div>

                <a
                    href={demo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[var(--accent)] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-zinc-950"
                >
                    Abrir demo en otra pestaña ↗
                </a>
            </div>

            <div
                className="relative w-full overflow-hidden rounded-2xl border border-[var(--header-border)] bg-black/20"
                style={{ aspectRatio: demo.aspectRatio || "16 / 9" }}
            >
                {!loaded && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[var(--header-bg)] p-4 text-center">
                        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                        <p className="font-mono text-[10px] text-[var(--header-muted)]">
                            Cargando demostración...
                        </p>
                    </div>
                )}

                <iframe
                    src={demo.url}
                    title={demo.title || `Demostración de ${project.name}`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    allow="fullscreen"
                    className="h-full w-full border-0"
                    onLoad={() => {
                        setLoaded(true);
                        setTimedOut(false);
                    }}
                />
            </div>

            {timedOut && (
                <div
                    role="status"
                    className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-700 dark:text-amber-300"
                >
                    La demo no terminó de cargar. Algunos sitios bloquean su
                    visualización dentro de un iframe por políticas de
                    seguridad. Usa el botón «Abrir demo en otra pestaña»; no se
                    intenta evadir esa política.
                </div>
            )}

            <p className="text-[10px] leading-relaxed text-[var(--header-muted)]">
                Si el sitio de la demo bloquea iframes, verás un espacio vacío o
                un error del navegador. En ese caso, ábrela en una pestaña
                nueva.
            </p>
        </div>
    );
}
