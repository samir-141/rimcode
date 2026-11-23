"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import CookieBanner from "./CookieBanner";
import CookieSettings from "./CookieSettings";
import {
    acceptAllConsent,
    getConsentSnapshot,
    getServerConsentSnapshot,
    initializeConsent,
    needsConsent as checkNeedsConsent,
    OPEN_SETTINGS_EVENT,
    rejectOptionalConsent,
    saveCustomConsent,
    subscribeToConsent,
} from "@/lib/privacy/consent-manager";
import {
    disableGoogleAnalytics,
    enableGoogleAnalytics,
} from "@/lib/privacy/script-manager";
import type { ConsentCategories } from "@/types/consent";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

const noopSubscribe = () => () => {};
const getClientTrue = () => true;
const getServerFalse = () => false;

function getConsentClientSnapshot() {
    initializeConsent();
    return getConsentSnapshot();
}

export default function CookiePreferences() {
    const mounted = useSyncExternalStore(
        noopSubscribe,
        getClientTrue,
        getServerFalse
    );
    const consent = useSyncExternalStore(
        subscribeToConsent,
        getConsentClientSnapshot,
        getServerConsentSnapshot
    );
    const [settingsOpen, setSettingsOpen] = useState(false);

    useEffect(() => {
        const handleOpenSettings = () => {
            setSettingsOpen(true);
        };

        window.addEventListener(OPEN_SETTINGS_EVENT, handleOpenSettings);
        return () => {
            window.removeEventListener(OPEN_SETTINGS_EVENT, handleOpenSettings);
        };
    }, []);

    useEffect(() => {
        if (!mounted || !GA_MEASUREMENT_ID) return;

        if (consent?.categories.analytics) {
            enableGoogleAnalytics(GA_MEASUREMENT_ID);
        } else {
            disableGoogleAnalytics(GA_MEASUREMENT_ID);
        }
    }, [mounted, consent]);

    if (!mounted) return null;

    const bannerVisible = checkNeedsConsent();

    const handleAcceptAll = () => {
        acceptAllConsent();
        setSettingsOpen(false);
    };

    const handleRejectOptional = () => {
        rejectOptionalConsent();
        setSettingsOpen(false);
    };

    const handleSaveCustom = (categories: ConsentCategories) => {
        saveCustomConsent(categories);
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

            {settingsOpen && <CookieSettings
                initialRecord={consent}
                onClose={() => setSettingsOpen(false)}
                onSave={handleSaveCustom}
                onAcceptAll={handleAcceptAll}
                onRejectOptional={handleRejectOptional}
            />}
        </>
    );
}
