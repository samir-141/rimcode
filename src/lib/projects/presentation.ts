import type { Project } from "@/lib/db/types";

export { buildProjectJsonLd } from "@/lib/seo/structured-data";

export const STATUS_LABELS: Record<Project["status"], string> = {
    production: "En Producción",
    development: "Implementación Activa",
    prototype: "Fase Final",
    archived: "Histórico",
};

export function getProjectUrlPath(slug: string): string {
    return `/projects/${slug}`;
}
