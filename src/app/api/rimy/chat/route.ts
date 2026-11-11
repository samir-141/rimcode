import { NextResponse } from "next/server";

import { getSettings, isCurrency } from "@/lib/db";
import { answerLocally, getChatCopy } from "@/lib/rimy/knowledge";
import { getClientIp, pruneRateLimitBuckets, rateLimit } from "@/lib/server/rate-limit";
import type { Currency } from "@/lib/db/types";

type ChatPayload = {
    message?: unknown;
    currency?: unknown;
};

const settings = getSettings();
const chatCopy = getChatCopy();

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

    const local = answerLocally(message, currency);

    return NextResponse.json({
        ok: true,
        mode: "local",
        modeLabel: chatCopy.localModeLabel,
        reply: local.reply,
        table: local.table,
        suggestions: local.suggestions,
        matched: local.matched,
        category: local.category,
        inScope: local.inScope,
    });
}
