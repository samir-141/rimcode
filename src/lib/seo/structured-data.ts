import {
    getCompany,
    getContact,
    getSiteUrl,
    getSocialNetworks,
    resolveProjectImage,
} from "@/lib/db";
import type { Project } from "@/lib/db/types";

import structuredDataJson from "../../../db/seo/structured-data.json";

const schema = structuredDataJson;

function absoluteUrl(path: string, siteUrl: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    return `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

function isValidIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return false;
    return !Number.isNaN(Date.parse(value));
}

export function buildOrganizationJsonLd(): Record<string, unknown> {
    const company = getCompany();
    const contact = getContact();
    const socialNetworks = getSocialNetworks();
    const siteUrl = getSiteUrl();

    return {
        "@context": schema.context,
        "@type": schema.organizationType,
        "@id": `${siteUrl}/#organization`,
        name: company.name,
        url: siteUrl,
        logo: absoluteUrl("/icon.svg", siteUrl),
        description: company.shortDescription,
        founder: {
            "@type": "Person",
            name: company.founder.name,
            jobTitle: company.founder.role,
        },
        ...(socialNetworks.length > 0
            ? { sameAs: socialNetworks.map((network) => network.url) }
            : {}),
        contactPoint: {
            "@type": "ContactPoint",
            contactType: "atención al cliente",
            email: contact.email,
            availableLanguage: company.institutional.workingLanguages,
        },
    };
}

export function buildProfessionalServiceJsonLd(): Record<string, unknown> {
    const company = getCompany();
    const contact = getContact();
    const siteUrl = getSiteUrl();

    return {
        "@context": schema.context,
        "@type": "ProfessionalService",
        "@id": `${siteUrl}/#service`,
        name: company.name,
        url: siteUrl,
        image: absoluteUrl("/images/seo/rimcode-og.png", siteUrl),
        logo: absoluteUrl("/icon.svg", siteUrl),
        description: company.description,
        areaServed: company.institutional.market,
        serviceType: company.servicesSummary,
        founder: {
            "@type": "Person",
            name: company.founder.name,
            jobTitle: company.founder.role,
        },
        email: contact.email,
        telephone: contact.phone,
    };
}

export function buildWebSiteJsonLd(): Record<string, unknown> {
    const company = getCompany();
    const siteUrl = getSiteUrl();

    return {
        "@context": schema.context,
        "@type": schema.websiteType,
        "@id": `${siteUrl}/#website`,
        name: company.name,
        url: siteUrl,
        description: company.shortDescription,
        inLanguage: schema.inLanguage,
        publisher: {
            "@id": `${siteUrl}/#organization`,
        },
    };
}

export function buildWebPageJsonLd(options: {
    name: string;
    description: string;
    url: string;
    publishedTime?: string;
}): Record<string, unknown> {
    const siteUrl = getSiteUrl();

    return {
        "@context": schema.context,
        "@type": schema.webPageType,
        "@id": options.url,
        url: options.url,
        name: options.name,
        description: options.description,
        inLanguage: schema.inLanguage,
        isPartOf: {
            "@id": `${siteUrl}/#website`,
        },
        about: {
            "@id": `${siteUrl}/#organization`,
        },
        ...(isValidIsoDate(options.publishedTime ?? "")
            ? { datePublished: options.publishedTime }
            : {}),
    };
}

export function buildBreadcrumbJsonLd(
    items: Array<{ name: string; url: string }>
): Record<string, unknown> {
    const siteUrl = getSiteUrl();

    return {
        "@context": schema.context,
        "@type": schema.breadcrumbListType,
        itemListElement: items.map((item, index) => ({
            "@type": schema.listItemType,
            position: index + 1,
            name: item.name,
            item: absoluteUrl(item.url, siteUrl),
        })),
    };
}

export function buildProjectJsonLd(
    project: Project,
    siteUrl: string
): Record<string, unknown> {
    const company = getCompany();
    const url = `${siteUrl}/projects/${project.slug}`;
    const isCreativeWork = project.category
        .toLowerCase()
        .includes("experiencia");
    const imageUrl = absoluteUrl(
        resolveProjectImage(project.seo?.ogImage || project.thumbnail),
        siteUrl
    );
    const description = project.seo?.metaDescription || project.shortDescription;
    const keywords =
        project.seo?.keywords && project.seo.keywords.length > 0
            ? project.seo.keywords.join(", ")
            : project.technologies.join(", ");

    const base: Record<string, unknown> = {
        "@context": schema.context,
        "@type": isCreativeWork
            ? schema.creativeWorkType
            : schema.softwareApplicationType,
        "@id": url,
        name: project.name,
        description,
        url,
        image: imageUrl,
        inLanguage: schema.inLanguage,
        keywords,
        creator: {
            "@type": schema.organizationType,
            name: company.name,
            url: siteUrl,
        },
        ...(project.targetAudience
            ? {
                  audience: {
                      "@type": "Audience",
                      audienceType: project.targetAudience,
                  },
              }
            : {}),
        ...(isValidIsoDate(project.publishedAt)
            ? { datePublished: project.publishedAt }
            : {}),
    };

    if (!isCreativeWork) {
        base.applicationCategory = project.category;
        base.operatingSystem = "Web";
    }

    return base;
}
