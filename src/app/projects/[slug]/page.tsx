import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ProjectCard from "@/components/projects/ProjectCard";
import ProjectDemo from "@/components/projects/ProjectDemo";
import ProjectExplainer from "@/components/projects/ProjectExplainer";
import StructuredData from "@/components/seo/StructuredData";
import {
    getProjectBySlug,
    getProjectSlugs,
    getRelatedProjects,
    getSiteUrl,
    resolveProjectImage,
} from "@/lib/db";
import {
    STATUS_LABELS,
    buildProjectJsonLd,
} from "@/lib/projects/presentation";
import {
    getNotFoundMetadata,
    getProjectMetadata,
} from "@/lib/seo/seo-config";
import { buildBreadcrumbJsonLd } from "@/lib/seo/structured-data";

type ProjectPageProps = {
    params: Promise<{ slug: string }>;
};

// La ficha obtiene su contenido completo a partir del slug.
export const instant = false;

export function generateStaticParams() {
    return getProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
    params,
}: ProjectPageProps): Promise<Metadata> {
    const { slug } = await params;
    const project = getProjectBySlug(slug);

    if (!project) {
        return getNotFoundMetadata();
    }

    return getProjectMetadata(project);
}

function PendingNote({ children }: { children: React.ReactNode }) {
    return (
        <p className="rounded-2xl border border-dashed border-[var(--header-border)] bg-[var(--header-bg)]/50 p-4 text-xs leading-relaxed text-[var(--header-muted)]">
            {children}
        </p>
    );
}

function SectionTitle({
    eyebrow,
    title,
}: {
    eyebrow: string;
    title: string;
}) {
    return (
        <div className="mb-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                {eyebrow}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-[var(--header-text)] sm:text-2xl">
                {title}
            </h2>
        </div>
    );
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { slug } = await params;
    const project = getProjectBySlug(slug);

    if (!project) notFound();

    const related = getRelatedProjects(project.slug, 3);
    const siteUrl = getSiteUrl();
    const image = resolveProjectImage(project.thumbnail);
    const externalLinks = [
        { label: "Sitio web", href: project.links.website },
        { label: "Repositorio", href: project.links.github },
        { label: "Documentación", href: project.links.documentation },
    ].filter((link) => link.href);

    const jsonLd = buildProjectJsonLd(project, siteUrl);
    const breadcrumbJsonLd = buildBreadcrumbJsonLd([
        { name: "Inicio", url: "/" },
        { name: "Proyectos", url: "/projects" },
        { name: project.name, url: `/projects/${project.slug}` },
    ]);

    return (
        <div className="w-full bg-[var(--background)] pb-20 text-[var(--foreground)]">
            <StructuredData data={jsonLd} />
            <StructuredData data={breadcrumbJsonLd} />

            <div className="mx-auto w-full max-w-6xl px-4 pt-[92px] sm:px-6 lg:px-8 lg:pt-[104px]">
                {/* MIGAS */}
                <nav
                    aria-label="Migas de pan"
                    className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-[var(--header-muted)]"
                >
                    <Link href="/" className="hover:text-[var(--accent)]">
                        Inicio
                    </Link>
                    <span aria-hidden="true">/</span>
                    <Link
                        href="/projects"
                        className="hover:text-[var(--accent)]"
                    >
                        Proyectos
                    </Link>
                    <span aria-hidden="true">/</span>
                    <span className="text-[var(--header-text)]">
                        {project.name}
                    </span>
                </nav>

                {/* HERO DEL PROYECTO */}
                <header className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
                    <div className="lg:col-span-7">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
                                {project.category}
                            </span>
                            <span className="rounded-full border border-[var(--header-border)] px-3 py-1 font-mono text-[10px] text-[var(--header-muted)]">
                                {STATUS_LABELS[project.status]}
                            </span>
                        </div>

                        <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-[var(--header-text)] sm:text-4xl lg:text-5xl">
                            {project.name}
                        </h1>

                        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--header-muted)] sm:text-base">
                            {project.shortDescription}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {project.technologies.map((technology) => (
                                <span
                                    key={technology}
                                    className="rounded-full border border-[var(--header-border)] bg-[var(--header-bg)] px-2.5 py-1 font-mono text-[10px] text-[var(--header-muted)]"
                                >
                                    {technology}
                                </span>
                            ))}
                        </div>

                        <div className="mt-6 flex flex-wrap gap-2.5">
                            <Link
                                href="/#contactanos"
                                className="inline-flex min-h-[44px] items-center rounded-full bg-[var(--accent)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--accent-ink)] transition hover:opacity-90"
                            >
                                Hablemos de un proyecto similar ↗
                            </Link>
                            <Link
                                href="/projects"
                                className="inline-flex min-h-[44px] items-center rounded-full border border-[var(--header-border)] px-5 py-2.5 text-xs font-semibold text-[var(--header-text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                            >
                                ← Volver al portafolio
                            </Link>
                        </div>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="overflow-hidden rounded-3xl border border-[var(--header-border)] bg-black/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={image}
                                alt={
                                    project.seo?.altText ||
                                    `Imagen de referencia de ${project.name}`
                                }
                                width={1200}
                                height={630}
                                className="aspect-[16/9] h-full w-full object-cover"
                            />
                        </div>
                        <p className="mt-2 text-center font-mono text-[9px] text-[var(--header-muted)]">
                            Imagen de referencia del proyecto. No es una captura
                            del producto en producción salvo que se indique.
                        </p>
                    </div>
                </header>

                <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12">
                    <main className="space-y-8 lg:col-span-8">
                        <section>
                            <SectionTitle
                                eyebrow="01 / CONTEXTO"
                                title="Problema que resuelve"
                            />
                            {project.problem ? (
                                <p className="text-sm leading-relaxed text-[var(--header-muted)]">
                                    {project.problem}
                                </p>
                            ) : (
                                <PendingNote>
                                    El problema y los objetivos de este proyecto
                                    aún no están documentados.
                                </PendingNote>
                            )}

                            {project.objectives.length > 0 && (
                                <ul className="mt-4 space-y-2">
                                    {project.objectives.map((objective) => (
                                        <li
                                            key={objective}
                                            className="flex items-start gap-2 text-sm text-[var(--header-text)]"
                                        >
                                            <span className="text-[var(--accent)]">
                                                →
                                            </span>
                                            {objective}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        <section>
                            <SectionTitle
                                eyebrow="02 / FUNCIONALIDADES"
                                title="Qué incluye el proyecto"
                            />
                            {project.features.length > 0 ? (
                                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                    {project.features.map((feature) => (
                                        <div
                                            key={feature}
                                            className="rounded-2xl border border-[var(--header-border)] bg-[var(--header-bg)]/70 p-3.5 text-xs leading-relaxed text-[var(--header-text)]"
                                        >
                                            <span className="mr-1.5 text-[var(--accent)]">
                                                ✔
                                            </span>
                                            {feature}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <PendingNote>
                                    Las funcionalidades de este proyecto todavía
                                    no están documentadas.
                                </PendingNote>
                            )}
                        </section>

                        <section>
                            <SectionTitle
                                eyebrow="03 / DEMOSTRACIÓN"
                                title="Demo del proyecto"
                            />
                            <ProjectDemo project={project} />

                            <div className="mt-4">
                                <h3 className="font-mono text-[10px] uppercase tracking-wider text-[var(--header-muted)]">
                                    Enlaces externos
                                </h3>
                                {externalLinks.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {externalLinks.map((link) => (
                                            <a
                                                key={link.label}
                                                href={link.href}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex min-h-[40px] items-center rounded-full border border-[var(--header-border)] px-4 py-2 text-xs font-semibold text-[var(--header-text)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                                            >
                                                {link.label} ↗
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-1 text-xs text-[var(--header-muted)]">
                                        No hay enlaces públicos documentados para
                                        este proyecto.
                                    </p>
                                )}
                            </div>
                        </section>

                        {project.gallery.length > 0 && (
                            <section>
                                <SectionTitle
                                    eyebrow="04 / GALERÍA"
                                    title="Capturas del proyecto"
                                />
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {project.gallery.map((item) => (
                                        <div
                                            key={item}
                                            className="overflow-hidden rounded-2xl border border-[var(--header-border)]"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={resolveProjectImage(item)}
                                                alt={`Galería de ${project.name}`}
                                                loading="lazy"
                                                className="aspect-[16/9] w-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {(project.challenges.length > 0 ||
                            project.solutions.length > 0 ||
                            project.results.length > 0) && (
                                <section>
                                    <SectionTitle
                                        eyebrow="05 / INGENIERÍA"
                                        title="Desafíos, soluciones y resultados"
                                    />

                                    <div className="space-y-3">
                                        {project.challenges.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-bold text-[var(--header-text)]">
                                                    Desafíos técnicos
                                                </h3>
                                                <ul className="mt-1.5 space-y-1.5">
                                                    {project.challenges.map(
                                                        (challenge) => (
                                                            <li
                                                                key={challenge}
                                                                className="text-xs leading-relaxed text-[var(--header-muted)]"
                                                            >
                                                                • {challenge}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}

                                        {project.solutions.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-bold text-[var(--header-text)]">
                                                    Soluciones implementadas
                                                </h3>
                                                <ul className="mt-1.5 space-y-1.5">
                                                    {project.solutions.map(
                                                        (solution) => (
                                                            <li
                                                                key={solution}
                                                                className="text-xs leading-relaxed text-[var(--header-muted)]"
                                                            >
                                                                • {solution}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}

                                        {project.results.length > 0 && (
                                            <div>
                                                <h3 className="text-sm font-bold text-[var(--header-text)]">
                                                    Resultados documentados
                                                </h3>
                                                <ul className="mt-1.5 space-y-1.5">
                                                    {project.results.map(
                                                        (result) => (
                                                            <li
                                                                key={result}
                                                                className="text-xs leading-relaxed text-[var(--header-muted)]"
                                                            >
                                                                • {result}
                                                            </li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            )}

                        <ProjectExplainer project={project} />
                    </main>

                    <aside className="space-y-4 lg:col-span-4">
                        <div className="rounded-3xl border border-[var(--header-border)] bg-[var(--header-bg)]/70 p-4">
                            <h2 className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
                                Ficha del proyecto
                            </h2>
                            <dl className="mt-3 space-y-2.5 text-xs">
                                <div>
                                    <dt className="text-[var(--header-muted)]">
                                        Categoría
                                    </dt>
                                    <dd className="font-semibold text-[var(--header-text)]">
                                        {project.category}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-[var(--header-muted)]">
                                        Estado
                                    </dt>
                                    <dd className="font-semibold text-[var(--header-text)]">
                                        {STATUS_LABELS[project.status]}
                                    </dd>
                                </div>
                                {project.client && (
                                    <div>
                                        <dt className="text-[var(--header-muted)]">
                                            Sector / cliente
                                        </dt>
                                        <dd className="font-semibold text-[var(--header-text)]">
                                            {project.client}
                                        </dd>
                                    </div>
                                )}
                                {project.publishedAt && (
                                    <div>
                                        <dt className="text-[var(--header-muted)]">
                                            Publicación
                                        </dt>
                                        <dd className="font-semibold text-[var(--header-text)]">
                                            {project.publishedAt}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        {process.env.NODE_ENV !== "production" && project.pending.length > 0 && (
                            <div className="rounded-3xl border border-dashed border-[var(--header-border)] p-4">
                                <h2 className="font-mono text-[10px] uppercase tracking-wider text-[var(--header-muted)]">
                                    Documentación pendiente
                                </h2>
                                <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-[var(--header-muted)]">
                                    {project.pending.map((item) => (
                                        <li key={item}>• {item}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </aside>
                </div>

                {related.length > 0 && (
                    <section className="mt-12 border-t border-[var(--header-border)] pt-8">
                        <div className="mb-4 flex items-end justify-between gap-3">
                            <SectionTitle
                                eyebrow="06 / PORTAFOLIO"
                                title="Proyectos relacionados"
                            />
                            <Link
                                href="/projects"
                                className="shrink-0 text-xs font-semibold text-[var(--accent)] hover:underline"
                            >
                                Ver todos →
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {related.map((item) => (
                                <ProjectCard key={item.slug} project={item} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
