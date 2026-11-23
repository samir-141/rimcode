export function apiJson(body: unknown, status = 200, headers?: HeadersInit) {
    const responseHeaders = new Headers(headers);
    responseHeaders.set("Cache-Control", "no-store");
    return Response.json(body, { status, headers: responseHeaders });
}

export class RequestError extends Error {
    constructor(public status: number, message: string) {
        super(message);
    }
}

export function requestError(error: unknown) {
    if (!(error instanceof RequestError)) throw error;
    return apiJson({ ok: false, error: error.message }, error.status);
}

export async function readJsonObject(request: Request, maxBytes: number): Promise<Record<string, unknown>> {
    const origin = request.headers.get("origin");
    const fetchSite = request.headers.get("sec-fetch-site");
    const target = new URL(request.url);
    const browserOrigin = origin && parseUrl(origin);
    const sameHost = browserOrigin && browserOrigin.host === request.headers.get("host") &&
        browserOrigin.protocol === target.protocol;
    if ((fetchSite && !["same-origin", "none"].includes(fetchSite)) ||
        (origin && !sameHost && origin !== target.origin &&
            origin !== parseUrl(process.env.NEXT_PUBLIC_APP_URL ?? "")?.origin)) {
        throw new RequestError(403, "Origen de la solicitud no permitido.");
    }

    const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
    if (contentType !== "application/json") {
        throw new RequestError(415, "Envía la solicitud como JSON.");
    }

    if (Number(request.headers.get("content-length")) > maxBytes) {
        throw new RequestError(413, "La solicitud es demasiado grande.");
    }

    const reader = request.body?.getReader();
    if (!reader) throw new RequestError(400, "Falta el cuerpo de la solicitud.");
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let bytes = 0;
    let body = "";
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > maxBytes) {
                void reader.cancel().catch(() => {});
                throw new RequestError(413, "La solicitud es demasiado grande.");
            }
            body += decoder.decode(value, { stream: true });
        }
        const data: unknown = JSON.parse(body + decoder.decode());
        if (typeof data !== "object" || data === null || Array.isArray(data)) {
            throw new RequestError(400, "La solicitud debe contener un objeto JSON.");
        }
        return data as Record<string, unknown>;
    } catch (error) {
        if (error instanceof RequestError) throw error;
        throw new RequestError(400, "El cuerpo de la solicitud no es JSON válido.");
    } finally {
        reader.releaseLock();
    }
}
import { parseUrl } from "../urls";

