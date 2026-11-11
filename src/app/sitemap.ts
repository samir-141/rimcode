import type { MetadataRoute } from "next";
import { getProjects, getSiteUrl } from "@/lib/db";

export default function sitemap(): MetadataRoute.Sitemap {
    const siteUrl = getSiteUrl();
    const projects = getProjects();
    const now = new Date();

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: siteUrl,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 1.0,
        },
        {
            url: `${siteUrl}/projects`,
            lastModified: now,
            changeFrequency: "weekly",
            priority: 0.9,
        },
        {
            url: `${siteUrl}/legal/privacidad`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.3,
        },
        {
            url: `${siteUrl}/legal/cookies`,
            lastModified: now,
            changeFrequency: "monthly",
            priority: 0.3,
        },
    ];

    const projectRoutes: MetadataRoute.Sitemap = projects.map((project) => ({
        url: `${siteUrl}/projects/${project.slug}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
    }));

    return [...staticRoutes, ...projectRoutes];
}

