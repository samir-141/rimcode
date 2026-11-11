"use client";

/**
 * Hueco reservado para RIMY dentro del Hero.
 *
 * La mascota real es una única instancia fija (RimyController) que se alinea a
 * este espacio. Así la transición Hero -> flotante no reconstruye el personaje
 * ni reinicia su máquina de estados.
 */
export default function RimyHero() {
    return (
        <div className="relative flex w-full min-h-[280px] sm:min-h-[380px] py-6 sm:py-12 flex-col items-center justify-center text-center">
            <div
                id="rimy-hero-slot"
                className="relative aspect-[260/362] w-full max-w-[160px] sm:max-w-[220px] lg:max-w-[280px]"
                aria-hidden="true"
            >
                {/* Halo ambiental */}
                <div className="pointer-events-none absolute inset-x-3 bottom-5 h-16 rounded-[50%] bg-cyan-400/20 blur-2xl dark:bg-cyan-400/15" />
                <div className="pointer-events-none absolute inset-4 rounded-[46%] border border-cyan-400/15" />
                <div
                    className="pointer-events-none absolute inset-9 animate-spin rounded-[46%] border border-dashed border-cyan-400/15 motion-reduce:animate-none"
                    style={{ animationDuration: "52s" }}
                />

                {/* Plataforma de luz */}
                <div className="pointer-events-none absolute bottom-[3.5%] left-1/2 h-[3.2%] w-[64%] -translate-x-1/2 rounded-[50%] border border-cyan-400/25 bg-cyan-400/[0.06] shadow-[0_0_30px_rgba(34,211,238,0.18)]" />
                <div className="pointer-events-none absolute bottom-[2.8%] left-1/2 h-px w-[46%] -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-400/45 to-transparent" />
            </div>

            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--header-border)] bg-[var(--header-bg)]/80 px-3 py-1 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
                <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-[var(--header-muted)] uppercase">
                    RIMY · Compañero digital
                </span>
            </div>

            <p className="mt-1 font-mono text-[9px] tracking-[0.18em] text-[var(--header-muted)]/70 uppercase">
                Tócame para interactuar
            </p>
        </div>
    );
}
