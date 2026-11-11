"use client";

import { useEffect, useState } from "react";
import CookieBanner from "./CookieBanner";
import CookieSettings from "./CookieSettings";
import {
    acceptAllConsent,
    getConsentSnapshot,
    initializeConsent,
    openConsentSettings,
    rejectOptionalConsent,
    saveCustomConsent,
    subscribeToConsent,
} from "@/lib/privacy/consent-manager";
import { needsConsent as checkNeedsConsent } from "@/lib/privacy/consent-manager";
import type { ConsentCategories, ConsentRecord } from "@/types/consent";

export default function CookiePreferences() {
    const [mounted, setMounted] = useState(false);
    const [bannerVisible, setBannerVisible] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [consent, setConsent] = useState<ConsentRecord | null>(null);

    useEffect(() => {
        initializeConsent();
        const current = getConsentSnapshot();
        setConsent(current);
        setBannerVisible(checkNeedsConsent());
        setMounted(true);

        const unsubscribe = subscribeToConsent(() => {
            const next = getConsentSnapshot();
            setConsent(next);
            setBannerVisible(checkNeedsConsent());
        });

        const handleOpenSettings = () => {
            setSettingsOpen(true);
        };

        window.addEventListener("rimcode:open-cookie-settings", handleOpenSettings);

        return () => {
            unsubscribe();
            window.removeEventListener("rimcode:open-cookie-settings", handleOpenSettings);
        };
    }, []);

    if (!mounted) return null;

    const handleAcceptAll = () => {
        acceptAllConsent();
        setBannerVisible(false);
        setSettingsOpen(false);
    };

    const handleRejectOptional = () => {
        rejectOptionalConsent();
        setBannerVisible(false);
        setSettingsOpen(false);
    };

    const handleSaveCustom = (categories: ConsentCategories) => {
        saveCustomConsent(categories);
        setBannerVisible(false);
        setSettingsOpen(false);
    };

    return (
        <>
            {bannerVisible && (
                <CookieBanner
                    onAcceptAll={handleAcceptAll}
                    onRejectOptional={handleRejectOptional}
                    onOpenSettings={() => setSettingsOpen(true)}
                />
            )}

            <CookieSettings
                open={settingsOpen}
                initialRecord={consent}
                onClose={() => setSettingsOpen(false)}
                onSave={handleSaveCustom}
                onAcceptAll={handleAcceptAll}
                onRejectOptional={handleRejectOptional}
            />
        </>
    );
}
