"use client";

import { useSyncExternalStore } from "react";

import { getCurrencyOptions, getSettings, isCurrency } from "@/lib/db";
import type { Currency } from "@/lib/db/types";

export type { Currency };

const settings = getSettings();
const CURRENCIES = getCurrencyOptions();
const STORAGE_KEY = settings.currency.storageKey;
const FALLBACK_RATES = settings.currency.fallbackRates;
const RATES_ENDPOINT = settings.currency.ratesEndpoint;
const REFRESH_MS = settings.currency.refreshMs;

export type CurrencySnapshot = {
    currency: Currency;
    rates: Record<Currency, number>;
    lastUpdate: string;
    loading: boolean;
    live: boolean;
};

let snapshot: CurrencySnapshot = {
    currency: settings.currency.default,
    rates: FALLBACK_RATES,
    lastUpdate: "",
    loading: true,
    live: false,
};

// Snapshot inmutable para SSR/hidratación. No debe mutar cuando llegan tasas
// en vivo, o el HTML del servidor y el primer render del cliente divergen.
const SERVER_SNAPSHOT: CurrencySnapshot = snapshot;

const listeners = new Set<() => void>();
let fetched = false;
let interval: ReturnType<typeof setInterval> | null = null;

function emit() {
    listeners.forEach((listener) => listener());
}

function readSavedCurrency(): Currency {
    if (typeof window === "undefined") return settings.currency.default;

    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved && isCurrency(saved) ? saved : settings.currency.default;
    } catch {
        return settings.currency.default;
    }
}

function hydrateCurrency() {
    const currency = readSavedCurrency();
    if (currency !== snapshot.currency) {
        snapshot = { ...snapshot, currency };
        emit();
    }
}

async function fetchRates() {
    try {
        const response = await fetch(RATES_ENDPOINT, { cache: "no-store" });
        if (!response.ok) throw new Error("No se pudieron obtener las monedas.");

        const data: unknown = await response.json();
        if (
            typeof data !== "object" ||
            data === null ||
            (data as { result?: string }).result !== "success"
        ) {
            throw new Error("Respuesta de moneda no válida.");
        }

        const rawRates = (data as { rates?: Record<string, number> }).rates;
        if (!rawRates) throw new Error("La respuesta no contiene tasas.");

        const rates = { ...FALLBACK_RATES };
        for (const currency of CURRENCIES) {
            const rate = rawRates[currency];
            if (currency === "USD") {
                rates.USD = 1;
            } else if (Number.isFinite(rate) && rate > 0) {
                rates[currency] = rate;
            }
        }

        const updated =
            typeof (data as { time_last_update_utc?: string })
                .time_last_update_utc === "string"
                ? new Date(
                      (data as { time_last_update_utc: string })
                          .time_last_update_utc
                  ).toLocaleTimeString("es-PE", {
                      hour: "2-digit",
                      minute: "2-digit",
                  })
                : "";

        snapshot = {
            ...snapshot,
            rates,
            lastUpdate: updated,
            loading: false,
            live: true,
        };
        emit();
    } catch {
        snapshot = { ...snapshot, loading: false, live: false };
        emit();
    }
}

/**
 * Carga las tasas una sola vez por sesión de página. La usan el header y el
 * simulador para que ambos muestren exactamente la misma conversión.
 */
export function ensureCurrencyStore() {
    if (typeof window === "undefined" || fetched) return;

    fetched = true;
    hydrateCurrency();
    void fetchRates();

    interval = setInterval(() => {
        void fetchRates();
    }, REFRESH_MS);
}

export function setAppCurrency(next: Currency) {
    if (!isCurrency(next)) return;

    snapshot = { ...snapshot, currency: next };
    try {
        localStorage.setItem(STORAGE_KEY, next);
    } catch {
        // Sin persistencia: la selección dura la sesión actual.
    }

    emit();

    window.dispatchEvent(
        new CustomEvent("rimcode:currency-change", {
            detail: { currency: next, rate: snapshot.rates[next] ?? 1 },
        })
    );
}

function subscribe(listener: () => void) {
    ensureCurrencyStore();
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && interval) {
            clearInterval(interval);
            interval = null;
            fetched = false;
        }
    };
}

function getSnapshot() {
    return snapshot;
}

function getServerSnapshot() {
    return SERVER_SNAPSHOT;
}

export function useCurrency() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function getCurrencySymbol(currency: Currency): string {
    if (currency === "PEN") return "S/.";
    if (currency === "EUR") return "€";
    return "$";
}

export { CURRENCIES };
