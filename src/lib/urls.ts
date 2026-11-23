export function parseUrl(value: string): URL | null {
    try {
        return new URL(value);
    } catch {
        return null;
    }
}

export function safeExternalUrl(value: unknown): string {
    if (typeof value !== "string") return "";
    const url = parseUrl(value);
    return url?.protocol === "https:" && !url.username && !url.password ? url.href : "";
}
