"use client";

import { useEffect, useMemo, useState } from "react";

import RimyMascot from "@/components/rimy/RimyMascot";
import { useNarration } from "@/components/rimy/useNarration";
import { getRimy } from "@/lib/db";
import type { Project } from "@/lib/db/types";
import {
    pauseNarration,
    resumeNarration,
    speak,
    stopNarration,
} from "@/lib/rimy/narration";

type ExplainerKey =
    | "basic"
    | "detailed"
    | "problem"
    | "technologies"
    | "features";

type ProjectExplainerProps = {
    project: Project;
};

const rimy = getRimy();
const tts = rimy.tts;

function buildAnswers(project: Project): Record<ExplainerKey, string> {
    const basic = [
        `${project.name} es un proyecto de RimCode en la categoría ${project.category}.`,
        project.shortDescription,
    ]
        .filter(Boolean)
        .join(" ");

    const detailedParts = [
        project.description || project.shortDescription,
        project.problem ? `Problema que resuelve: ${project.problem}` : "",
        project.objectives.length
            ? `Objetivos: ${project.objectives.join(", ")}.`
            : "",
        project.features.length
            ? `Funcionalidades: ${project.features.join(", ")}.`
            : "",
        project.technologies.length
            ? `Tecnologías utilizadas: ${project.technologies.join(", ")}.`
            : "",
        project.challenges.length
            ? `Desafíos técnicos: ${project.challenges.join(", ")}.`
            : "",
        project.solutions.length
            ? `Soluciones implementadas: ${project.solutions.join(", ")}.`
            : "",
        project.results.length
            ? `Resultados documentados: ${project.results.join(", ")}.`
            : "",
    ].filter(Boolean);

    if (
        !project.objectives.length &&
        !project.challenges.length &&
        !project.solutions.length
    ) {
        detailedParts.push(rimy.projectExplainer.emptyDetail);
    }

    return {
        basic,
        detailed: detailedParts.join("\n\n"),
        problem: project.problem || rimy.projectExplainer.noDescription,
        technologies: project.technologies.length
            ? `Tecnologías documentadas de ${project.name}: ${project.technologies.join(", ")}.`
            : rimy.projectExplainer.emptyDetail,
        features: project.features.length
            ? `Funcionalidades documentadas de ${project.name}: ${project.features.join(", ")}.`
            : rimy.projectExplainer.emptyDetail,
    };
}

export default function ProjectExplainer({ project }: ProjectExplainerProps) {
    const [selected, setSelected] = useState<ExplainerKey>("basic");
    const answers = useMemo(() => buildAnswers(project), [project]);
    const narration = useNarration();

    useEffect(() => {
        return () => {
            stopNarration();
        };
    }, []);

    const current = answers[selected];
    const speaking = narration.status === "speaking";
    const paused = narration.status === "paused";
    const unsupported = narration.status === "unsupported";
    const isCurrentNarration = narration.text === current;

    const start = () => {
        speak(current, {
            lang: tts.lang,
            rate: tts.rate,
            pitch: tts.pitch,
            volume: tts.volume,
            sentencePauseMs: tts.sentencePauseMs,
        });
    };

    const quickQuestions: { key: ExplainerKey; label: string }[] = [
        { key: "basic", label: rimy.projectExplainer.questions[0] },
        { key: "problem", label: rimy.projectExplainer.questions[1] },
        { key: "technologies", label: rimy.projectExplainer.questions[2] },
        { key: "features", label: rimy.projectExplainer.questions[3] },
    ];

    return (
        <section
            aria-labelledby="rimy-explainer-title"
            className="rounded-3xl border border-[var(--header-border)] bg-[var(--header-bg)]/80 p-5 shadow-xl backdrop-blur-xl sm:p-6"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-1.5">
                    <RimyMascot
                        animation={speaking ? "talking" : "happy"}
                        interactiveEyes={false}
                        className="h-full w-full"
                    />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-500">
                        {rimy.projectExplainer.title}
                    </p>
                    <h2
                        id="rimy-explainer-title"
                        className="mt-1 text-xl font-extrabold text-[var(--header-text)]"
                    >
                        {project.name} explicado por RIMY
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--header-muted)]">
                        {rimy.projectExplainer.intro}
                    </p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={() => setSelected("basic")}
                    aria-pressed={selected === "basic"}
                    className={`min-h-[40px] rounded-full px-4 py-2 text-xs font-semibold transition ${
                        selected === "basic"
                            ? "bg-[var(--accent)] text-zinc-950"
                            : "border border-[var(--header-border)] text-[var(--header-muted)] hover:border-[var(--accent)] hover:text-[var(--header-text)]"
                    }`}
                >
                    {rimy.projectExplainer.basicLabel}
                </button>

                <button
                    type="button"
                    onClick={() => setSelected("detailed")}
                    aria-pressed={selected === "detailed"}
                    className={`min-h-[40px] rounded-full px-4 py-2 text-xs font-semibold transition ${
                        selected === "detailed"
                            ? "bg-[var(--accent)] text-zinc-950"
                            : "border border-[var(--header-border)] text-[var(--header-muted)] hover:border-[var(--accent)] hover:text-[var(--header-text)]"
                    }`}
                >
                    {rimy.projectExplainer.detailedLabel}
                </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
                {quickQuestions.map((question) => (
                    <button
                        key={question.key}
                        type="button"
                        onClick={() => setSelected(question.key)}
                        className="rounded-full border border-[var(--header-border)] px-2.5 py-1 text-[10px] text-[var(--header-muted)] transition hover:border-cyan-400 hover:text-cyan-500"
                    >
                        {question.label}
                    </button>
                ))}
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--header-border)] bg-black/5 p-4 dark:bg-white/5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--header-text)]">
                    {current}
                </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={
                        speaking && isCurrentNarration
                            ? pauseNarration
                            : paused && isCurrentNarration
                              ? resumeNarration
                              : start
                    }
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-cyan-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-cyan-500"
                >
                    <span aria-hidden="true">
                        {speaking && isCurrentNarration ? "⏸" : "🔊"}
                    </span>
                    {speaking && isCurrentNarration
                        ? "Pausar"
                        : paused && isCurrentNarration
                          ? "Continuar"
                          : "Escuchar explicación"}
                </button>

                {(speaking || paused) && (
                    <button
                        type="button"
                        onClick={stopNarration}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--header-border)] px-4 py-2 text-xs font-semibold text-[var(--header-muted)] transition hover:border-red-400 hover:text-red-500"
                    >
                        ⏹ Detener
                    </button>
                )}

                <span
                    className="font-mono text-[10px] text-[var(--header-muted)]"
                    aria-live="polite"
                >
                    {unsupported
                        ? "Este navegador no admite síntesis de voz; la explicación permanece disponible como texto."
                        : narration.status === "speaking"
                          ? "Narrando..."
                          : narration.status === "paused"
                            ? "Narración en pausa"
                            : narration.status === "error"
                              ? "No se pudo reproducir el audio."
                              : "Audio opcional"}
                </span>
            </div>
        </section>
    );
}
