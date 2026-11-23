import { createHash } from "node:crypto";

import { validateContact } from "@/lib/contact";
import { getContact, getSettings } from "@/lib/db";
import { recordChatEvent } from "@/lib/rimy/turn-log";
import { limitRequest } from "@/lib/server/rate-limit";
import { apiJson, readJsonObject, requestError } from "@/lib/server/request";
import { parseUrl } from "@/lib/urls";
import { escapeHtml } from "@/lib/validation";

const settings = getSettings().contact;
const contact = getContact();
const submissions = new Map<string, { answer: Promise<boolean>; until: number; rimyRecorded?: boolean }>();
type Fields = ReturnType<typeof validateContact>["fields"];

function providerConfig() {
    const provider = process.env.CONTACT_PROVIDER?.trim().toLowerCase() ||
        (process.env.RESEND_API_KEY ? "resend" : "webhook");
    const token = process.env.RESEND_API_KEY?.trim();
    const from = process.env.CONTACT_FROM_EMAIL?.trim();
    const to = process.env.CONTACT_EMAIL?.trim();
    if (provider === "resend" && token && from && to) {
        return { provider, token, from, to } as const;
    }
    const endpoint = parseUrl(process.env.CONTACT_WEBHOOK_URL?.trim() ?? "");
    if (provider === "webhook" && endpoint && !endpoint.username && !endpoint.password &&
        (endpoint.protocol === "https:" ||
            (endpoint.protocol === "http:" && ["127.0.0.1", "[::1]", "localhost"].includes(endpoint.hostname)))) {
        return { provider, endpoint, token: process.env.CONTACT_WEBHOOK_SECRET?.trim() } as const;
    }
    return null;
}

async function deliver(config: NonNullable<ReturnType<typeof providerConfig>>, fields: Fields, key: string) {
    const headers = new Headers({ "Content-Type": "application/json", "Idempotency-Key": key });
    if (config.token) headers.set("Authorization", `Bearer ${config.token}`);
    const text = [
        `Nombre: ${fields.name}`, `Correo: ${fields.email}`, `Teléfono: ${fields.phone || "No indicado"}`,
        `Empresa: ${fields.company || "No indicada"}`, `Servicio: ${fields.service || "No indicado"}`,
        "", fields.message,
    ].join("\n");
    const body = config.provider === "resend" ? {
        from: config.from,
        to: [config.to],
        reply_to: fields.email,
        subject: `[RimCode] ${fields.subject}`,
        html: `<h2>Nueva consulta desde RimCode</h2><p style="white-space:pre-wrap">${escapeHtml(text)}</p>`,
        text,
    } : { source: "rimcode-contact-form", submittedAt: new Date().toISOString(), ...fields };

    try {
        const response = await fetch(config.provider === "resend" ? "https://api.resend.com/emails" : config.endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
            redirect: "error",
            signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok) console.error("[contact] Fallo del proveedor", config.provider, response.status);
        void response.body?.cancel().catch(() => {});
        return response.ok;
    } catch {
        console.error("[contact] Fallo de conexión con el proveedor", config.provider);
        return false;
    }
}

export async function POST(request: Request) {
    let payload: Record<string, unknown>;
    try {
        payload = await readJsonObject(request, 36_000);
    } catch (error) {
        return requestError(error);
    }

    if (typeof payload.website === "string" && payload.website.trim()) return apiJson({ ok: true });
    const startedAt = payload.startedAt;
    if (startedAt !== undefined && (typeof startedAt !== "number" ||
        Date.now() - startedAt < settings.minimumFillTimeMs ||
        Date.now() - startedAt > settings.maximumFillTimeMs)) {
        return apiJson({
            ok: false,
            error: "El formulario se envió demasiado rápido o caducó. Revisa los campos y vuelve a intentarlo.",
        }, 400);
    }

    const { fields, errors } = validateContact(payload);
    if (Object.keys(errors).length) {
        return apiJson({ ok: false, error: "Revisa los campos marcados.", fieldErrors: errors }, 422);
    }

    const config = providerConfig();
    if (!config) {
        return apiJson({
            ok: false,
            error: "El formulario no está disponible en este momento. Puedes escribir al correo de contacto.",
            contactEmail: contact.email,
        }, 503);
    }

    const submission = typeof payload.submissionId === "string" && /^[\da-f-]{36}$/i.test(payload.submissionId)
        ? payload.submissionId : "";
    const key = "contact-" + createHash("sha256").update(JSON.stringify([submission, fields])).digest("hex");
    const now = Date.now();
    for (const [id, entry] of submissions) {
        if (entry.until <= now) submissions.delete(id);
    }

    let entry = submissions.get(key);
    if (!entry) {
        const limit = await limitRequest(request, "contact", settings.rateLimitPerHour, 3_600_000, 20);
        entry = submissions.get(key);
        if (!entry) {
            if (!limit.allowed || submissions.size >= 2_000) {
                return apiJson({
                    ok: false,
                    error: "El formulario está ocupado. Vuelve a intentarlo más tarde.",
                }, limit.unavailable ? 503 : 429, { "Retry-After": String(limit.retryAfterSeconds) });
            }
            entry = { answer: deliver(config, fields, key), until: now + 600_000 };
            submissions.set(key, entry);
        }
    }

    if (await entry.answer) {
        if (!entry.rimyRecorded && typeof payload.rimyTurnGrant === "string") {
            entry.rimyRecorded = true;
            await recordChatEvent(payload.rimyTurnGrant, "dejo_contacto");
        }
        return apiJson({ ok: true });
    }

    if (submissions.get(key) === entry) submissions.delete(key);
    return apiJson({
        ok: false,
        error: "No pudimos confirmar la entrega. Intenta de nuevo o escríbenos directamente.",
        contactEmail: contact.email,
    }, 502);
}
