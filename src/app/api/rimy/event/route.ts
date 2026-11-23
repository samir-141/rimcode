import { recordChatEvent } from "@/lib/rimy/turn-log";
import { limitLocalRequest } from "@/lib/server/rate-limit";
import { apiJson, readJsonObject, requestError } from "@/lib/server/request";

export async function POST(request: Request) {
    try {
        const body = await readJsonObject(request, 1200);
        const limit = limitLocalRequest(request, "rimy-event", 36, 60_000);
        if (!limit.allowed) return apiJson({ ok: false }, 429);
        if (body.evento !== "boton_clic" && body.evento !== "simulador_abierto") return apiJson({ ok: false }, 422);
        const ok = await recordChatEvent(body.turnGrant, body.evento, body.accion);
        return apiJson({ ok }, ok ? 200 : 403);
    } catch (error) {
        return requestError(error);
    }
}
