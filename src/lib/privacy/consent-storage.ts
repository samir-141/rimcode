import type {
    ConsentCategoryId,
    ConsentRecord,
    ConsentSource,
} from "@/types/consent";

import {
    CONSENT_CATEGORY_IDS,
    getConsentRetentionMs,
    getPolicyVersion,
} from "./config";

export const CONSENT_STORAGE_KEY = "rimcode-consent";
export const CONSENT_COOKIE_NAME = "rimcode-consent";

const CONSENT_SOURCES: ConsentSource[] = [
    "accept_all",
    "reject_optional",
    "custom",
    "revoked",
];

function isConsentCategoryId(value: string): value is ConsentCategoryId {
    return (CONSENT_CATEGORY_IDS as string[]).includes(value);
}

function parseRecord(value: unknown): ConsentRecord | null {
    if (typeof value !== "object" || value === null) return null;

    const candidate = value as Record<string, unknown>;
    const categories = candidate.categories;

    if (
        typeof candidate.version !== "string" ||
        typeof candidate.updatedAt !== "string" ||
        typeof candidate.consentedAt !== "string" ||
        typeof candidate.source !== "string" ||
        !CONSENT_SOURCES.includes(candidate.source as ConsentSource) ||
        typeof categories !== "object" ||
        categories === null
    ) {
        return null;
    }

    const parsedCategories: Partial<Record<ConsentCategoryId, boolean>> = {};

    for (const id of CONSENT_CATEGORY_IDS) {
        const raw = (categories as Record<string, unknown>)[id];
        if (typeof raw !== "boolean") return null;
        parsedCategories[id] = raw;
    }

    // Las cookies necesarias no pueden desactivarse nunca.
    if (parsedCategories.necessary !== true) return null;

    return {
        version: candidate.version,
        updatedAt: candidate.updatedAt,
        consentedAt: candidate.consentedAt,
        source: candidate.source as ConsentSource,
        categories: parsedCategories as ConsentRecord["categories"],
    };
}

function readFromLocalStorage(): ConsentRecord | null {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
        if (!raw) return null;
        return parseRecord(JSON.parse(raw));
    } catch {
        return null;
    }
}

function readFromCookie(): ConsentRecord | null {
    if (typeof document === "undefined") return null;

    try {
        const match = document.cookie
            .split("; ")
            .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));

        if (!match) return null;

        const value = match.slice(CONSENT_COOKIE_NAME.length + 1);
        return parseRecord(JSON.parse(decodeURIComponent(value)));
    } catch {
        return null;
    }
}

export function readStoredConsent(): ConsentRecord | null {
    return readFromLocalStorage() ?? readFromCookie();
}

export function writeConsent(record: ConsentRecord): void {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.setItem(
            CONSENT_STORAGE_KEY,
            JSON.stringify(record)
        );
    } catch {
        // localStorage puede estar bloqueado; la cookie es el respaldo.
    }

    if (typeof document === "undefined") return;

    try {
        const value = encodeURIComponent(JSON.stringify(record));
        const secure =
            window.location.protocol === "https:" ? "; Secure" : "";
        const maxAge = Math.floor(getConsentRetentionMs() / 1000);

        document.cookie = `${CONSENT_COOKIE_NAME}=${value}; Path=/; SameSite=Lax${secure}; Max-Age=${maxAge}`;
    } catch {
        // Sin cookies ni localStorage no se puede persistir el consentimiento.
    }
}

export function clearConsent(): void {
    if (typeof window !== "undefined") {
        try {
            window.localStorage.removeItem(CONSENT_STORAGE_KEY);
        } catch {
            // Nada que limpiar.
        }
    }

    if (typeof document !== "undefined") {
        try {
            document.cookie = `${CONSENT_COOKIE_NAME}=; Path=/; SameSite=Lax; Max-Age=0`;
        } catch {
            // Nada que limpiar.
        }
    }
}

export function isConsentCurrent(record: ConsentRecord | null): boolean {
    if (!record) return false;
    if (record.version !== getPolicyVersion()) return false;

    const updatedAt = Date.parse(record.updatedAt);
    if (Number.isNaN(updatedAt)) return false;

    return Date.now() - updatedAt <= getConsentRetentionMs();
}

export function needsConsent(record: ConsentRecord | null): boolean {
    return !isConsentCurrent(record);
}
