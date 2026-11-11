import type { ConsentCategoryId } from "@/types/consent";

import categoriesJson from "../../../db/privacy/cookie-categories.json";
import registryJson from "../../../db/privacy/cookie-registry.json";
import privacyConfigJson from "../../../db/privacy/privacy-config.json";

export type CookieCategory = {
    id: ConsentCategoryId;
    name: string;
    required: boolean;
    shortDescription: string;
    description: string;
    purposes: string[];
};

export type CookieRegistryEntry = {
    name: string;
    provider: string;
    category: ConsentCategoryId;
    type: string;
    duration: string;
    purpose: string;
    optional?: boolean;
    activation?: string;
};

export type FunctionalServiceEntry = {
    name: string;
    provider: string;
    category: ConsentCategoryId;
    purpose: string;
    cookies: string;
    activation: string;
};

export type PrivacyPolicyConfig = {
    version: string;
    lastUpdated: string;
    effectiveDate: string;
    consentRetentionDays: number;
    applicableLaw: string[];
    rights: string[];
    pendingValidation: string[];
};

const categoryIds: ConsentCategoryId[] = [
    "necessary",
    "preferences",
    "analytics",
    "marketing",
];

function isConsentCategoryId(value: string): value is ConsentCategoryId {
    return (categoryIds as string[]).includes(value);
}

function parseCategories(value: unknown): CookieCategory[] {
    if (!Array.isArray(value)) return [];

    return value
        .filter(
            (item): item is Record<string, unknown> =>
                typeof item === "object" && item !== null
        )
        .map((item) => ({
            id: isConsentCategoryId(String(item.id))
                ? (item.id as ConsentCategoryId)
                : "necessary",
            name: String(item.name ?? ""),
            required: Boolean(item.required),
            shortDescription: String(item.shortDescription ?? ""),
            description: String(item.description ?? ""),
            purposes: Array.isArray(item.purposes)
                ? item.purposes.filter(
                      (purpose): purpose is string =>
                          typeof purpose === "string"
                  )
                : [],
        }));
}

export const cookieCategories = parseCategories(
    categoriesJson.categories
) as CookieCategory[];

const registry = registryJson as {
    cookies: CookieRegistryEntry[];
    functionalServices: FunctionalServiceEntry[];
};

export const cookieRegistry = registry.cookies;
export const functionalServices = registry.functionalServices;

export const privacyPolicy = privacyConfigJson.policy as PrivacyPolicyConfig;

export const CONSENT_CATEGORY_IDS = categoryIds;

export function getCookieCategories(): CookieCategory[] {
    return cookieCategories;
}

export function getCookiesByCategory(
    id: ConsentCategoryId
): CookieRegistryEntry[] {
    return cookieRegistry.filter((cookie) => cookie.category === id);
}

export function getPolicyVersion(): string {
    return privacyPolicy.version;
}

export function getConsentRetentionMs(): number {
    return privacyPolicy.consentRetentionDays * 24 * 60 * 60 * 1000;
}
