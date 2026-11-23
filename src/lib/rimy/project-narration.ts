import { getRimy } from "@/lib/db";
import type { Project } from "@/lib/db/types";
import type { ProjectVoicePart } from "./voice-text";

const rimy = getRimy();

export function buildProjectNarration(project: Project): Record<ProjectVoicePart, string> {
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
