import type { Metadata } from "next";

import {
    getCompany,
    getSettings,
    getSiteUrl,
    resolveProjectImage,
} from "@/lib/db";
import type { Project } from "@/lib/db/types";
import type { SeoPageOverrides } from "@/types/seo";

import metadataJson from "../../../db/seo/metadata.json";
import seoConfigJson from "../../../db/seo/seo-config.json";

const seoConfig = {
    ...seoConfigJson.site,
    twitterCard: (seoConfigJson.site.twitterCard as "summary" | "summary_large_image" | "player" | "app") || "summary_large_image",
};
const metadataByRoute = metadataJson;

function normalizePath(path: string): string {
    if (!path) return "/";
    const withSlash = path.startsWith("/") ? path : `/${path}`;
    const withoutTrailingSlash = withSlash.replace(/\/+$/, "");
    return withoutTrailingSlash === "" ? "/" : withoutTrailingSlash;
}

function absoluteUrl(path: string, siteUrl: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    return `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

function applyTitleTemplate(title: string): string {
    return seoConfig.titleTemplate.includes("%s")
        ? seoConfig.titleTemplate.replace("%s", title)
        : title;
}

function getVerification(): Metadata["verification"] {
    const google = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
    return google ? { google } : undefined;
}

export function getSiteMetadata(): Metadata {
    const company = getCompany();
    const settings = getSettings();
    const siteUrl = getSiteUrl();

    return {
        metadataBase: new URL(siteUrl),
        title: {
            default: seoConfig.defaultTitle,
            template: seoConfig.titleTemplate,
        },
        description: seoConfig.defaultDescription,
        applicationName: company.name,
        authors: [{ name: company.founder.name }],
        creator: company.founder.name,
        keywords: seoConfig.keywords,
        alternates: {
            canonical: "/",
        },
        openGraph: {
            type: "website",
            locale: settings.site.locale,
            siteName: company.name,
            title: seoConfig.defaultTitle,
            description: seoConfig.defaultDescription,
            url: siteUrl,
            images: [
                {
                    url: seoConfig.openGraphImage,
                    alt: `${company.name} — ${company.tagline}`,
                    width: 1200,
                    height: 630,
                },
            ],
        },
        twitter: {
            card: seoConfig.twitterCard,
            title: seoConfig.defaultTitle,
            description: seoConfig.defaultDescription,
            images: [
                {
                    url: seoConfig.openGraphImage,
                    alt: `${company.name} — ${company.tagline}`,
                },
            ],
        },
        robots: {
            index: true,
            follow: true,
        },
        verification: getVerification(),
    };
}

export function buildPageMetadata(overrides: SeoPageOverrides): Metadata {
    const siteUrl = getSiteUrl();
    const omitCanonical = overrides.canonical === "";
    const path = normalizePath(
        overrides.path ?? overrides.canonical ?? "/"
    );
    const title = overrides.title ?? seoConfig.defaultTitle;
    const description =
        overrides.description ?? seoConfig.defaultDescription;
    const fullTitle = applyTitleTemplate(title);
    const url = `${siteUrl}${path}`;

    const images = overrides.images
        ? overrides.images.map((image) => ({
              url: absoluteUrl(image.url, siteUrl),
              alt: image.alt,
              width: image.width,
              height: image.height,
          }))
        : [
              {
                  url: absoluteUrl(seoConfig.openGraphImage, siteUrl),
                  alt: `${getCompany().name} — ${getCompany().tagline}`,
                  width: 1200,
                  height: 630,
              },
          ];

    return {
        metadataBase: new URL(siteUrl),
        title,
        description,
        applicationName: getCompany().name,
        authors: [{ name: getCompany().founder.name }],
        creator: getCompany().founder.name,
        keywords: overrides.keywords ?? seoConfig.keywords,
        alternates: omitCanonical
            ? {}
            : {
                  canonical: path,
              },
        openGraph: {
            type: overrides.type ?? "website",
            locale: getSettings().site.locale,
            siteName: getCompany().name,
            title: fullTitle,
            description,
            url,
            images,
            ...(overrides.publishedTime
                ? { publishedTime: overrides.publishedTime }
                : {}),
        },
        twitter: {
            card: seoConfig.twitterCard,
            title: fullTitle,
            description,
            images: images.map((image) => ({
                url: image.url,
                alt: image.alt,
            })),
        },
        robots: {
            index: !overrides.noIndex,
            follow: !overrides.noIndex,
        },
        verification: getVerification(),
    };
}

export function getHomeMetadata(): Metadata {
    const home = metadataByRoute.home;
    return buildPageMetadata({
        title: home.title,
        description: home.description,
        path: home.canonical,
    });
}

export function getProjectsIndexMetadata(): Metadata {
    const projects = metadataByRoute.projects;
    return buildPageMetadata({
        title: projects.title,
        description: projects.description,
        path: projects.canonical,
    });
}

export function getProjectMetadata(project: Project): Metadata {
    const siteUrl = getSiteUrl();
    const seo = project.seo;
    const ogImagePath = resolveProjectImage(seo?.ogImage || project.thumbnail);
    const ogImageUrl = absoluteUrl(ogImagePath, siteUrl);
    const altText = seo?.altText || `Imagen de referencia de ${project.name}`;
    const metaTitle = seo?.metaTitle || project.name;
    const metaDescription = seo?.metaDescription || project.shortDescription;
    const ogTitle = seo?.ogTitle || `${project.name} | RimCode`;
    const ogDescription = seo?.ogDescription || metaDescription;
    const canonicalPath = seo?.canonicalUrl || `/projects/${project.slug}`;

    const base = buildPageMetadata({
        title: metaTitle,
        description: metaDescription,
        path: canonicalPath,
        type: seo?.ogType ?? "article",
        images: [
            {
                url: ogImageUrl,
                alt: altText,
                width: 1200,
                height: 630,
            },
        ],
        publishedTime: /^\d{4}-\d{2}-\d{2}/.test(project.publishedAt)
            ? project.publishedAt
            : undefined,
        keywords:
            seo?.keywords && seo.keywords.length > 0
                ? seo.keywords
                : [
                      project.name,
                      project.category,
                      "desarrollo de software",
                      ...project.technologies.slice(0, 5),
                  ],
    });

    return {
        ...base,
        openGraph: {
            ...base.openGraph,
            title: ogTitle,
            description: ogDescription,
        },
        twitter: {
            ...base.twitter,
            card: seo?.twitterCard ?? "summary_large_image",
            title: ogTitle,
            description: ogDescription,
        },
    };
}

export function getLegalMetadata(
    page: "privacidad" | "cookies"
): Metadata {
    const pageMetadata = metadataByRoute.legal[page];
    return buildPageMetadata({
        title: pageMetadata.title,
        description: pageMetadata.description,
        path: pageMetadata.canonical,
    });
}

export function getNotFoundMetadata(): Metadata {
    const notFound = metadataByRoute.notFound;
    return buildPageMetadata({
        title: notFound.title,
        description: notFound.description,
        canonical: "",
        noIndex: true,
    });
}

export function getOpenGraphImageAlt(): string {
    const company = getCompany();
    return `${company.name} — ${company.tagline}`;
}
