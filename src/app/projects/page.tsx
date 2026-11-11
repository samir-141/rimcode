import type { Metadata } from "next";
import Link from "next/link";

import ProjectCard from "@/components/projects/ProjectCard";
import { getProjects, getSiteUrl } from "@/lib/db";

export const metadata: Metadata = {
    title: "Portafolio de Proyectos",
    description:
        "Proyectos documentados de RimCode: plataformas SaaS, inteligencia de negocios y comercio electrónico de alto rendimiento.",
    alternates: {
        canonical: "/projects",
    },
    openGraph: {
        title: "Portafolio de Proyectos | RimCode",
        description:
            "Proyectos documentados de RimCode: plataformas SaaS, inteligencia de negocios y comercio electrónico de alto rendimiento.",
        url: `${getSiteUrl()}/projects`,
        type: "website",
    },
};

export default function ProjectsPage() {
    const projects = getProjects();

    return (
        <div className="w-full bg-[var(--background)] pb-20 text-[var(--foreground)]">
            <div className="mx-auto w-full max-w-6xl px-4 pt-[100px] sm:px-6 lg:px-8 lg:pt-[112px]">
                <nav
                    aria-label="Migas de pan"
                    className="flex items-center gap-2 font-mono text-[10px] text-[var(--header-muted)]"
                >
                    <Link href="/" className="hover:text-[var(--accent)]">
                        Inicio
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-[var(--header-text)]">Proyectos</span>
                </nav>

                <header className="mt-5 max-w-3xl">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                        Portafolio RimCode
                    </p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--header-text)] sm:text-4xl lg:text-5xl">
                        Proyectos documentados, sin métricas inventadas
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--header-muted)] sm:text-base">
                        Cada ficha presenta la información realmente documentada
                        del proyecto. Los campos pendientes se indican de forma
                        explícita y no se rellenan con datos ficticios.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2.5">
                        <Link
                            href="/#contactanos"
                            className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-zinc-950 transition hover:opacity-90"
                        >
                            Hablemos de tu proyecto ↗
                        </Link>
                        <Link
                            href="/#simulador"
                            className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--header-border)] px-5 py-2.5 text-xs font-semibold text-[var(--header-text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                        >
                            Simular presupuesto
                        </Link>
                    </div>
                </header>

                <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <ProjectCard key={project.slug} project={project} />
                    ))}
                </div>

                {projects.length === 0 && (
                    <p className="mt-8 rounded-2xl border border-dashed border-[var(--header-border)] p-6 text-sm text-[var(--header-muted)]">
                        Todavía no hay proyectos publicados. Añade entradas en
                        db/projects.json siguiendo la estructura documentada.
                    </p>
                )}
            </div>
        </div>
    );
}
