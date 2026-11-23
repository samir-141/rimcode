"use client";

import Link from "next/link";
import { useState } from "react";
import type { Project } from "@/lib/db/types";
import { getProjectFallbackImage, resolveProjectImage } from "@/lib/db";
import { STATUS_LABELS } from "@/lib/projects/presentation";

export default function ProjectCard({ project }: { project: Project }) {
    const [source, setSource] = useState(() => resolveProjectImage(project.thumbnail));

    return (
        <article className="flex h-full min-w-0 flex-col rounded-2xl border border-[var(--header-border)] bg-[var(--header-bg)]">
            <Link href={`/projects/${project.slug}`} draggable={false} aria-label={`Ver ficha de ${project.name}`}
                className="block rounded-t-2xl bg-black/15 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={source} alt={project.seo?.altText || project.name} width={1200} height={630} loading="lazy"
                    draggable={false} className="h-32 w-full rounded-lg object-contain sm:h-36"
                    onError={() => setSource(getProjectFallbackImage())} />
            </Link>

            <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--header-muted)]">
                    <span className="font-medium text-[var(--accent)]">{STATUS_LABELS[project.status]}</span>
                    <span>{project.category}</span>
                </div>
                <div>
                    <h3 className="text-base font-bold leading-snug text-[var(--header-text)]">{project.name}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--header-muted)]">{project.shortDescription}</p>
                </div>
                <div className="mt-auto border-t border-[var(--header-border)] pt-2">
                    <details className="text-sm">
                        <summary className="cursor-pointer py-2 font-medium">Funciones y tecnologías</summary>
                        {project.features.length > 0 && (
                            <ul className="mt-1 list-disc space-y-1 pl-4 text-[var(--header-muted)]">
                                {project.features.map((feature) => <li key={feature}>{feature}</li>)}
                            </ul>
                        )}
                        {project.technologies.length > 0 && (
                            <p className="mt-2 break-words text-xs text-[var(--header-muted)]">{project.technologies.join(" · ")}</p>
                        )}
                        {project.targetAudience && <p className="mt-2 text-xs text-[var(--header-muted)]">{project.targetAudience}</p>}
                    </details>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                        {project.demo.enabled && <span className="text-xs text-[var(--header-muted)]">Demo disponible</span>}
                        <Link href={`/projects/${project.slug}`} draggable={false} aria-label={`Conocer más sobre ${project.name}`}
                            className="ml-auto rounded-lg border border-[var(--header-border)] px-3 py-2 text-xs font-bold text-[var(--accent)] hover:border-[var(--accent)]">
                            Ver ficha ↗
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
