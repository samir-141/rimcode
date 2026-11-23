import type { Metadata } from "next";
import Link from "next/link";
import { getCompany, getContact } from "@/lib/db";
import { getLegalMetadata } from "@/lib/seo/seo-config";
import StructuredData from "@/components/seo/StructuredData";
import { buildBreadcrumbJsonLd } from "@/lib/seo/structured-data";
import CookieSettingsTrigger from "@/components/privacy/CookieSettingsTrigger";
import { getCookieCategories, type CookieCategory } from "@/lib/privacy/config";

export function generateMetadata(): Metadata {
    return getLegalMetadata("cookies");
}

export default function CookiesPage() {
    const company = getCompany();
    const contact = getContact();
    const categories = getCookieCategories();

    const breadcrumbs = buildBreadcrumbJsonLd([
        { name: "Inicio", url: "/" },
        { name: "Legal", url: "/legal/cookies" },
        { name: "Política de Cookies", url: "/legal/cookies" },
    ]);

    return (
        <div className="relative min-h-screen py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
            <StructuredData data={breadcrumbs} />

            <div className="mb-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-[var(--accent)] hover:underline mb-4"
                >
                    ← Volver al inicio
                </Link>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--header-border)] bg-[var(--header-bg)]/80 backdrop-blur-md mb-3 block w-fit">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-[var(--accent)]">
                        TRANSPARENCIA & CONSENTIMIENTO
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-[var(--header-text)] tracking-tight">
                    Política de Cookies y Tecnologías de Almacenamiento
                </h1>
                <p className="mt-2 text-xs font-mono text-[var(--header-muted)]">
                    Última actualización: 10 de noviembre de 2026 • Versión 1.0.0
                </p>
            </div>

            <article className="prose dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-[var(--header-muted)]">
                <section className="space-y-3 p-5 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5">
                    <h2 className="text-base font-bold text-[var(--header-text)] flex items-center gap-2">
                        <span>🍪</span> Centro de Control de Cookies
                    </h2>
                    <p className="text-xs">
                        Puedes modificar o revocar tus preferencias de cookies en cualquier momento haciendo clic en el siguiente botón:
                    </p>
                    <div className="pt-1">
                        <CookieSettingsTrigger className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] font-bold text-xs uppercase tracking-wider hover:opacity-90 transition cursor-pointer" />
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-[var(--header-text)]">
                        1. ¿Qué son las cookies y tecnologías similares?
                    </h2>
                    <p>
                        Las cookies son pequeños archivos de texto que los sitios web almacenan en tu dispositivo (ordenador, tablet o teléfono móvil) mientras navegas. Además de las cookies estándar, existen tecnologías afines como <strong>LocalStorage</strong> y <strong>SessionStorage</strong> que permiten almacenar preferencias de usuario localmente en el navegador sin transmitir datos innecesarios al servidor en cada petición.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-lg font-bold text-[var(--header-text)]">
                        2. Clasificación de Cookies en RimCode
                    </h2>
                    <p>
                        En {company.name} clasificamos las cookies y tecnologías de almacenamiento en cuatro categorías claras y diferenciadas:
                    </p>

                    <div className="space-y-4">
                        {categories.map((cat: CookieCategory) => (
                            <div
                                key={cat.id}
                                className="p-4 rounded-xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 space-y-2"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-[var(--header-text)] flex items-center gap-2">
                                        {cat.name}
                                        {cat.required && (
                                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-semibold">
                                                Exenta de consentimiento
                                            </span>
                                        )}
                                    </h3>
                                </div>
                                <p className="text-xs text-[var(--header-muted)]">
                                    {cat.description}
                                </p>
                                <div className="text-xs pt-1">
                                    <span className="font-semibold text-[var(--header-text)]">Finalidades:</span>
                                    <ul className="list-disc pl-5 mt-1 space-y-0.5 text-[11px]">
                                        {cat.purposes.map((purpose: string, i: number) => (
                                            <li key={i}>{purpose}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-[var(--header-text)]">
                        3. Gestión y Revocación del Consentimiento
                    </h2>
                    <p>
                        RimCode incorpora una plataforma de gestión de consentimiento (CMP) propia que:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li>Bloquea la ejecución de scripts analíticos y de marketing hasta recibir tu autorización expresa.</li>
                        <li>Permite rechazar todas las cookies opcionales con un solo clic.</li>
                        <li>Permite configurar individualmente cada categoría según tus preferencias.</li>
                        <li>Almacena de forma segura tu registro de consentimiento con fecha, hora y versión de la política.</li>
                        <li>Permite reabrir el panel de configuración en cualquier momento desde el pie de página o desde esta política.</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-[var(--header-text)]">
                        4. Cómo eliminar cookies desde tu navegador
                    </h2>
                    <p>
                        Puedes permitir, bloquear o eliminar las cookies instaladas en tu equipo mediante la configuración de las opciones de tu navegador web:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                        <li><strong>Google Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies y otros datos de sitios.</li>
                        <li><strong>Mozilla Firefox:</strong> Opciones &gt; Privacidad y Seguridad &gt; Cookies y datos del sitio.</li>
                        <li><strong>Apple Safari:</strong> Preferencias &gt; Privacidad.</li>
                        <li><strong>Microsoft Edge:</strong> Configuración &gt; Permisos del sitio &gt; Cookies y datos del sitio.</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-[var(--header-text)]">
                        5. Contacto
                    </h2>
                    <p>
                        Si tienes preguntas sobre nuestra política de cookies o sobre cómo tratamos tus datos de navegación, puedes escribirnos a <a href={`mailto:${contact.email}`} className="text-[var(--accent)] underline">{contact.email}</a>.
                    </p>
                </section>
            </article>
        </div>
    );
}
