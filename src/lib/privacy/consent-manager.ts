import type {
    ConsentCategories,
    ConsentCategoryId,
    ConsentEventDetail,
    ConsentRecord,
    ConsentSource,
} from "@/types/consent";

import { getPolicyVersion } from "./config";
import {
    clearConsent,
    needsConsent as storageNeedsConsent,
    readStoredConsent,
    writeConsent,
} from "./consent-storage";

export const CONSENT_CHANGE_EVENT = "rimcode:consent-change";
export const OPEN_SETTINGS_EVENT = "rimcode:open-cookie-settings";

let currentConsent: ConsentRecord | null = null;
let initialized = false;
const listeners = new Set<() => void>();

function notify() {
    listeners.forEach((listener) => listener());
}

function emitChange(record: ConsentRecord) {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
        new CustomEvent<ConsentEventDetail>(CONSENT_CHANGE_EVENT, {
            detail: { record },
        })
    );
}

function commit(
    categories: ConsentCategories,
    source: ConsentSource,
    previous: ConsentRecord | null
): ConsentRecord {
    const now = new Date().toISOString();
    const record: ConsentRecord = {
        version: getPolicyVersion(),
        updatedAt: now,
        consentedAt: previous?.consentedAt ?? now,
        source,
        categories: {
            necessary: true,
            preferences: Boolean(categories.preferences),
            analytics: Boolean(categories.analytics),
            marketing: Boolean(categories.marketing),
        },
    };

    currentConsent = record;
    writeConsent(record);
    notify();
    emitChange(record);

    return record;
}

/**
 * Lee el almacenamiento una sola vez por sesión de cliente.
 * Se llama desde un efecto para evitar diferencias de hidratación.
 */
export function initializeConsent(): void {
    if (initialized) return;
    initialized = true;

    currentConsent = readStoredConsent();
    notify();
}

export function getConsentSnapshot(): ConsentRecord | null {
    return currentConsent;
}

export function getServerConsentSnapshot(): null {
    return null;
}

export function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getConsentState(): ConsentRecord | null {
    return currentConsent;
}

export function hasConsent(category: ConsentCategoryId): boolean {
    if (category === "necessary") return true;
    return Boolean(currentConsent?.categories[category]);
}

export function acceptAll(): ConsentRecord {
    return commit(
        { necessary: true, preferences: true, analytics: true, marketing: true },
        "accept_all",
        currentConsent
    );
}

export function rejectOptional(): ConsentRecord {
    return commit(
        {
            necessary: true,
            preferences: false,
            analytics: false,
            marketing: false,
        },
        "reject_optional",
        currentConsent
    );
}

export function saveCustom(categories: Partial<ConsentCategories>): ConsentRecord {
    return commit(
        {
            necessary: true,
            preferences: Boolean(categories.preferences),
            analytics: Boolean(categories.analytics),
            marketing: Boolean(categories.marketing),
        },
        "custom",
        currentConsent
    );
}

export function revokeConsent(): ConsentRecord {
    return commit(
        {
            necessary: true,
            preferences: false,
            analytics: false,
            marketing: false,
        },
        "revoked",
        currentConsent
    );
}

export function resetConsent(): void {
    currentConsent = null;
    clearConsent();
    initialized = true;
    notify();
}

export function needsConsent(): boolean {
    return storageNeedsConsent(currentConsent);
}

export function openConsentSettings(): void {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT));
}

export function subscribeToConsent(listener: () => void): () => void {
    return subscribe(listener);
}

export const acceptAllConsent = acceptAll;
export const rejectOptionalConsent = rejectOptional;
export const saveCustomConsent = saveCustom;
