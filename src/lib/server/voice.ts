import { createHmac, timingSafeEqual } from "node:crypto";
import { parseUrl } from "../urls";
import { getVisitorKey } from "./rate-limit";

import { maximumVoiceText } from "../rimy/voice-text";

export function voiceConfig() {
    if (process.env.RIMY_TTS_ENABLED !== "1") return null;
    const url = parseUrl(process.env.RIMY_TTS_URL?.trim() ?? "");
    const token = process.env.RIMY_TTS_TOKEN?.trim();
    const signingKey = process.env.RIMY_TTS_SIGNING_KEY?.trim();
    if (!url || url.username || url.password || !token || token.length < 24 ||
        !signingKey || signingKey.length < 32) return null;
    if (url.protocol !== "https:" &&
        !(url.protocol === "http:" && ["127.0.0.1", "[::1]", "localhost"].includes(url.hostname))) return null;
    return { url, token, signingKey };
}

const expiryMs = 30 * 60_000;

function signature(text: string, request: Request, expiry: number, key: string) {
    return createHmac("sha256", key)
        .update(JSON.stringify(["rimy-audio-v1", expiry, getVisitorKey(request), text]))
        .digest("base64url");
}

export function grantVoice(text: string, request: Request) {
    const config = voiceConfig();
    if (!config || !text || text.length > maximumVoiceText) return undefined;
    const expiry = Date.now() + expiryMs;
    return `${expiry}.${signature(text, request, expiry, config.signingKey)}`;
}

export function validVoiceGrant(text: string, grant: string, request: Request, key: string) {
    if (!/^\d{13}\.[\w-]{43}$/.test(grant)) return false;
    const [rawExpiry, provided] = grant.split(".");
    const expiry = Number(rawExpiry);
    if (expiry <= Date.now() || expiry > Date.now() + expiryMs) return false;
    return timingSafeEqual(Buffer.from(provided), Buffer.from(signature(text, request, expiry, key)));
}
