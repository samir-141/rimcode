import companyJson from "../../../db/company.json";
import contactJson from "../../../db/contact.json";
import faqComercialJson from "../../../db/faq/comercial.json";
import faqEmpresaJson from "../../../db/faq/empresa.json";
import faqProyectosJson from "../../../db/faq/proyectos.json";
import faqServiciosJson from "../../../db/faq/servicios.json";
import faqTecnologiasJson from "../../../db/faq/tecnologias.json";
import methodologyJson from "../../../db/methodology.json";
import projectsJson from "../../../db/projects.json";
import rimyJson from "../../../db/rimy.json";
import servicesJson from "../../../db/services.json";
import settingsJson from "../../../db/settings.json";
import socialJson from "../../../db/social.json";
import technologiesJson from "../../../db/technologies.json";
import type {
    Company,
    Contact,
    Currency,
    FaqData,
    FaqItem,
    MethodologyData,
    Project,
    ProjectStatus,
    ProjectsData,
    RimyData,
    ServicesData,
    SettingsData,
    SocialNetwork,
    TechnologiesData,
} from "./types";

export * from "./types";

const company = companyJson as Company;
const contactBase = contactJson as Contact;
const faq: FaqData = {
    items: [
        ...(faqEmpresaJson.items as FaqItem[]),
        ...(faqServiciosJson.items as FaqItem[]),
        ...(faqProyectosJson.items as FaqItem[]),
        ...(faqTecnologiasJson.items as FaqItem[]),
        ...(faqComercialJson.items as FaqItem[]),
    ],
};
const methodology = methodologyJson as MethodologyData;
const projectsData = projectsJson as ProjectsData;
const rimy = rimyJson as RimyData;
const services = servicesJson as ServicesData;
const settingsBase = settingsJson as SettingsData;
const social = socialJson as { networks: SocialNetwork[]; note: string };
const technologies = technologiesJson as TechnologiesData;

const FALLBACK_IMAGE = "/images/projects/fallback.svg";
const VALID_STATUSES: ProjectStatus[] = [
    "production",
    "development",
    "prototype",
    "archived",
];

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

/**
 * Validación mínima de los proyectos. No usamos una librería externa para
 * mantener el bundle pequeño; validamos las claves que romperían la UI.
 */
export function validateProject(project: unknown): string[] {
    if (!isRecord(project)) return ["El proyecto no es un objeto válido."];

    const errors: string[] = [];
    const requiredStrings = [
        "id",
        "slug",
        "name",
        "category",
        "shortDescription",
        "description",
        "thumbnail",
    ];

    for (const key of requiredStrings) {
        if (typeof project[key] !== "string" || !project[key]) {
            errors.push(`Falta el campo de texto obligatorio "${key}".`);
        }
    }

    if (
        typeof project.status !== "string" ||
        !VALID_STATUSES.includes(project.status as ProjectStatus)
    ) {
        errors.push(`El estado "${String(project.status)}" no es válido.`);
    }

    for (const key of ["technologies", "features", "results", "pending"]) {
        if (!isStringArray(project[key])) {
            errors.push(`El campo "${key}" debe ser un array de textos.`);
        }
    }

    if (!isRecord(project.demo) || typeof project.demo.enabled !== "boolean") {
        errors.push("El campo demo debe existir y tener enabled booleano.");
    }

    if (!isRecord(project.links)) {
        errors.push("El campo links debe existir.");
    }

    return errors;
}

function normalizeProject(project: Project): Project {
    return {
        ...project,
        targetAudience: project.targetAudience ?? project.client ?? "",
        objectives: Array.isArray(project.objectives) ? project.objectives : [],
        gallery: Array.isArray(project.gallery) ? project.gallery : [],
        challenges: Array.isArray(project.challenges) ? project.challenges : [],
        solutions: Array.isArray(project.solutions) ? project.solutions : [],
        results: Array.isArray(project.results) ? project.results : [],
        pending: Array.isArray(project.pending) ? project.pending : [],
        demo: {
            type: project.demo?.type ?? "iframe",
            url: project.demo?.url ?? "",
            enabled: Boolean(project.demo?.enabled),
            title: project.demo?.title ?? `Demostración de ${project.name}`,
            description: project.demo?.description ?? "",
            aspectRatio: project.demo?.aspectRatio ?? "16 / 9",
        },
        links: {
            website: project.links?.website ?? "",
            github: project.links?.github ?? "",
            documentation: project.links?.documentation ?? "",
        },
        seo: project.seo
            ? {
                  metaTitle: project.seo.metaTitle || project.name,
                  metaDescription: project.seo.metaDescription || project.shortDescription,
                  keywords: Array.isArray(project.seo.keywords) ? project.seo.keywords : [],
                  canonicalUrl: project.seo.canonicalUrl || `/projects/${project.slug}`,
                  ogTitle: project.seo.ogTitle || `${project.name} | RimCode`,
                  ogDescription: project.seo.ogDescription || project.shortDescription,
                  ogImage: project.seo.ogImage || project.thumbnail,
                  ogType: project.seo.ogType === "website" ? "website" : "article",
                  twitterCard: project.seo.twitterCard === "summary" ? "summary" : "summary_large_image",
                  altText: project.seo.altText || `Imagen de referencia de ${project.name}`,
              }
            : undefined,
    };
}

const seenSlugs = new Set<string>();

export const projects: Project[] = projectsData.projects
    .map((project) => normalizeProject(project))
    .filter((project) => {
        const errors = validateProject(project);
        if (errors.length > 0) {
            if (process.env.NODE_ENV !== "production") {
                console.error(
                    `[db/projects] "${project?.slug ?? "sin-slug"}" no es válido: ${errors.join(" ")}`
                );
            }
            return false;
        }

        if (seenSlugs.has(project.slug)) {
            if (process.env.NODE_ENV !== "production") {
                console.error(
                    `[db/projects] Slug duplicado: "${project.slug}". Se ignora el duplicado.`
                );
            }
            return false;
        }

        seenSlugs.add(project.slug);
        return project.published !== false;
    });

export function getCompany(): Company {
    return company;
}

function isHttpUrl(value: string): boolean {
    if (!value) return false;
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
}

export function getContact(): Contact {
    const envEmail =
        typeof process.env.NEXT_PUBLIC_CONTACT_EMAIL === "string"
            ? process.env.NEXT_PUBLIC_CONTACT_EMAIL.trim()
            : "";
    const envWhatsapp =
        typeof process.env.NEXT_PUBLIC_WHATSAPP_NUMBER === "string"
            ? process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/[^\d]/g, "")
            : "";

    const email = envEmail || contactBase.email;
    const whatsappNumber = envWhatsapp || contactBase.whatsapp.number;
    const whatsappEnabled = Boolean(whatsappNumber);
    const whatsappMessage = contactBase.whatsapp.message;
    const whatsappHref = whatsappEnabled
        ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
        : "";

    const channels = contactBase.channels.map((channel) => {
        if (channel.id === "email") {
            return {
                ...channel,
                value: email,
                href: `mailto:${email}`,
                enabled: Boolean(email),
            };
        }

        if (channel.id === "whatsapp") {
            return {
                ...channel,
                value: whatsappEnabled ? `+${whatsappNumber}` : "",
                href: whatsappHref,
                enabled: whatsappEnabled,
            };
        }

        return channel;
    });

    return {
        ...contactBase,
        email,
        whatsapp: {
            ...contactBase.whatsapp,
            number: whatsappNumber,
            enabled: whatsappEnabled,
        },
        channels,
    };
}

export function getSocialNetworks(): SocialNetwork[] {
    return social.networks.filter(
        (network) => network.visible && isHttpUrl(network.url)
    );
}

export function getProjects(): Project[] {
    return projects;
}

export function getFeaturedProjects(limit = settingsBase.projects.featuredLimit): Project[] {
    return projects.filter((project) => project.featured).slice(0, limit);
}

export function getProjectBySlug(slug: string): Project | undefined {
    return projects.find((project) => project.slug === slug);
}

export function getRelatedProjects(slug: string, limit = settingsBase.projects.relatedLimit): Project[] {
    const current = getProjectBySlug(slug);
    if (!current) return projects.slice(0, limit);

    const sameCategory = projects.filter(
        (project) => project.slug !== slug && project.category === current.category
    );
    const rest = projects.filter(
        (project) => project.slug !== slug && project.category !== current.category
    );

    return [...sameCategory, ...rest].slice(0, limit);
}

export function getProjectSlugs(): string[] {
    return projects.map((project) => project.slug);
}

export function resolveProjectImage(source: string | undefined): string {
    if (!source) return FALLBACK_IMAGE;
    if (source.startsWith("/")) {
        return /\.(png|jpe?g|webp|svg|avif)(\?.*)?$/i.test(source)
            ? source
            : FALLBACK_IMAGE;
    }
    return isHttpUrl(source) ? source : FALLBACK_IMAGE;
}

export function getProjectFallbackImage(): string {
    return FALLBACK_IMAGE;
}

export function getTechnologies(): TechnologiesData {
    return technologies;
}

export function getServices(): ServicesData {
    return services;
}

export function getServicesForContact(): { id: string; label: string }[] {
    return services.services.map((service) => ({
        id: service.id,
        label: service.contactLabel || service.name,
    }));
}

export function getMethodology(): MethodologyData {
    return methodology;
}

export function getFaq(): FaqData {
    return faq;
}

export function getRimy(): RimyData {
    return rimy;
}

export function getSettings(): SettingsData {
    const siteUrl =
        typeof process.env.NEXT_PUBLIC_APP_URL === "string" &&
        isHttpUrl(process.env.NEXT_PUBLIC_APP_URL)
            ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
            : settingsBase.site.defaultUrl;

    return {
        ...settingsBase,
        site: {
            ...settingsBase.site,
            url: siteUrl,
        },
    };
}

export function getCurrencyOptions(): Currency[] {
    return settingsBase.currency.options;
}

export function isCurrency(value: string): value is Currency {
    return settingsBase.currency.options.includes(value as Currency);
}

export function getSiteUrl(): string {
    return getSettings().site.url ?? settingsBase.site.defaultUrl;
}
