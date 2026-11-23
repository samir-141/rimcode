"use client";

import { useEffect, useState } from "react";
import CardCarousel from "@/components/landing/navigation/CardCarousel";
import { useCurrency } from "@/lib/currency";
import { getServices } from "@/lib/db";
import { clearRimyGrant, readRimyGrant, sendRimyEvent, simulatorEvent } from "@/lib/rimy/client-events";
import {
    buildQuoteRequest, calculateQuote, defaultQuote, describeInfrastructure,
    formatQuoteAmount, infrastructureVariant, landingSelection, readLandingScenario, QUOTE_SCENARIO_KEY, QUOTE_STORAGE_KEY, servicePricePEN,
    type InfrastructureChoice,
} from "@/lib/quote";

const catalog = getServices();
const panel = "min-w-0 rounded-2xl border border-[var(--header-border)] bg-[var(--header-bg)] p-4 sm:p-5";
const field = "min-h-10 w-full rounded-lg border border-[var(--header-border)] bg-[var(--background)] px-2.5 text-sm text-[var(--header-text)]";

export default function SimulatorSection() {
    const { currency, rates } = useCurrency();
    const [selection, setSelection] = useState(defaultQuote);
    const estimate = calculateQuote(selection, rates.PEN);
    const format = (amount: number) => formatQuoteAmount(amount, currency, rates);
    const hasInfrastructure = estimate.recurring.some(({ mode }) => mode === "include");

    useEffect(() => {
        const applyScenario = (input: unknown) => {
            const scenario = readLandingScenario(input);
            if (!scenario) return;
            setSelection(landingSelection(scenario));
            try { sessionStorage.removeItem(QUOTE_SCENARIO_KEY); } catch { /* La estimación ya está cargada. */ }
        };

        const handleScenario = (event: Event) => applyScenario((event as CustomEvent<unknown>).detail);
        window.addEventListener(QUOTE_SCENARIO_KEY, handleScenario);
        const initial = window.setTimeout(() => {
            try {
                const saved = sessionStorage.getItem(QUOTE_SCENARIO_KEY);
                if (saved) applyScenario(JSON.parse(saved));
            } catch { /* El simulador también funciona sin almacenamiento. */ }
        }, 0);

        return () => {
            window.removeEventListener(QUOTE_SCENARIO_KEY, handleScenario);
            window.clearTimeout(initial);
        };
    }, []);

    useEffect(() => {
        const section = document.getElementById("simulador");
        if (!section) return;
        let grant: string | undefined;
        const observer = new IntersectionObserver(([entry]) => {
            if (!entry?.isIntersecting || !grant) return;
            sendRimyEvent(grant, "simulador_abierto");
            clearRimyGrant(simulatorEvent);
            grant = undefined;
            observer.disconnect();
        });
        const observe = (token: string | undefined) => {
            if (!token) return;
            grant = token;
            observer.disconnect();
            observer.observe(section);
        };
        const handle = (event: Event) => observe((event as CustomEvent<string>).detail);
        window.addEventListener(simulatorEvent, handle);
        observe(readRimyGrant(simulatorEvent));
        return () => {
            window.removeEventListener(simulatorEvent, handle);
            observer.disconnect();
        };
    }, []);

    function toggle(group: "modules" | "integrations", id: string) {
        setSelection((current) => ({
            ...current, [group]: current[group].includes(id) ? current[group].filter((item) => item !== id) : [...current[group], id],
        }));
    }

    function updateInfrastructure(id: string, update: Partial<InfrastructureChoice>) {
        setSelection((current) => ({
            ...current, infrastructure: {
                ...current.infrastructure, [id]: {
                    ...current.infrastructure[id], ...update,
                    mode: update.mode ?? current.infrastructure[id]?.mode ?? "none",
                },
            },
        }));
    }

    function transferToContact() {
        const quote = buildQuoteRequest(estimate, currency, rates);
        try {
            sessionStorage.setItem(QUOTE_STORAGE_KEY, JSON.stringify(quote));
        } catch {
            // El evento también entrega la cotización sin almacenamiento.
        }
        window.dispatchEvent(new CustomEvent("rimcode:quote", { detail: quote }));
        const name = document.getElementById("contact-name");
        if (name) {
            name.scrollIntoView({ block: "center" });
            name.focus({ preventScroll: true });
        } else {
            document.getElementById("contactanos")?.scrollIntoView({ block: "start" });
        }
    }

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl">Simulador de presupuesto</h2>
            <fieldset className="my-5 min-w-0">
                <legend className="mb-1 text-sm font-semibold">Selecciona una solución</legend>
                <CardCarousel id="solution-cards" label="Soluciones">
                    {catalog.services.map((service) => {
                        const base = servicePricePEN(service, rates.PEN);
                        return (
                            <label key={service.id} className="flex h-full cursor-pointer items-start gap-2 rounded-xl border border-[var(--header-border)] bg-[var(--header-bg)] p-3.5 has-checked:border-[var(--accent)]">
                                <input type="radio" name="solution" checked={selection.service === service.id}
                                    onChange={() => setSelection((current) => ({ ...current, service: service.id }))}
                                    className="mt-1 accent-[var(--accent)]" />
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold">{service.name}</span>
                                    <span className="mt-1 block text-xs leading-relaxed text-[var(--header-muted)]">{service.description}</span>
                                    <span className="mt-2 block text-xs font-semibold text-[var(--accent)]">{base === null ? "Sujeto a evaluación" : `Desde ${format(base)}`}</span>
                                </span>
                            </label>
                        );
                    })}
                </CardCarousel>
            </fieldset>
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                <div className={`${panel} space-y-4`}>
                    <fieldset className="min-w-0">
                        <legend className="text-base font-semibold">Dominio, hosting y mantenimiento</legend>
                        <p className="mb-2 mt-1 text-xs text-[var(--header-muted)]">Indica qué tienes o añade un presupuesto editable en soles. Los importes orientan sobre lo que pagarías a tu proveedor.</p>
                        <div className="divide-y divide-[var(--header-border)]">
                            {catalog.infrastructure.map((item) => {
                                const choice = selection.infrastructure[item.id];
                                const variant = infrastructureVariant(item, choice);
                                return (
                                    <div key={item.id} className="grid items-start gap-2 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                        <label className="grid gap-1 text-sm font-medium">
                                            {item.name}
                                            <select className={field} aria-label={item.name} value={choice?.mode ?? "none"}
                                                onChange={(event) => updateInfrastructure(item.id, { mode: event.target.value as InfrastructureChoice["mode"] })}>
                                                <option value="none">No añadir</option>
                                                <option value="owned">Ya lo tengo</option>
                                                <option value="include">Incluir en estimación</option>
                                            </select>
                                        </label>
                                        {choice?.mode === "include" && (
                                            <div className="grid min-w-0 gap-2">
                                                {item.variants.length > 1 && (
                                                    <label className="grid gap-1 text-xs">
                                                        Extensión
                                                        <select className={field} value={variant.id}
                                                            onChange={(event) => updateInfrastructure(item.id, { variant: event.target.value, amount: undefined })}>
                                                            {item.variants.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
                                                        </select>
                                                    </label>
                                                )}
                                                <label className="grid gap-1 text-xs">
                                                    Presupuesto de {item.name.toLowerCase()} en S/ por {item.period}
                                                    <input type="number" min={0} max={100000} step={0.01} inputMode="decimal" className={field}
                                                        value={choice.amount ?? variant.amountPEN}
                                                        onChange={(event) => updateInfrastructure(item.id, { amount: event.target.value })} />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </fieldset>

                    <div className="grid gap-3 border-t border-[var(--header-border)] pt-3 sm:grid-cols-2">
                        <label className="grid gap-1 text-sm font-semibold">
                            Complejidad
                            <select className={field} value={selection.complexity}
                                onChange={(event) => setSelection((current) => ({ ...current, complexity: event.target.value }))}>
                                {catalog.complexities.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                            </select>
                        </label>
                        <label className="grid gap-1 text-sm font-semibold">
                            Modalidad de entrega
                            <select className={field} value={selection.delivery}
                                onChange={(event) => setSelection((current) => ({ ...current, delivery: event.target.value }))}>
                                {catalog.delivery.map(({ id, name }) => <option key={id} value={id}>{name}</option>)}
                            </select>
                        </label>
                    </div>

                    <details className="border-t border-[var(--header-border)] pt-3">
                        <summary className="cursor-pointer text-sm font-semibold">Módulos e integraciones</summary>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            {(["modules", "integrations"] as const).map((group) => (
                                <fieldset key={group}>
                                    <legend className="text-sm font-semibold">{group === "modules" ? "Módulos" : "Integraciones"}</legend>
                                    {catalog[group].map(({ id, name }) => (
                                        <label key={id} className="flex min-h-9 cursor-pointer items-center gap-2 text-sm text-[var(--header-muted)]">
                                            <input type="checkbox" className="accent-[var(--accent)]" checked={selection[group].includes(id)}
                                                onChange={() => toggle(group, id)} />
                                            {name}
                                        </label>
                                    ))}
                                </fieldset>
                            ))}
                        </div>
                    </details>
                </div>
                <div className={`${panel} space-y-4`}>
                    <div aria-live="polite">
                        <h3 className="text-base font-semibold">Desglose en {currency}</h3>
                        <dl className="mt-3 space-y-2 text-sm">
                            <div className="flex justify-between gap-2">
                                <dt>Desarrollo · pago único</dt>
                                <dd className="text-right font-semibold text-[var(--accent)]">{estimate.totalPEN === null ? "Desarrollo sujeto a evaluación" : format(estimate.totalPEN)}</dd>
                            </div>
                            {estimate.development.length > 1 && estimate.development.map(({ id, name, pricePEN }) => (
                                <div key={id} className="flex justify-between gap-2 text-[var(--header-muted)]">
                                    <dt>{name}</dt><dd>{pricePEN === null ? "Por cotizar" : format(pricePEN)}</dd>
                                </div>
                            ))}
                            {estimate.adjustmentPEN !== null && estimate.adjustmentPEN !== 0 && (
                                <div className="flex justify-between gap-2 text-[var(--header-muted)]">
                                    <dt>Ajuste de entrega</dt><dd>{format(estimate.adjustmentPEN)}</dd>
                                </div>
                            )}
                        </dl>
                        <h4 className="mt-4 border-t border-[var(--header-border)] pt-3 text-sm font-semibold">Servicios recurrentes</h4>
                        {estimate.recurring.length ? (
                            <dl className="mt-2 space-y-1 text-sm text-[var(--header-muted)]">
                                {estimate.recurring.map((line) => (
                                    <div key={line.id} className="flex flex-wrap justify-between gap-1.5"><dt>{line.name}</dt>
                                        <dd>{describeInfrastructure(line, format)}</dd></div>
                                ))}
                            </dl>
                        ) : <p className="mt-1 text-sm text-[var(--header-muted)]">Dominio, hosting y mantenimiento sin añadir.</p>}
                        {hasInfrastructure && (
                            <dl className="mt-3 space-y-1 border-t border-[var(--header-border)] pt-3 text-sm">
                                <div className="flex justify-between gap-2"><dt>Pagos mensuales</dt>
                                    <dd>{estimate.monthlyPEN === null ? "Por cotizar" : format(estimate.monthlyPEN)}</dd></div>
                                <div className="flex justify-between gap-2"><dt>Pagos anuales</dt>
                                    <dd>{estimate.annualPEN === null ? "Por cotizar" : format(estimate.annualPEN)}</dd></div>
                                <div className="flex justify-between gap-2 font-bold"><dt>Total del primer año</dt>
                                    <dd>{estimate.firstYearPEN === null ? "Por confirmar" : format(estimate.firstYearPEN)}</dd></div>
                            </dl>
                        )}
                    </div>
                    <p className="text-xs leading-relaxed text-[var(--header-muted)]">{catalog.disclaimer}</p>
                    <button type="button" onClick={transferToContact}
                        className="min-h-11 w-full rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-ink)] hover:opacity-90">
                        Preparar solicitud de cotización
                    </button>
                </div>
            </div>
        </div>
    );
}
