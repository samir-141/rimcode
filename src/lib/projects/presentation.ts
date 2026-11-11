import type { Project } from "@/lib/db/types";

export { buildProjectJsonLd } from "@/lib/seo/structured-data";

export const STATUS_LABELS: Record<Project["status"], string> = {
    production: "En producción",
    development: "En desarrollo",
    prototype: "Prototipo",
    archived: "Archivado",
};

export function getProjectUrlPath(slug: string): string {
    return `/projects/${slug}`;
}
