"use client";

import { useState } from "react";
import CardCarousel from "@/components/landing/navigation/CardCarousel";
import { getTechnologies } from "@/lib/db";

const techData = getTechnologies();

export default function TechSection() {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const items = techData.items.filter((tech) => selectedCategory === "all" || tech.category === selectedCategory);

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl">Tecnologías que usamos</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--header-muted)]">Herramientas para interfaces, datos, automatización e infraestructura.</p>
            <div className="my-4 flex flex-wrap gap-2" aria-label="Categorías de tecnologías">
                {techData.categories.map((category) => (
                    <button key={category.id} type="button" aria-pressed={category.id === selectedCategory}
                        onClick={() => setSelectedCategory(category.id)}
                        className="rounded-full border border-[var(--header-border)] px-3 py-1.5 text-xs text-[var(--header-muted)] aria-pressed:bg-[var(--accent)] aria-pressed:text-[var(--accent-ink)]">
                        {category.label}
                    </button>
                ))}
            </div>
            <CardCarousel key={selectedCategory} id="technology-cards" label="Tecnologías">
                {items.map((tech) => (
                    <article key={tech.id} className="h-full rounded-2xl border border-[var(--header-border)] bg-[var(--header-bg)] p-4">
                        <p className="text-xs font-medium text-[var(--accent)]">{tech.tag}</p>
                        <h3 className="mt-1 text-base font-bold">{tech.name}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-[var(--header-muted)]">{tech.description}</p>
                    </article>
                ))}
            </CardCarousel>
        </div>
    );
}
