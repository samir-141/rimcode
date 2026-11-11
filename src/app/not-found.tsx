import type { Metadata } from "next";
import Link from "next/link";

import { getNotFoundMetadata } from "@/lib/seo/seo-config";

export const metadata: Metadata = getNotFoundMetadata();

export default function NotFound() {
    return (
        <div className="flex min-h-[75dvh] w-full flex-col items-center justify-center px-4 pt-[92px] pb-16 text-center">
            <div className="max-w-lg rounded-3xl border border-[var(--header-border)] bg-[var(--header-bg)]/80 p-8 backdrop-blur-xl shadow-2xl">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent)]">
                    Error 404
                </p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--header-text)] sm:text-4xl">
                    Página no encontrada
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-[var(--header-muted)]">
                    La ruta que intentas visitar no existe o fue movida. Puedes
                    volver al inicio de RimCode o explorar nuestro portafolio de
                    proyectos.
                </p>

                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                        href="/"
                        className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--accent)] px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-950 transition hover:opacity-90"
                    >
                        Volver al inicio
                    </Link>
                    <Link
                        href="/projects"
                        className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--header-border)] px-6 py-2.5 text-xs font-semibold text-[var(--header-text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                        Ver proyectos
                    </Link>
                </div>
            </div>
        </div>
    );
}

