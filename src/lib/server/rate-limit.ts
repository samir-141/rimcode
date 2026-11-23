import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { parseUrl } from "../urls";

type Bucket = { count: number; resetAt: number };
type RateDecision = { allowed: boolean; retryAfterSeconds: number; unavailable?: boolean };
const buckets = new Map<string, Bucket>();
const maximumBuckets = 10_000;
let nextPrune = 0;

function rateLimit(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    if (now >= nextPrune) {
        for (const [id, bucket] of buckets) {
            if (bucket.resetAt <= now) buckets.delete(id);
        }
        nextPrune = now + 15_000;
    }

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
        if (!bucket && buckets.size >= maximumBuckets) {
            return { allowed: false, retryAfterSeconds: 15 };
        }
        bucket = { count: 0, resetAt: now + windowMs };
        buckets.set(key, bucket);
    }

    bucket.count += 1;
    return {
        allowed: bucket.count <= limit,
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
}

export function getVisitorKey(request: Request): string {
    const header = process.env.RIMCODE_TRUSTED_IP_HEADER?.trim();
    const address = header && /^[\w-]+$/.test(header) && request.headers.get(header)?.trim();
    return address && isIP(address) ? createHash("sha256").update(address).digest("hex") : "shared";
}

export function limitLocalRequest(request: Request, scope: string, limit: number, windowMs: number) {
    const visitor = getVisitorKey(request);
    return rateLimit(`rimcode:rate:${scope}:${visitor}`, visitor === "shared" ? limit * 10 : limit, windowMs);
}

const increment = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then redis.call("PEXPIRE", KEYS[1], ARGV[1]) end
return { count, redis.call("PTTL", KEYS[1]) }
`;

export async function limitRequest(
    request: Request,
    scope: string,
    limit: number,
    windowMs: number,
    sharedLimit = limit * 10
): Promise<RateDecision> {
    const visitor = getVisitorKey(request);
    const allowedCount = visitor === "shared" ? sharedLimit : limit;
    const key = `rimcode:rate:${scope}:${visitor}`;
    const endpoint = process.env.RIMCODE_REDIS_REST_URL?.trim();
    const token = process.env.RIMCODE_REDIS_REST_TOKEN?.trim();
    if (!endpoint && !token) return rateLimit(key, allowedCount, windowMs);

    try {
        if (!endpoint || !token || parseUrl(endpoint)?.protocol !== "https:") throw new Error();
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify(["EVAL", increment, "1", key, String(windowMs)]),
            redirect: "error",
            cache: "no-store",
            signal: AbortSignal.timeout(1500),
        });
        if (!response.ok) throw new Error();
        const { result } = await response.json();
        if (!Array.isArray(result) || result.length !== 2 ||
            !result.every((value: unknown) => Number.isSafeInteger(value))) throw new Error();
        return { allowed: result[0] <= allowedCount, retryAfterSeconds: Math.max(1, Math.ceil(result[1] / 1000)) };
    } catch {
        return { allowed: false, retryAfterSeconds: 5, unavailable: true };
    }
}
