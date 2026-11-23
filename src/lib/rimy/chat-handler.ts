import { getSettings, isCurrency } from "@/lib/db";
import { answerChat } from "@/lib/rimy/chat-service";
import { readConversationContext } from "@/lib/rimy/conversation";
import { readChatState, readRecentTurns } from "@/lib/rimy/intent-service";
import { getChatCopy } from "@/lib/rimy/knowledge";
import { recordTurn } from "@/lib/rimy/turn-log";
import { limitLocalRequest } from "@/lib/server/rate-limit";
import { apiJson, readJsonObject, RequestError } from "@/lib/server/request";
import { grantVoice } from "@/lib/server/voice";

const settings = getSettings().chat;
const copy = getChatCopy();

export async function resolveChat(request: Request) {
    let payload: Record<string, unknown>;
    try {
        payload = await readJsonObject(request, 8192);
    } catch (error) {
        if (!(error instanceof RequestError)) throw error;
        return { error: error.message, status: error.status } as const;
    }

    const limit = limitLocalRequest(request, "chat", settings.rateLimitPerMinute, 60_000);
    if (!limit.allowed) {
        return {
            error: "El chat está ocupado. Espera un momento y vuelve a intentarlo.",
            status: 429,
            headers: { "Retry-After": String(limit.retryAfterSeconds) },
        } as const;
    }

    if (typeof payload.message !== "string") return { error: "El mensaje es obligatorio.", status: 400 } as const;
    const message = payload.message.trim();
    if (message.length < settings.minMessageLength || payload.message.length > settings.maxMessageLength) {
        return {
            error: `El mensaje debe tener entre ${settings.minMessageLength} y ${settings.maxMessageLength} caracteres.`,
            status: 422,
        } as const;
    }

    const currency = typeof payload.currency === "string" && isCurrency(payload.currency) ? payload.currency : "PEN";
    const history = readRecentTurns(payload.historial_reciente);
    if (!history) return { error: "El historial reciente no es válido.", status: 422 } as const;
    const result = await answerChat(message, currency, request.signal, readConversationContext(payload.context), readChatState(payload.estado), history);
    const turnGrant = await recordTurn(message, result.decision, result.source, result.answer);
    return { ...result, turnGrant } as const;
}

export async function chatResponse(request: Request, legacy = false) {
    const result = await resolveChat(request);
    if ("error" in result) {
        return apiJson(legacy ? { success: false, error: result.error } : { ok: false, error: result.error },
            result.status, result.headers);
    }

    const { answer, decision, source, newState, turnGrant } = result;
    if (legacy) return apiJson({
        success: true,
        reply: answer.reply,
        emotion: answer.inScope ? "happy" : "thinking",
        suggestions: answer.suggestions,
        timestamp: new Date().toISOString(),
    });

    return apiJson({
        ok: true,
        mode: "local",
        modeLabel: copy.localModeLabel,
        ...answer,
        intent: decision,
        intentSource: source,
        estado: newState,
        turnGrant,
        voiceGrant: grantVoice(answer.reply, request),
    });
}
