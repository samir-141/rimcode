import { NextResponse } from "next/server";

import { getRimy, getSettings, isCurrency } from "@/lib/db";
import { getClientIp, pruneRateLimitBuckets, rateLimit } from "@/lib/server/rate-limit";
import {
    answerLocally,
    getChatCopy,
} from "@/lib/rimy/knowledge";
import {
    answerWithAi,
    getAiConfigurationMissing,
    isAiConfigured,
    type ChatTurn,
} from "@/lib/rimy/chat-service";
import type { Currency } from "@/lib/db/types";

type ChatPayload = {
    message?: unknown;
    history?: unknown;
    currency?: unknown;
    forceLocal?: unknown;
};

const settings = getSettings();
const rimy = getRimy();
const chatCopy = getChatCopy();

function sanitizeHistory(value: unknown): ChatTurn[] {
    if (!Array.isArray(value)) return [];

    return value
        .filter(
            (turn): turn is ChatTurn =>
                typeof turn === "object" &&
                turn !== null &&
                ((turn as ChatTurn).role === "user" ||
                    (turn as ChatTurn).role === "assistant") &&
                typeof (turn as ChatTurn).content === "string"
        )
        .slice(-settings.chat.historyLimit)
        .map((turn) => ({
            role: turn.role,
            content: turn.content.trim().slice(0, 700),
        }))
        .filter((turn) => turn.content.length > 0);
}

export async function POST(request: Request) {
    pruneRateLimitBuckets();

    const ip = getClientIp(request);
    const limit = rateLimit(
        `chat:${ip}`,
        settings.chat.rateLimitPerMinute,
        60 * 1000
    );

    if (!limit.allowed) {
        return NextResponse.json(
            {
                ok: false,
                error: "Demasiados mensajes seguidos. Espera un momento y vuelve a intentarlo.",
            },
            {
                status: 429,
                headers: { "Retry-After": String(limit.retryAfterSeconds) },
            }
        );
    }

    let payload: ChatPayload;
    try {
        payload = (await request.json()) as ChatPayload;
    } catch {
        return NextResponse.json(
            { ok: false, error: "El cuerpo de la solicitud no es JSON válido." },
            { status: 400 }
        );
    }

    if (!payload || typeof payload.message !== "string") {
        return NextResponse.json(
            { ok: false, error: "El mensaje es obligatorio." },
            { status: 400 }
        );
    }

    const message = payload.message.trim();

    if (
        message.length < settings.chat.minMessageLength ||
        message.length > settings.chat.maxMessageLength
    ) {
        return NextResponse.json(
            {
                ok: false,
                error: `El mensaje debe tener entre ${settings.chat.minMessageLength} y ${settings.chat.maxMessageLength} caracteres.`,
            },
            { status: 422 }
        );
    }

    const currency: Currency = isCurrency(String(payload.currency))
        ? (String(payload.currency) as Currency)
        : "PEN";

    const history = sanitizeHistory(payload.history);
    const forceLocal = payload.forceLocal === true;

    // --- DB FIRST ---
    const localStart = Date.now();
    const local = answerLocally(message, currency);
    const localMs = Date.now() - localStart;

    // If forced local OR local gave a confident in-scope answer → return immediately
    const isConfident = local.inScope && local.matched.length > 0;

    if (forceLocal || !isAiConfigured() || isConfident) {
        console.log("[rimy]", { source: "local_db", localMs, aiMs: 0, totalMs: localMs, matched: local.matched });
        return NextResponse.json({
            ok: true,
            mode: "local",
            modeLabel: chatCopy.localModeLabel,
            reply: local.reply,
            suggestions: local.suggestions,
            matched: local.matched,
            inScope: local.inScope,
            ...((!isAiConfigured()) ? { note: "Sin proveedor de IA.", missing: getAiConfigurationMissing() } : {}),
        });
    }

    // --- AI SECOND (with local context) ---
    const aiStart = Date.now();
    const result = await answerWithAi(message, history, settings.chat.timeoutMs);
    const aiMs = Date.now() - aiStart;
    const totalMs = localMs + aiMs;

    if (!result.ok) {
        // Graceful fallback to local
        console.warn("[rimy] AI failed, falling back to local.", { error: result.error });
        console.log("[rimy]", { source: "fallback_local", localMs, aiMs, totalMs });
        return NextResponse.json({
            ok: true,
            mode: "local",
            modeLabel: chatCopy.localModeLabel,
            reply: local.reply || "Ocurrió un error con el servicio de IA. Te respondo con la información local disponible.",
            suggestions: local.suggestions,
            matched: local.matched,
            inScope: local.inScope,
        });
    }

    console.log("[rimy]", { source: "gemini", localMs, aiMs, totalMs });
    return NextResponse.json({
        ok: true,
        mode: "ai",
        modeLabel: chatCopy.aiModeLabel,
        reply: result.reply,
        suggestions: rimy.chat.suggestions,
        inScope: true,
    });
}
