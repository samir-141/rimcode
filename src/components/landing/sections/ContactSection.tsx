"use client";

import { useEffect, useRef, useState } from "react";
import { getCurrencySymbol, type Currency } from "@/lib/currency";
import { getCompany, getContact, getServicesForContact, getSocialNetworks } from "@/lib/db";
import Link from "next/link";
import CookieSettingsTrigger from "@/components/privacy/CookieSettingsTrigger";

const company = getCompany();
const contact = getContact();
const availableServices = getServicesForContact();
const socialNetworks = getSocialNetworks();

const QUOTE_STORAGE_KEY = "rimcode:quote";

type FormStatus = "idle" | "submitting" | "success" | "error";

type StoredQuote = {
    projectType?: string;
    projectTypeId?: string;
    service?: string;
    modules?: string[];
    express?: boolean;
    totalUSD?: number;
    currency?: string;
    total?: number;
};

function buildQuoteMessage(quote: StoredQuote): string {
    const projectType = quote.projectType?.trim() || "Proyecto sin especificar";
    const modules =
        quote.modules && quote.modules.length > 0
            ? quote.modules.join(", ")
            : "Sin módulos adicionales";
    const delivery = quote.express ? "Express prioritaria" : "Estándar";
    const currency = (quote.currency || "PEN") as Currency;
    const symbol = getCurrencySymbol(currency);
    const total = typeof quote.total === "number" ? quote.total : 0;
    const totalUSD = typeof quote.totalUSD === "number" ? quote.totalUSD : 0;
    const usdReference =
        currency === "USD"
            ? ""
            : ` (USD ${totalUSD.toLocaleString("es-ES")})`;

    return [
        `Hola RimCode, quiero cotizar el proyecto "${projectType}".`,
        `Módulos seleccionados: ${modules}.`,
        `Entrega: ${delivery}.`,
        `Presupuesto estimado en el simulador: ${symbol} ${total.toLocaleString(
            "es-ES"
        )} ${currency}${usdReference}.`,
    ].join("\n");
}

function normalizeQuote(value: unknown): StoredQuote | null {
    if (typeof value !== "object" || value === null) return null;
    const quote = value as StoredQuote;
    if (typeof quote.projectType !== "string" && typeof quote.service !== "string") {
        return null;
    }
    return quote;
}

interface FormResponseError {
    error?: string;
    fieldErrors?: Record<string, string>;
    missing?: string[];
    hint?: string;
    contactEmail?: string;
}

export default function ContactSection() {
    const [status, setStatus] = useState<FormStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [missingVars, setMissingVars] = useState<string[]>([]);
    const [quoteLoaded, setQuoteLoaded] = useState(false);
    const startedAtRef = useRef<number>(0);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phoneCode: "+51",
        phone: "",
        company: "",
        service: availableServices[0]?.label || "Plataforma Web SaaS",
        subject: "Consulta sobre desarrollo de software",
        message: "",
        website: "", // Campo honeypot anti-spam
    });

    useEffect(() => {
        startedAtRef.current = Date.now();

        const applyQuote = (value: unknown) => {
            const quote = normalizeQuote(value);
            if (!quote) return;

            const projectType = quote.projectType?.trim() || quote.service?.trim() || "";
            const matchedService = availableServices.find(
                (service) =>
                    service.label === quote.service ||
                    service.label === quote.projectType ||
                    service.id === quote.projectTypeId
            );

            setFormData((prev) => ({
                ...prev,
                service: matchedService?.label || prev.service,
                subject: projectType
                    ? `Cotización: ${projectType}`
                    : prev.subject,
                message: buildQuoteMessage(quote),
            }));
            setQuoteLoaded(true);
        };

        const readStoredQuote = () => {
            try {
                const raw = sessionStorage.getItem(QUOTE_STORAGE_KEY);
                if (!raw) return;
                applyQuote(JSON.parse(raw));
            } catch {
                // Cotización corrupta o sessionStorage no disponible.
            }
        };

        const handleQuoteEvent = (event: Event) => {
            const detail = (event as CustomEvent<unknown>).detail;
            applyQuote(detail);
        };

        readStoredQuote();
        window.addEventListener("rimcode:quote", handleQuoteEvent);

        return () => {
            window.removeEventListener("rimcode:quote", handleQuoteEvent);
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");
        setErrorMessage("");
        setFieldErrors({});
        setMissingVars([]);

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone ? `${formData.phoneCode} ${formData.phone}` : "",
                    company: formData.company,
                    service: formData.service,
                    subject: formData.subject,
                    message: formData.message,
                    website: formData.website,
                    startedAt: startedAtRef.current,
                }),
            });

            const data = (await response.json().catch(() => ({}))) as FormResponseError & {
                ok?: boolean;
            };

            if (!response.ok || !data.ok) {
                setStatus("error");
                setErrorMessage(
                    data.error ||
                        "No pudimos entregar tu mensaje. Por favor intenta de nuevo o escríbenos directamente por correo."
                );

                if (data.fieldErrors) {
                    setFieldErrors(data.fieldErrors);
                }

                if (data.missing) {
                    setMissingVars(data.missing);
                }
                return;
            }

            setStatus("success");
            try {
                sessionStorage.removeItem(QUOTE_STORAGE_KEY);
            } catch {
                // Sin sessionStorage: nada que limpiar.
            }
            setQuoteLoaded(false);
            setFormData({
                name: "",
                email: "",
                phoneCode: "+51",
                phone: "",
                company: "",
                service: availableServices[0]?.label || "Plataforma Web SaaS",
                subject: "Consulta sobre desarrollo de software",
                message: "",
                website: "",
            });
        } catch {
            setStatus("error");
            setErrorMessage(
                "Error de conexión con el servidor. Por favor verifica tu conexión a internet o contáctanos por correo."
            );
        }
    };

    return (
        <div className="relative w-full max-w-7xl mx-auto flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-6">
            {/* Luces decorativas ambientales */}
            <div className="pointer-events-none absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-[100px]" />
            <div className="pointer-events-none absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-lime-500/10 blur-[100px]" />

            {/* CONTENIDO PRINCIPAL */}
            <div className="my-auto">
                {/* ENCABEZADO */}
                <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[var(--header-border)] bg-[var(--header-bg)]/80 backdrop-blur-md mb-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                        <span className="text-[10px] sm:text-[11px] font-mono font-semibold tracking-widest text-[var(--accent)] uppercase">
                            06 / CONTACTO DIRECTO
                        </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-[var(--header-text)] mb-2">
                        Hablemos de tu Próximo Proyecto
                    </h2>

                    <p className="text-xs sm:text-sm text-[var(--header-muted)] max-w-2xl mx-auto leading-relaxed">
                        {contact.responseTime}
                    </p>
                </div>

                {/* DOS COLUMNAS EN DESKTOP, APILADAS EN TABLET/MOBILE */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch max-w-5xl mx-auto">
                    {/* COLUMNA IZQUIERDA: CANALES DIRECTOS & FUNDADOR */}
                    <div className="lg:col-span-4 space-y-3.5 rounded-3xl border border-[var(--header-border)] bg-[var(--header-bg)]/80 backdrop-blur-xl p-4 sm:p-6 flex flex-col justify-between">
                        <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] font-semibold block mb-2.5">
                                Canales de Comunicación
                            </span>

                            <div className="space-y-2.5">
                                {/* CORREO ELECTRÓNICO */}
                                <a
                                    href={`mailto:${contact.email}`}
                                    className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 hover:border-[var(--accent)] transition-all group min-h-[52px]"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-500 font-bold text-base">
                                        ✉️
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs sm:text-sm font-bold text-[var(--header-text)] group-hover:text-[var(--accent)] transition-colors truncate">
                                            {contact.email}
                                        </div>
                                        <div className="text-[10px] sm:text-[11px] text-[var(--header-muted)] font-mono">
                                            Consultas y requerimientos formales
                                        </div>
                                    </div>
                                </a>

                                {/* TELÉFONO (desde contact.json) */}
                                {contact.phone && (
                                    <a
                                        href={`tel:${contact.phone}`}
                                        className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 hover:border-[var(--accent)] transition-all group min-h-[52px]"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime-500/15 text-lime-500 font-bold text-base">
                                            📞
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs sm:text-sm font-bold text-[var(--header-text)] group-hover:text-[var(--accent)] transition-colors">
                                                {contact.phone}
                                            </div>
                                            <div className="text-[10px] sm:text-[11px] text-[var(--header-muted)] font-mono">
                                                Llamadas en horario hábil
                                            </div>
                                        </div>
                                    </a>
                                )}

                                {/* WHATSAPP */}
                                {contact.whatsapp.enabled ? (
                                    <a
                                        href={`https://wa.me/${contact.whatsapp.number}?text=${encodeURIComponent(
                                            contact.whatsapp.message
                                        )}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 hover:border-[var(--accent)] transition-all group min-h-[52px]"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 font-bold text-base">
                                            💬
                                        </div>
                                        <div>
                                            <div className="text-xs sm:text-sm font-bold text-[var(--header-text)] group-hover:text-[var(--accent)] transition-colors">
                                                WhatsApp Comercial
                                            </div>
                                            <div className="text-[10px] sm:text-[11px] text-[var(--header-muted)] font-mono">
                                                Respuesta inmediata en horario hábil
                                            </div>
                                        </div>
                                    </a>
                                ) : (
                                    <div className="flex items-center gap-3 p-3 sm:p-3.5 rounded-2xl border border-dashed border-[var(--header-border)] bg-black/5 dark:bg-white/5 opacity-80 min-h-[52px]">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 font-bold text-base">
                                            💬
                                        </div>
                                        <div>
                                            <div className="text-xs font-semibold text-[var(--header-text)]">
                                                WhatsApp Comercial
                                            </div>
                                            <div className="text-[10px] text-[var(--header-muted)] font-mono">
                                                Solicita atención directa desde el formulario de contacto
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* COMPROMISO DEL FUNDADOR */}
                        <div className="p-3.5 sm:p-4 rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/5">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[var(--accent)] font-bold text-xs">⚡</span>
                                <span className="text-xs font-bold text-[var(--header-text)] font-mono">
                                    {company.founder.name}
                                </span>
                            </div>
                            <p className="text-[11px] text-[var(--header-muted)] leading-relaxed italic">
                                &quot;{company.founder.quote}&quot;
                            </p>
                            <span className="text-[9px] font-mono text-[var(--accent)] mt-1.5 block">
                                {company.founder.role}
                            </span>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: FORMULARIO RESPONSIVE */}
                    <div className="lg:col-span-8 rounded-3xl border border-[var(--header-border)] bg-[var(--header-bg)]/80 backdrop-blur-xl p-4 sm:p-6 shadow-xl">
                        {status === "success" ? (
                            <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center p-4">
                                <span className="text-4xl mb-2">🎉</span>
                                <h3 className="text-lg font-bold text-[var(--header-text)] mb-1">
                                    {contact.form.successTitle}
                                </h3>
                                <p className="text-xs text-[var(--header-muted)] max-w-sm mb-4 leading-relaxed">
                                    {contact.form.successMessage}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setStatus("idle")}
                                    className="px-6 py-2.5 rounded-full text-xs font-bold bg-[var(--accent)] text-zinc-950 cursor-pointer min-h-[44px]"
                                >
                                    Enviar otra consulta
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-3.5">
                                {/* Campo trampa honeypot anti-spam (invisible para usuarios reales) */}
                                <div className="hidden" aria-hidden="true">
                                    <input
                                        type="text"
                                        name="website"
                                        tabIndex={-1}
                                        autoComplete="off"
                                        value={formData.website}
                                        onChange={(e) =>
                                            setFormData({ ...formData, website: e.target.value })
                                        }
                                    />
                                </div>

                                {quoteLoaded && (
                                    <div className="flex items-start justify-between gap-3 rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-3.5 text-xs text-[var(--header-text)] leading-relaxed">
                                        <p>
                                            <span className="font-semibold text-[var(--accent)]">
                                                Presupuesto del simulador cargado.
                                            </span>{" "}
                                            Revisa el asunto y los detalles antes de enviar;
                                            puedes editarlos libremente.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => setQuoteLoaded(false)}
                                            aria-label="Ocultar aviso de presupuesto"
                                            className="shrink-0 cursor-pointer text-[var(--header-muted)] hover:text-[var(--header-text)]"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}

                                {status === "error" && (
                                    <div
                                        role="alert"
                                        className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-600 dark:text-red-300 leading-relaxed space-y-1.5"
                                    >
                                        <p className="font-semibold">{errorMessage}</p>
                                        {process.env.NODE_ENV !== "production" && missingVars.length > 0 && (
                                            <p className="text-[11px] font-mono text-zinc-400">
                                                Variables pendientes en servidor: {missingVars.join(", ")}
                                            </p>
                                        )}
                                        <p className="text-[11px]">
                                            Puedes escribirnos directamente a:{" "}
                                            <a
                                                href={`mailto:${contact.email}`}
                                                className="underline font-bold text-[var(--header-text)]"
                                            >
                                                {contact.email}
                                            </a>
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="contact-name"
                                            className="block text-[11px] font-mono font-medium mb-1 text-[var(--header-text)]"
                                        >
                                            Tu Nombre *
                                        </label>
                                        <input
                                            id="contact-name"
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            placeholder="Ej: Samir Gómez"
                                            aria-invalid={Boolean(fieldErrors.name)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 text-[16px] sm:text-xs text-[var(--header-text)] placeholder-[var(--header-muted)] focus:outline-none focus:border-[var(--accent)] min-h-[44px]"
                                        />
                                        {fieldErrors.name && (
                                            <span className="text-[10px] text-red-500 mt-0.5 block">
                                                {fieldErrors.name}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="contact-email"
                                            className="block text-[11px] font-mono font-medium mb-1 text-[var(--header-text)]"
                                        >
                                            Correo Electrónico *
                                        </label>
                                        <input
                                            id="contact-email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) =>
                                                setFormData({ ...formData, email: e.target.value })
                                            }
                                            placeholder="contacto@tuempresa.com"
                                            aria-invalid={Boolean(fieldErrors.email)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 text-[16px] sm:text-xs text-[var(--header-text)] placeholder-[var(--header-muted)] focus:outline-none focus:border-[var(--accent)] min-h-[44px]"
                                        />
                                        {fieldErrors.email && (
                                            <span className="text-[10px] text-red-500 mt-0.5 block">
                                                {fieldErrors.email}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label
                                            htmlFor="contact-company"
                                            className="block text-[11px] font-mono font-medium mb-1 text-[var(--header-text)]"
                                        >
                                            Empresa (Opcional)
                                        </label>
                                        <input
                                            id="contact-company"
                                            type="text"
                                            value={formData.company}
                                            onChange={(e) =>
                                                setFormData({ ...formData, company: e.target.value })
                                            }
                                            placeholder="Ej: Inversiones Global"
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 text-[16px] sm:text-xs text-[var(--header-text)] placeholder-[var(--header-muted)] focus:outline-none focus:border-[var(--accent)] min-h-[44px]"
                                        />
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="contact-phone"
                                            className="block text-[11px] font-mono font-medium mb-1 text-[var(--header-text)]"
                                        >
                                            Teléfono (Opcional)
                                        </label>
                                        <div className="flex gap-2">
                                            {/* Selector de código de país */}
                                            <select
                                                value={formData.phoneCode}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, phoneCode: e.target.value })
                                                }
                                                aria-label="Código de país"
                                                className="shrink-0 w-24 px-2 py-2.5 rounded-xl border border-[var(--header-border)] bg-[var(--header-bg)] text-[16px] sm:text-xs text-[var(--header-text)] focus:outline-none focus:border-[var(--accent)] cursor-pointer min-h-[44px]"
                                            >
                                                <option value="+51">🇵🇪 +51</option>
                                                <option value="+1">🇺🇸 +1</option>
                                                <option value="+52">🇲🇽 +52</option>
                                                <option value="+57">🇨🇴 +57</option>
                                                <option value="+56">🇨🇱 +56</option>
                                                <option value="+54">🇦🇷 +54</option>
                                                <option value="+55">🇧🇷 +55</option>
                                                <option value="+58">🇻🇪 +58</option>
                                                <option value="+593">🇪🇨 +593</option>
                                                <option value="+591">🇧🇴 +591</option>
                                                <option value="+595">🇵🇾 +595</option>
                                                <option value="+598">🇺🇾 +598</option>
                                                <option value="+34">🇪🇸 +34</option>
                                                <option value="+44">🇬🇧 +44</option>
                                                <option value="+49">🇩🇪 +49</option>
                                                <option value="+33">🇫🇷 +33</option>
                                                <option value="+39">🇮🇹 +39</option>
                                                <option value="+81">🇯🇵 +81</option>
                                                <option value="+86">🇨🇳 +86</option>
                                                <option value="+91">🇮🇳 +91</option>
                                            </select>
                                            {/* Número de teléfono */}
                                            <input
                                                id="contact-phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, phone: e.target.value.replace(/[^0-9\s\-()]/g, "") })
                                                }
                                                placeholder="999 888 777"
                                                maxLength={15}
                                                className="min-w-0 flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 text-[16px] sm:text-xs text-[var(--header-text)] placeholder-[var(--header-muted)] focus:outline-none focus:border-[var(--accent)] min-h-[44px]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="contact-subject"
                                        className="block text-[11px] font-mono font-medium mb-1 text-[var(--header-text)]"
                                    >
                                        Asunto *
                                    </label>
                                    <input
                                        id="contact-subject"
                                        type="text"
                                        required
                                        value={formData.subject}
                                        onChange={(e) =>
                                            setFormData({ ...formData, subject: e.target.value })
                                        }
                                        placeholder="Ej: Cotización para plataforma SaaS de facturación"
                                        aria-invalid={Boolean(fieldErrors.subject)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 text-[16px] sm:text-xs text-[var(--header-text)] placeholder-[var(--header-muted)] focus:outline-none focus:border-[var(--accent)] min-h-[44px]"
                                    />
                                    {fieldErrors.subject && (
                                        <span className="text-[10px] text-red-500 mt-0.5 block">
                                            {fieldErrors.subject}
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="contact-message"
                                        className="block text-[11px] font-mono font-medium mb-1 text-[var(--header-text)]"
                                    >
                                        Detalles del Proyecto *
                                    </label>
                                    <textarea
                                        id="contact-message"
                                        rows={3}
                                        required
                                        value={formData.message}
                                        onChange={(e) =>
                                            setFormData({ ...formData, message: e.target.value })
                                        }
                                        placeholder="Describe brevemente tus requerimientos o idea técnica (mínimo 15 caracteres)..."
                                        aria-invalid={Boolean(fieldErrors.message)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--header-border)] bg-black/5 dark:bg-white/5 text-[16px] sm:text-xs text-[var(--header-text)] placeholder-[var(--header-muted)] focus:outline-none focus:border-[var(--accent)] resize-y"
                                    />
                                    {fieldErrors.message && (
                                        <span className="text-[10px] text-red-500 mt-0.5 block">
                                            {fieldErrors.message}
                                        </span>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === "submitting"}
                                    className="w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider bg-[var(--accent)] text-zinc-950 transition-all hover:opacity-90 hover:shadow-[0_0_20px_var(--accent)] cursor-pointer disabled:opacity-50 min-h-[44px] flex items-center justify-center"
                                >
                                    {status === "submitting"
                                        ? "Enviando mensaje..."
                                        : "Enviar Mensaje a RimCode ↗"}
                                </button>

                                <p className="text-[10px] text-[var(--header-muted)] text-center font-mono">
                                    {contact.form.privacyNote}{" "}
                                    <Link
                                        href="/legal/privacidad"
                                        className="text-[var(--accent)] underline hover:opacity-90 ml-1"
                                    >
                                        Ver política
                                    </Link>
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>

            {/* PIE DE PÁGINA INTEGRADO */}
            <div className="py-6 px-4 mt-8 sm:mt-6 border-t border-[var(--header-border)] flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] sm:text-[11px] text-[var(--header-muted)] font-mono text-center md:text-left">
                <div>
                    © 2026 <strong>{company.name}</strong> • Fundador:{" "}
                    <strong className="text-[var(--header-text)]">
                        {company.founder.name}
                    </strong>
                </div>

                {/* REDES SOCIALES (desde social.json vía getSocialNetworks()) */}
                {socialNetworks.length > 0 && (
                    <div className="flex items-center gap-2">
                        {socialNetworks.map((network) => (
                            <a
                                key={network.id}
                                href={network.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={network.name}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--header-border)] bg-black/5 dark:bg-white/5 text-[var(--header-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
                                title={network.name}
                            >
                                {network.icon === "github" && (
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                    </svg>
                                )}
                                {network.icon === "linkedin" && (
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                    </svg>
                                )}
                                {network.icon === "instagram" && (
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                    </svg>
                                )}
                                {network.icon === "x" && (
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                    </svg>
                                )}
                                {!["github","linkedin","instagram","x"].includes(network.icon) && (
                                    <span className="text-[9px] font-bold">{network.name[0]}</span>
                                )}
                            </a>
                        ))}
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                    <Link
                        href="/legal/privacidad"
                        className="text-[var(--header-muted)] hover:text-[var(--accent)] hover:underline transition-colors"
                    >
                        Privacidad
                    </Link>
                    <span>•</span>
                    <Link
                        href="/legal/cookies"
                        className="text-[var(--header-muted)] hover:text-[var(--accent)] hover:underline transition-colors"
                    >
                        Cookies
                    </Link>
                    <span>•</span>
                    <CookieSettingsTrigger />
                    <span>•</span>
                    <button
                        type="button"
                        onClick={() => {
                            document.getElementById("hero")?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                            });
                        }}
                        className="text-[var(--accent)] hover:underline cursor-pointer"
                    >
                        ↑ Inicio
                    </button>
                </div>
            </div>
        </div>
    );
}
