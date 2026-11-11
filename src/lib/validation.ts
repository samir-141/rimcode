const EMAIL_PATTERN =
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function isValidEmail(value: string): boolean {
    if (value.length > 254) return false;
    return EMAIL_PATTERN.test(value);
}

/** Elimina caracteres de control y normaliza espacios sin alterar el texto. */
export function cleanText(value: unknown, maxLength: number): string {
    if (typeof value !== "string") return "";

    return value
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
        .replace(/\r\n/g, "\n")
        .trim()
        .slice(0, maxLength);
}

export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
