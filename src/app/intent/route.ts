import { getSettings } from "@/lib/db";
import { classifyIntent, readChatState, readRecentTurns } from "@/lib/rimy/intent-service";
import { limitLocalRequest } from "@/lib/server/rate-limit";
import { apiJson, readJsonObject, requestError } from "@/lib/server/request";

export async function POST(request: Request) {
    try {
        const body = await readJsonObject(request, 16_384);
        const { mensaje, estado, historial_reciente } = body;
        const settings = getSettings().chat;
        const history = readRecentTurns(historial_reciente);
        if (typeof mensaje !== "string" || mensaje.trim().length < settings.minMessageLength ||
            mensaje.length > settings.maxMessageLength || !history ||
            (estado !== undefined && (!estado || typeof estado !== "object" || Array.isArray(estado)))) {
            return apiJson({ error: "Revisa mensaje, historial_reciente y estado." }, 422);
        }
        const limit = limitLocalRequest(request, "intent", settings.rateLimitPerMinute, 60_000);
        if (!limit.allowed) return apiJson({ error: "Clasificador ocupado." }, 429,
            { "Retry-After": String(limit.retryAfterSeconds) });
        const { decision } = await classifyIntent(mensaje.trim(), history, readChatState(estado), request.signal);
        return apiJson(decision);
    } catch (error) {
        return requestError(error);
    }
}
