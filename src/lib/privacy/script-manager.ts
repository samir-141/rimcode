import type { ConsentCategoryId } from "@/types/consent";

import {
    CONSENT_CHANGE_EVENT,
    hasConsent,
} from "./consent-manager";

export type ThirdPartyScript = {
    id: string;
    src: string;
    category: ConsentCategoryId;
    async?: boolean;
    defer?: boolean;
    attrs?: Record<string, string>;
};

const loadedScripts = new Map<string, HTMLScriptElement>();

export function loadScript(script: ThirdPartyScript): void {
    if (typeof document === "undefined") return;
    if (!hasConsent(script.category)) return;
    if (loadedScripts.has(script.id)) return;
    if (document.getElementById(script.id)) {
        return;
    }

    const element = document.createElement("script");
    element.id = script.id;
    element.src = script.src;
    element.async = script.async ?? true;
    element.defer = script.defer ?? false;

    for (const [key, value] of Object.entries(script.attrs ?? {})) {
        element.setAttribute(key, value);
    }

    document.head.appendChild(element);
    loadedScripts.set(script.id, element);
}

export function removeScript(id: string): void {
    loadedScripts.delete(id);
    document.getElementById(id)?.remove();
}

export function syncScripts(scripts: ThirdPartyScript[]): void {
    if (typeof window === "undefined") return;

    for (const script of scripts) {
        if (hasConsent(script.category)) {
            loadScript(script);
        } else {
            removeScript(script.id);
        }
    }
}

export function subscribeToConsentChanges(
    scripts: ThirdPartyScript[]
): () => void {
    if (typeof window === "undefined") return () => undefined;

    const handler = () => syncScripts(scripts);
    window.addEventListener(CONSENT_CHANGE_EVENT, handler);
    return () => {
        window.removeEventListener(CONSENT_CHANGE_EVENT, handler);
    };
}

export function isDoNotTrackEnabled(): boolean {
    if (typeof navigator === "undefined") return false;

    const nav = navigator as Navigator & {
        msDoNotTrack?: string;
    };

    return (
        nav.doNotTrack === "1" ||
        nav.doNotTrack === "yes" ||
        nav.msDoNotTrack === "1"
    );
}

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
    }
}

export function enableGoogleAnalytics(measurementId: string): void {
    if (typeof window === "undefined" || !measurementId) return;

    window.dataLayer = window.dataLayer ?? [];
    window.gtag =
        window.gtag ??
        ((...args: unknown[]) => {
            window.dataLayer?.push(args);
        });

    window.gtag("consent", "default", {
        ad_storage: "denied",
        analytics_storage: "granted",
        functionality_storage: "granted",
        personalization_storage: "denied",
        security_storage: "granted",
    });

    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
        anonymize_ip: true,
        send_page_view: true,
    });

    loadScript({
        id: "rimcode-ga",
        src: `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
            measurementId
        )}`,
        category: "analytics",
    });
}

export function disableGoogleAnalytics(): void {
    removeScript("rimcode-ga");

    if (typeof window !== "undefined") {
        window.dataLayer = [];
        delete window.gtag;
    }

    if (typeof document !== "undefined") {
        const cookies = ["_ga", "_gid", "_gat", "_gat_gtag_UA_*"];

        for (const cookie of cookies) {
            document.cookie = `${cookie}=; Path=/; Max-Age=0`;
        }
    }
}
