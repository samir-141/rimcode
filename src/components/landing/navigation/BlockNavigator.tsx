"use client";

interface BlockNavigatorProps {
    activeBlock: string;
    onNavigate: (id: string) => void;
    blocks: { id: string; label: string; num: string }[];
}

export default function BlockNavigator({
    activeBlock,
    onNavigate,
    blocks,
}: BlockNavigatorProps) {
    const currentIndex = blocks.findIndex((b) => b.id === activeBlock);

    const handlePrev = () => {
        if (currentIndex > 0) {
            onNavigate(blocks[currentIndex - 1].id);
        }
    };

    const handleNext = () => {
        if (currentIndex < blocks.length - 1) {
            onNavigate(blocks[currentIndex + 1].id);
        }
    };

    return (
        <aside
            className="fixed right-3 xl:right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-center gap-2 p-2 rounded-full border border-[var(--header-border)] bg-[var(--header-bg)]/80 backdrop-blur-xl shadow-2xl transition-all"
            aria-label="Navegación por bloques"
        >
            {/* BOTÓN SUBIR BLOQUE */}
            <button
                type="button"
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                className="w-7 h-7 flex items-center justify-center rounded-full text-xs text-[var(--header-muted)] hover:text-[var(--accent)] hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Subir al bloque anterior (Flecha Arriba)"
                aria-label="Bloque anterior"
            >
                ▲
            </button>

            {/* PUNTOS INDICADORES DE BLOQUE */}
            <div className="flex flex-col items-center gap-2.5 py-1">
                {blocks.map((block) => {
                    const isActive = block.id === activeBlock;
                    return (
                        <button
                            key={block.id}
                            type="button"
                            onClick={() => onNavigate(block.id)}
                            className="group relative flex items-center justify-center p-1 cursor-pointer"
                            aria-label={`Ir a ${block.label}`}
                            aria-current={isActive ? "step" : undefined}
                        >
                            {/* PUNTO VISUAL */}
                            <span
                                className={`rounded-full transition-all duration-300 ${
                                    isActive
                                        ? "w-2.5 h-6 bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]"
                                        : "w-2 h-2 bg-[var(--header-muted)]/50 group-hover:bg-[var(--accent)] group-hover:scale-125"
                                }`}
                            />

                            {/* TOOLTIP FLOTANTE A LA IZQUIERDA */}
                            <span className="pointer-events-none absolute right-full mr-3.5 px-3 py-1 rounded-xl border border-[var(--header-border)] bg-[var(--header-bg)] text-[var(--header-text)] text-[11px] font-mono whitespace-nowrap opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shadow-xl z-50">
                                <span className="text-[var(--accent)] mr-1.5 font-bold">
                                    {block.num}
                                </span>
                                {block.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* BOTÓN BAJAR BLOQUE */}
            <button
                type="button"
                onClick={handleNext}
                disabled={currentIndex >= blocks.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded-full text-xs text-[var(--header-muted)] hover:text-[var(--accent)] hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Bajar al siguiente bloque (Flecha Abajo)"
                aria-label="Siguiente bloque"
            >
                ▼
            </button>
        </aside>
    );
}
