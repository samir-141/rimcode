import { siteConfig, seoConfig } from "@/data/site";

export function JsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || seoConfig.siteUrl;

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: "RimCode — Samir Gómez",
    url: baseUrl,
    description: siteConfig.subheadline,
    inLanguage: "es",
    author: {
      "@type": "Person",
      name: siteConfig.developer,
      url: baseUrl,
      jobTitle: siteConfig.role,
      sameAs: [
        siteConfig.contact.githubUrl,
        siteConfig.contact.linkedinUrl,
      ],
    },
  };

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: siteConfig.developer,
    jobTitle: siteConfig.role,
    url: baseUrl,
    email: `mailto:${siteConfig.contact.email}`,
    sameAs: [
      siteConfig.contact.githubUrl,
      siteConfig.contact.linkedinUrl,
    ],
    knowsAbout: [
      "Full-Stack Web Development",
      "Next.js",
      "React",
      "TypeScript",
      "NestJS",
      "PostgreSQL",
      "Prisma ORM",
      "ERP Software Development",
      "Inventory Management Systems",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
    </>
  );
}

