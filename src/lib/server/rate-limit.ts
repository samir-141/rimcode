type Bucket = {
    count: number;
    resetAt: number;
};

const buckets = new Map<string, Bucket>();

/**
 * Limitador en memoria por instancia del servidor.
 *
 * Es suficiente para una landing de un solo proceso. En despliegues
 * serverless con varias instancias se debe sustituir por un almacén
 * compartido (Redis/Upstash); queda documentado en docs/ENVIRONMENT.md.
 */
export function rateLimit(
    key: string,
    limit: number,
    windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return {
            allowed: true,
            remaining: Math.max(0, limit - 1),
            retryAfterSeconds: Math.ceil(windowMs / 1000),
        };
    }

    bucket.count += 1;

    if (bucket.count > limit) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: Math.max(
                1,
                Math.ceil((bucket.resetAt - now) / 1000)
            ),
        };
    }

    return {
        allowed: true,
        remaining: Math.max(0, limit - bucket.count),
        retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
}

export function getClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0]?.trim() || "unknown";
    }

    return (
        request.headers.get("x-real-ip")?.trim() ||
        request.headers.get("cf-connecting-ip")?.trim() ||
        "unknown"
    );
}

/** Limpieza oportunista para que el Map no crezca sin límite. */
export function pruneRateLimitBuckets() {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}
