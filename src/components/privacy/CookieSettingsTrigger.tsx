"use client";

import { openConsentSettings } from "@/lib/privacy/consent-manager";

type CookieSettingsTriggerProps = {
    className?: string;
    children?: React.ReactNode;
};

export default function CookieSettingsTrigger({
    className = "text-[var(--header-muted)] hover:text-[var(--accent)] hover:underline cursor-pointer transition-colors",
    children = "Configurar cookies",
}: CookieSettingsTriggerProps) {
    return (
        <button
            type="button"
            onClick={openConsentSettings}
            className={className}
            aria-label="Abrir configuración de cookies y privacidad"
        >
            {children}
        </button>
    );
}

