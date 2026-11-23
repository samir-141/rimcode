"use client";

import Link from "next/link";
import { useState } from "react";
import CardCarousel from "@/components/landing/navigation/CardCarousel";
import ProjectCard from "@/components/projects/ProjectCard";
import { getProjects } from "@/lib/db";

const projects = getProjects();
const categories = [...new Set(projects.map(({ category }) => category))];

export default function ProjectsSection() {
    const [category, setCategory] = useState("");
    const filtered = category ? projects.filter((project) => project.category === category) : projects;

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl">Proyectos de RimCode</h2>
            <div className="my-4 flex flex-wrap gap-2" aria-label="Categorías de proyectos">
                {["", ...categories].map((item) => (
                    <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}
                        className="rounded-full border border-[var(--header-border)] px-3 py-1.5 text-xs text-[var(--header-muted)] aria-pressed:bg-[var(--accent)] aria-pressed:text-[var(--accent-ink)]">
                        {item || "Todos los proyectos"}
                    </button>
                ))}
            </div>
            <CardCarousel key={category} id="project-cards" label="Proyectos">
                {filtered.map((project) => <ProjectCard key={project.slug} project={project} />)}
            </CardCarousel>
            <div className="mt-5 flex flex-wrap gap-4 text-sm">
                <Link href="/projects" className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline">Ver portafolio completo</Link>
                <Link href="#simulador" className="text-[var(--header-muted)] underline-offset-4 hover:underline">Simular un proyecto similar</Link>
            </div>
        </div>
    );
}
