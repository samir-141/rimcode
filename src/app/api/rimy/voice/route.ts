import { limitRequest } from "@/lib/server/rate-limit";
import { apiJson, readJsonObject, requestError } from "@/lib/server/request";
import { validVoiceGrant, voiceConfig } from "@/lib/server/voice";
import { getProjectBySlug, getRimy } from "@/lib/db";
import { buildProjectNarration } from "@/lib/rimy/project-narration";
import { maximumVoiceText, prepareRimySpeech, projectVoiceParts, type ProjectVoicePart } from "@/lib/rimy/voice-text";

const maximumAudio = 14_000_000;
const unavailable = () => apiJson({ ok: false, error: "La voz natural no está disponible en este momento." }, 503);

export async function POST(request: Request) {
    let payload: Record<string, unknown>;
    try {
        payload = await readJsonObject(request, 14_000);
    } catch (error) {
        return requestError(error);
    }

    const config = voiceConfig();
    if (!config) return apiJson({ ok: false, error: "Voz natural desactivada." }, 503, { "X-Rimy-Voice": "device" });

    const { text, grant } = payload;
    if (typeof text !== "string" || !text.trim() || text.length > maximumVoiceText) {
        return apiJson({ ok: false, error: "Texto de voz no válido." }, 403);
    }
    const greeting = payload.greeting === true && text === getRimy().chat.welcome;
    const project = typeof payload.project === "string" ? getProjectBySlug(payload.project) : undefined;
    const part = projectVoiceParts.find((name): name is ProjectVoicePart => name === payload.part);
    const projectText = Boolean(project && part && buildProjectNarration(project)[part] === text);
    const verified = typeof grant === "string" && validVoiceGrant(text, grant, request, config.signingKey);
    if (!greeting && !projectText && !verified) {
        return apiJson({ ok: false, error: "Esta respuesta no tiene una autorización de voz vigente." }, 403);
    }

    const limit = await limitRequest(request, "voice", 8, 60_000, 20);
    if (!limit.allowed) return apiJson({ ok: false, error: "La voz está ocupada. Intenta más tarde." },
        limit.unavailable ? 503 : 429, { "Retry-After": String(limit.retryAfterSeconds) });

    try {
        const response = await fetch(config.url, {
            method: "POST",
            headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ text: prepareRimySpeech(text), cache: "public-answer" }),
            redirect: "error",
            cache: "no-store",
            signal: AbortSignal.any([request.signal, AbortSignal.timeout(25_000)]),
        });
        const type = response.headers.get("content-type")?.split(";")[0].trim();
        const size = Number(response.headers.get("content-length"));
        if (!response.ok || !response.body || type !== "audio/wav" ||
            !Number.isSafeInteger(size) || size < 44 || size > maximumAudio) {
            void response.body?.cancel().catch(() => {});
            console.warn("[rimy-voice] Respuesta de síntesis no disponible", response.status);
            return unavailable();
        }
        let received = 0;
        const bounded = response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, controller) {
                received += chunk.byteLength;
                if (received > size) throw new Error("Audio excede el tamaño declarado");
                controller.enqueue(chunk);
            },
        }));
        return new Response(bounded, {
            headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store", "Content-Length": String(size) },
        });
    } catch {
        if (!request.signal.aborted) console.warn("[rimy-voice] Servicio de síntesis no disponible");
        return unavailable();
    }
}
