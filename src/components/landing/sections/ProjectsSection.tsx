"use client";

import Link from "next/link";
import { useState } from "react";
import ProjectCard from "@/components/projects/ProjectCard";
import { getProjects } from "@/lib/db";

export default function ProjectsSection() {
    const allProjects = getProjects();
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Extraer categorías únicas
    const categories = [
        { id: "all", label: "Todos los Proyectos" },
        ...Array.from(new Set(allProjects.map((p) => p.category))).map((cat) => ({
            id: cat,
            label: cat,
        })),
    ];

    const filteredProjects =
        selectedCategory === "all"
            ? allProjects
            : allProjects.filter((p) => p.category === selectedCategory);

    return (
        <div className="relative w-full max-w-7xl mx-auto flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-6">
            {/* Luces decorativas ambientales */}
            <div className="pointer-events-none absolute -left-20 top-20 h-64 sm:h-72 w-64 sm:w-72 rounded-full bg-cyan-500/10 blur-[80px] sm:blur-[100px]" />
            <div className="pointer-events-none absolute -right-20 bottom-10 h-64 sm:h-72 w-64 sm:w-72 rounded-full bg-lime-500/10 blur-[80px] sm:blur-[100px]" />

            {/* ENCABEZADO */}
            <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full border border-[var(--header-border)] bg-[var(--header-bg)]/80 backdrop-blur-md mb-2 sm:mb-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-widest text-[var(--accent)] uppercase">
                        03 / CASOS DE ÉXITO & PORTAFOLIO
                    </span>
                </div>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--header-text)] mb-1.5 sm:mb-2">
                    Proyectos Desarrollados con Excelencia
                </h2>

                <p className="text-xs sm:text-sm text-[var(--header-muted)] max-w-2xl mx-auto leading-relaxed">
                    Casos reales de ingeniería de software construidos con arquitectura limpia,
                    máxima seguridad y experiencia de usuario fluida.
                </p>

                {/* FILTROS POR CATEGORÍA DINÁMICOS */}
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-mono font-medium transition-all cursor-pointer ${
                                selectedCategory === cat.id
                                    ? "bg-[var(--accent)] text-zinc-950 font-bold shadow-xs"
                                    : "border border-[var(--header-border)] bg-[var(--header-bg)]/60 text-[var(--header-muted)] hover:text-[var(--header-text)] hover:border-[var(--accent)]"
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* TARJETAS DE PROYECTOS DINÁMICAS (CONSUMIDAS DESDE DB/PROJECTS.JSON) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredProjects.map((project) => (
                    <ProjectCard key={project.slug} project={project} />
                ))}
            </div>

            {/* CALL TO ACTION DEL BLOQUE */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
                <Link
                    href="/projects"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-[var(--accent)] text-xs font-mono font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-zinc-950 transition-all cursor-pointer"
                >
                    <span>Ver portafolio completo con fichas técnicas</span>
                    <span>→</span>
                </Link>

                <button
                    type="button"
                    onClick={() => {
                        document.getElementById("simulador")?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                        });
                    }}
                    className="text-xs font-mono text-[var(--header-muted)] hover:text-[var(--header-text)] underline cursor-pointer"
                >
                    ¿Quieres una solución similar? Simular presupuesto
                </button>
            </div>
        </div>
    );
}
