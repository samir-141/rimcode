import { NextResponse } from "next/server";

import { getContact, getServices, getSettings } from "@/lib/db";
import { getClientIp, pruneRateLimitBuckets, rateLimit } from "@/lib/server/rate-limit";
import { cleanText, escapeHtml, isValidEmail } from "@/lib/validation";

type ContactPayload = {
    name?: unknown;
    email?: unknown;
    company?: unknown;
    service?: unknown;
    subject?: unknown;
    message?: unknown;
    website?: unknown;
    startedAt?: unknown;
};

type ProviderResult = {
    ok: boolean;
    status?: number;
    detail?: string;
};

const settings = getSettings();
const contactData = getContact();
const allowedServices = new Set(
    getServices().services.map((service) => service.contactLabel || service.name)
);

function getProviderConfig() {
    const explicit = process.env.CONTACT_PROVIDER?.trim().toLowerCase();

    if (explicit === "resend") return "resend" as const;
    if (explicit === "webhook") return "webhook" as const;
    if (process.env.RESEND_API_KEY) return "resend" as const;
    if (process.env.CONTACT_WEBHOOK_URL) return "webhook" as const;
    return null;
}

function getMissingVariables(provider: "resend" | "webhook" | null): string[] {
    if (provider === "resend") {
        return ["RESEND_API_KEY", "CONTACT_EMAIL", "CONTACT_FROM_EMAIL"].filter(
            (key) => !process.env[key]?.trim()
        );
    }

    if (provider === "webhook") {
        return ["CONTACT_WEBHOOK_URL"].filter(
            (key) => !process.env[key]?.trim()
        );
    }

    return ["CONTACT_PROVIDER", "RESEND_API_KEY", "CONTACT_EMAIL", "CONTACT_FROM_EMAIL"];
}

function buildEmailHtml(fields: {
    name: string;
    email: string;
    company: string;
    service: string;
    subject: string;
    message: string;
}): string {
    const rows = [
        ["Nombre", fields.name],
        ["Correo", fields.email],
        ["Empresa", fields.company || "No indicada"],
        ["Servicio", fields.service || "No indicado"],
        ["Asunto", fields.subject],
    ]
        .map(
            ([label, value]) =>
                `<tr><td style="padding:6px 12px 6px 0;color:#52525b;font-size:13px">${escapeHtml(
                    label
                )}</td><td style="padding:6px 0;color:#18181b;font-size:13px;font-weight:600">${escapeHtml(
                    value
                )}</td></tr>`
        )
        .join("");

    return `
        <div style="font-family:Inter,Segoe UI,Arial,sans-serif;max-width:620px">
            <h2 style="color:#18181b;margin:0 0 4px">Nueva consulta desde RimCode</h2>
            <p style="color:#71717a;font-size:13px;margin:0 0 20px">Enviada desde el formulario de contacto del sitio.</p>
            <table style="border-collapse:collapse;width:100%">${rows}</table>
            <div style="margin-top:20px;padding:16px;border-radius:12px;background:#f4f4f5">
                <p style="color:#52525b;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Mensaje</p>
                <p style="color:#18181b;font-size:14px;line-height:1.6;white-space:pre-wrap;margin:0">${escapeHtml(
                    fields.message
                )}</p>
            </div>
        </div>
    `;
}

async function sendWithResend(
    fields: {
        name: string;
        email: string;
        company: string;
        service: string;
        subject: string;
        message: string;
    },
    request: Request
): Promise<ProviderResult> {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const to = process.env.CONTACT_EMAIL?.trim() || contactData.email;
    const from = process.env.CONTACT_FROM_EMAIL?.trim();

    if (!apiKey || !to || !from) {
        return { ok: false, detail: "Configuración de Resend incompleta." };
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to: [to],
            reply_to: fields.email,
            subject: `[RimCode] ${fields.subject}`,
            html: buildEmailHtml(fields),
            text: [
                fields.name,
                fields.email,
                fields.company || "Empresa no indicada",
                fields.service || "Servicio no indicado",
                "",
                fields.message,
            ].join("\n"),
        }),
        signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
        let detail = `Resend respondió ${response.status}.`;
        try {
            const body = (await response.json()) as { message?: string };
            if (body.message) detail = body.message;
        } catch {
            // La respuesta no era JSON.
        }

        console.error("[contact] Resend falló:", response.status, detail, request.url);
        return { ok: false, status: 502, detail };
    }

    return { ok: true, status: 200 };
}

async function sendWithWebhook(
    fields: {
        name: string;
        email: string;
        company: string;
        service: string;
        subject: string;
        message: string;
    }
): Promise<ProviderResult> {
    const endpoint = process.env.CONTACT_WEBHOOK_URL?.trim();
    const secret = process.env.CONTACT_WEBHOOK_SECRET?.trim();

    if (!endpoint) {
        return { ok: false, detail: "Configuración de webhook incompleta." };
    }

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (secret) headers.Authorization = `Bearer ${secret}`;

    const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
            source: "rimcode-contact-form",
            submittedAt: new Date().toISOString(),
            ...fields,
        }),
        signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
        console.error("[contact] Webhook falló:", response.status);
        return {
            ok: false,
            status: 502,
            detail: `El servicio de correo respondió ${response.status}.`,
        };
    }

    return { ok: true, status: 200 };
}

export async function POST(request: Request) {
    pruneRateLimitBuckets();

    let payload: ContactPayload;
    try {
        payload = (await request.json()) as ContactPayload;
    } catch {
        return NextResponse.json(
            { ok: false, error: "El cuerpo de la solicitud no es JSON válido." },
            { status: 400 }
        );
    }

    if (!payload || typeof payload !== "object") {
        return NextResponse.json(
            { ok: false, error: "Solicitud no válida." },
            { status: 400 }
        );
    }

    const ip = getClientIp(request);
    const limit = rateLimit(
        `contact:${ip}`,
        settings.contact.rateLimitPerHour,
        60 * 60 * 1000
    );

    if (!limit.allowed) {
        return NextResponse.json(
            {
                ok: false,
                error: "Has enviado demasiadas consultas. Intenta de nuevo más tarde.",
            },
            {
                status: 429,
                headers: { "Retry-After": String(limit.retryAfterSeconds) },
            }
        );
    }

    // Honeypot: un humano no ve ni rellena este campo.
    if (typeof payload.website === "string" && payload.website.trim() !== "") {
        return NextResponse.json({ ok: true });
    }

    const startedAt =
        typeof payload.startedAt === "number" ? payload.startedAt : 0;
    const elapsed = Date.now() - startedAt;

    if (
        startedAt > 0 &&
        (elapsed < settings.contact.minimumFillTimeMs ||
            elapsed > settings.contact.maximumFillTimeMs)
    ) {
        return NextResponse.json(
            {
                ok: false,
                error: "El formulario se envió demasiado rápido o caducó. Recarga la página e inténtalo de nuevo.",
            },
            { status: 400 }
        );
    }

    const name = cleanText(payload.name, 120);
    const email = cleanText(payload.email, 254).toLowerCase();
    const company = cleanText(payload.company, 160);
    const service = cleanText(payload.service, 160);
    const subject = cleanText(payload.subject, 180);
    const message = cleanText(
        payload.message,
        settings.contact.maxMessageLength
    );

    const fieldErrors: Record<string, string> = {};

    if (name.length < 2) {
        fieldErrors.name = "Indica tu nombre (mínimo 2 caracteres).";
    }
    if (!isValidEmail(email)) {
        fieldErrors.email = "El correo electrónico no es válido.";
    }
    if (subject.length < 3) {
        fieldErrors.subject = "Indica un asunto de al menos 3 caracteres.";
    }
    if (message.length < settings.contact.minMessageLength) {
        fieldErrors.message = `Describe tu proyecto con al menos ${settings.contact.minMessageLength} caracteres.`;
    }
    if (service && !allowedServices.has(service)) {
        fieldErrors.service = "El servicio seleccionado no es válido.";
    }

    if (Object.keys(fieldErrors).length > 0) {
        return NextResponse.json(
            {
                ok: false,
                error: "Revisa los campos marcados.",
                fieldErrors,
            },
            { status: 422 }
        );
    }

    const provider = getProviderConfig();
    const missing = getMissingVariables(provider);

    if (!provider || missing.length > 0) {
        return NextResponse.json(
            {
                ok: false,
                error: "El envío de correo aún no está configurado en este entorno.",
                missing,
                hint: "Configura las variables indicadas en .env.example y reinicia el servidor. Mientras tanto puedes escribir directamente al correo de contacto.",
                contactEmail: contactData.email,
            },
            { status: 503 }
        );
    }

    const fields = { name, email, company, service, subject, message };

    try {
        const result =
            provider === "resend"
                ? await sendWithResend(fields, request)
                : await sendWithWebhook(fields);

        if (!result.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        "No pudimos entregar el mensaje al servicio de correo. No se ha simulado un envío exitoso.",
                    detail:
                        process.env.NODE_ENV === "production"
                            ? undefined
                            : result.detail,
                    contactEmail: contactData.email,
                },
                { status: result.status ?? 502 }
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("[contact] Error de red:", error);

        return NextResponse.json(
            {
                ok: false,
                error:
                    "No pudimos conectar con el servicio de correo. Intenta de nuevo o escríbenos directamente.",
                contactEmail: contactData.email,
            },
            { status: 502 }
        );
    }
}
