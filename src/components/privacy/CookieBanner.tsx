"use client";

import Link from "next/link";

type CookieBannerProps = {
    onAcceptAll: () => void;
    onRejectOptional: () => void;
    onOpenSettings: () => void;
};

export default function CookieBanner({
    onAcceptAll,
    onRejectOptional,
    onOpenSettings,
}: CookieBannerProps) {
    return (
        <section
            aria-label="Aviso de cookies"
            className="cookie-banner fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-5 sm:pb-5"
        >
            <div className="cookie-banner-card mx-auto w-full max-w-3xl rounded-3xl border border-[var(--header-border)] bg-[var(--header-bg)]/95 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
                <div className="flex items-start gap-3">
                    <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-sm text-[var(--accent)]"
                    >
                        🍪
                    </span>

                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-bold text-[var(--header-text)] sm:text-base">
                            Tu privacidad es importante para nosotros.
                        </h2>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--header-muted)] sm:text-[13px]">
                            Utilizamos cookies necesarias para garantizar el
                            funcionamiento de RimCode y, con tu autorización,
                            otras tecnologías para analizar la navegación y
                            mejorar nuestros servicios.{" "}
                            <Link
                                href="/legal/cookies"
                                className="font-semibold text-[var(--accent)] underline underline-offset-2 hover:opacity-90"
                            >
                                Política de cookies
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <button
                        type="button"
                        onClick={onAcceptAll}
                        className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-[var(--accent)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-950 transition hover:opacity-90"
                    >
                        Aceptar todas
                    </button>

                    <button
                        type="button"
                        onClick={onRejectOptional}
                        className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full border border-[var(--header-border)] px-4 py-2.5 text-xs font-semibold text-[var(--header-text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                        Rechazar opcionales
                    </button>

                    <button
                        type="button"
                        onClick={onOpenSettings}
                        className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-full px-4 py-2.5 text-xs font-semibold text-[var(--header-muted)] underline underline-offset-2 transition hover:text-[var(--header-text)]"
                    >
                        Configurar preferencias
                    </button>
                </div>
            </div>
        </section>
    );
}
