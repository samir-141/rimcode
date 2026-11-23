import type { Metadata } from "next";
import Link from "next/link";
import { getCompany, getContact } from "@/lib/db";
import { getLegalMetadata } from "@/lib/seo/seo-config";
import StructuredData from "@/components/seo/StructuredData";
import { buildBreadcrumbJsonLd } from "@/lib/seo/structured-data";

export function generateMetadata(): Metadata {
    return getLegalMetadata("privacidad");
}

export default function PrivacidadPage() {
    const company = getCompany();
    const contact = getContact();

    const breadcrumbs = buildBreadcrumbJsonLd([
        { name: "Inicio", url: "/" },
        { name: "Legal", url: "/legal/privacidad" },
        { name: "Política de Privacidad", url: "/legal/privacidad" },
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
                        LEGAL & TRANSPARENCIA
                    </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-[var(--header-text)] tracking-tight">
                    Política de Privacidad y Protección de Datos
                </h1>
                <p className="mt-2 text-xs font-mono text-[var(--header-muted)]">
                    Última actualización: 10 de noviembre de 2026 • Versión 1.0.0
                </p>
            </div>

            <article className="prose dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-[var(--header-muted)]">
                <section className="space-y-3 p-5 rounded-2xl border border-[var(--header-border)] bg-[var(--header-bg)]/80 backdrop-blur-md">
                    <h2 className="text-lg font-bold text-[var(--header-text)]">
                        1. Responsable del Tratamiento
                    </h2>
                    <p>
                        El responsable del tratamiento de los datos personales recabados a través de este sitio web es <strong>{company.founder.name}</strong>, titular de la marca y proyecto tecnológico <strong>{company.name}</strong>.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                        <li><strong>Identidad:</strong> {company.founder.name} ({company.founder.role})</li>
                        <li><strong>Correo de contacto:</strong> <a href={`mailto:${contact.email}`} className="text-[var(--accent)] underline">{contact.email}</a></li>
                        <li><strong>WhatsApp de contacto:</strong> {contact.phone}</li>
                        <li><strong>País de operación:</strong> Perú (cobertura para Perú y Latinoamérica)</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-[var(--header-text)]">
                        2. Marco Normativo Aplicable
                    </h2>
                    <p>
                        Esta política se elabora en estricto cumplimiento de la normativa peruana en materia de protección de datos personales:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Constitución Política del Perú</strong>, artículo 2, numeral 6 (derecho a la autodeterminación informativa).</li>
                        <li><strong>Ley N.º 29733</strong> — Ley de Protección de Datos Personales.</li>
                        <li><strong>Decreto Supremo N.º 016-2024-JUS</strong> — Reglamento vigente de la Ley N.º 29733.</li>
                    </ul>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-[var(--header-text)]">
                        3. Datos Personales Recabados y Finalidad
                    </h2>
                    <p>
                        Tratamos únicamente los datos estrictamente necesarios según la acción realizada por el usuario en el sitio web:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 rounded-xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 space-y-1.5">
                            <h3 className="font-bold text-[var(--header-text)] text-xs uppercase font-mono text-[var(--accent)]">
                                Formulario de Contacto y Cotización
                            </h3>
                            <p className="text-xs">
                                <strong>Datos:</strong> Nombre, correo electrónico, teléfono (con código de país), empresa y detalles del requerimiento de software.
                            </p>
                            <p className="text-xs">
                                <strong>Finalidad:</strong> Atender consultas comerciales, preparar propuestas técnicas y coordinar sesiones de consultoría.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 space-y-1.5">
                            <h3 className="font-bold text-[var(--header-text)] text-xs uppercase font-mono text-[var(--accent)]">
                                Asistente Virtual RIMY (Chat)
                            </h3>
                            <p className="text-xs">
                                <strong>Datos:</strong> Mensajes de consulta sobre proyectos, tecnologías o servicios de RimCode.
                            </p>
                            <p className="text-xs">
                                <strong>Finalidad:</strong> Orientar sobre la oferta documentada de RimCode y mejorar el asistente. La clasificación del texto se ejecuta localmente. Cuando se activa el registro, guardamos consultas y acciones del chat en el servidor. Ocultamos direcciones de correo y números de teléfono detectados en las consultas. Evita incluir datos personales.
                            </p>
                            <p className="text-xs">
                                El dictado se inicia desde su control. Tu navegador puede procesar el audio con su servicio de reconocimiento. RimCode recibe el texto cuando lo envías y no almacena grabaciones. La voz de Rimy se genera a partir de respuestas públicas del sitio.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-[var(--header-text)]">
                        4. Base de Legitimación y Consentimiento
                    </h2>
                    <p>
                        La base legal para el tratamiento de tus datos es el <strong>consentimiento libre, previo, expreso e informado</strong> otorgado al enviar un formulario o al interactuar con el asistente, así como las medidas precontractuales orientadas a formalizar una propuesta comercial a tu solicitud.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-[var(--header-text)]">
                        5. Transferencia y Destinatarios
                    </h2>
                    <p>
                        RimCode <strong>no vende, alquila ni comercializa</strong> tus datos personales con terceros. Los datos pueden ser procesados mediante proveedores tecnológicos de infraestructura con estrictos acuerdos de confidencialidad y estándares de seguridad (como servicios de hosting Vercel y plataformas de correo transaccional seguras).
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-[var(--header-text)]">
                        6. Derechos ARCO del Titular
                    </h2>
                    <p>
                        De conformidad con la Ley N.º 29733, puedes ejercer en cualquier momento tus derechos de:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Acceso:</strong> Conocer qué datos tuyos tenemos y cómo son tratados.</li>
                        <li><strong>Rectificación:</strong> Actualizar o corregir datos inexactos o incompletos.</li>
                        <li><strong>Cancelación / Supresión:</strong> Solicitar la eliminación de tus datos cuando no sean necesarios.</li>
                        <li><strong>Oposición:</strong> Oponerte al tratamiento para finalidades específicas.</li>
                        <li><strong>Revocación:</strong> Retirar el consentimiento otorgado previamente.</li>
                    </ul>
                    <p className="pt-2">
                        Para ejercer cualquiera de estos derechos, envía un correo a <a href={`mailto:${contact.email}`} className="text-[var(--accent)] underline">{contact.email}</a> indicando en el asunto &quot;Ejercicio de Derechos ARCO&quot; junto con tu nombre completo y la solicitud específica. Te responderemos dentro de los plazos establecidos por el reglamento.
                    </p>
                </section>

                <section className="space-y-3">
                    <h2 className="text-lg font-bold text-[var(--header-text)]">
                        7. Seguridad de la Información
                    </h2>
                    <p>
                        Implementamos medidas técnicas y organizativas para salvaguardar tus datos personales frente a accesos no autorizados, pérdidas accidentales o alteraciones, incluyendo cifrado HTTPS (TLS), controles anti-spam honeypot y limitación de tasa de solicitudes (rate limiting).
                    </p>
                </section>
            </article>
        </div>
    );
}
