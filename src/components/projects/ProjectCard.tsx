"use client";

import Link from "next/link";
import { useState } from "react";

import type { Project } from "@/lib/db/types";
import { getProjectFallbackImage, resolveProjectImage } from "@/lib/db";
import { STATUS_LABELS } from "@/lib/projects/presentation";

type ProjectCardProps = {
    project: Project;
    active?: boolean;
    onActivate?: () => void;
};

export default function ProjectCard({
    project,
    active = false,
    onActivate,
}: ProjectCardProps) {
    const [source, setSource] = useState(() =>
        resolveProjectImage(project.thumbnail)
    );

    return (
        <article
            onMouseEnter={onActivate}
            onFocus={onActivate}
            className={`group relative flex flex-col overflow-hidden rounded-3xl border transition-all duration-300 ${
                active
                    ? "border-[var(--accent)] bg-[var(--header-bg)] shadow-xl shadow-[var(--accent)]/10 sm:-translate-y-1"
                    : "border-[var(--header-border)] bg-[var(--header-bg)]/70 hover:border-[var(--accent)]/60"
            }`}
        >
            <div className="relative aspect-[16/9] w-full overflow-hidden border-b border-[var(--header-border)] bg-black/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={source}
                    alt={
                        project.seo?.altText ||
                        `Imagen de referencia de ${project.name}`
                    }
                    width={1200}
                    height={630}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    onError={() => setSource(getProjectFallbackImage())}
                />

                <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-2 p-3">
                    <span className="rounded-full bg-black/60 px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider text-white backdrop-blur-sm">
                        {project.category}
                    </span>
                    <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[9px] text-white backdrop-blur-sm">
                        <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: project.accent }}
                        />
                        {STATUS_LABELS[project.status]}
                    </span>
                </div>
            </div>

            <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                <div>
                    <h3 className="mb-1.5 text-base font-bold text-[var(--header-text)] transition-colors group-hover:text-[var(--accent)] sm:text-lg">
                        {project.name}
                    </h3>

                    <p className="mb-3 text-xs leading-relaxed text-[var(--header-muted)] sm:text-sm">
                        {project.shortDescription}
                    </p>

                    {project.features.length > 0 && (
                        <ul className="mb-3 space-y-1.5">
                            {project.features.slice(0, 3).map((feature) => (
                                <li
                                    key={feature}
                                    className="flex items-start gap-2 text-[11px] leading-snug text-[var(--header-text)] sm:text-xs"
                                >
                                    <span className="mt-0.5 shrink-0 font-bold text-[var(--accent)]">
                                        ✔
                                    </span>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div>
                    <div className="mb-3 flex flex-wrap gap-1.5 border-t border-[var(--header-border)] pt-2.5">
                        {project.technologies.map((tech) => (
                            <span
                                key={tech}
                                className="rounded-full border border-[var(--header-border)] px-2 py-0.5 font-mono text-[9px] text-[var(--header-muted)] sm:text-[10px]"
                            >
                                {tech}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[9px] text-[var(--header-muted)]">
                            {project.demo.enabled
                                ? "Demo disponible"
                                : project.client || "RimCode"}
                        </span>

                        <Link
                            href={`/projects/${project.slug}`}
                            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full border border-[var(--accent)] px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-zinc-950"
                            aria-label={`Conocer más sobre ${project.name}`}
                        >
                            Conocer más <span aria-hidden="true">↗</span>
                        </Link>
                    </div>
                </div>
            </div>
        </article>
    );
}
