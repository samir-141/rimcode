import { getServices } from "@/lib/db";
import type { Currency, Service } from "@/lib/db/types";

const catalog = getServices();
type Rates = Record<Currency, number>;
export const QUOTE_STORAGE_KEY = "rimcode:quote";
export const QUOTE_SCENARIO_KEY = "rimcode:quote-scenario";

export type InfrastructureChoice = {
    mode: "none" | "owned" | "include";
    variant?: string;
    amount?: string;
};

export type QuoteSelection = {
    service: string;
    modules: string[];
    integrations: string[];
    complexity: string;
    delivery: string;
    infrastructure: Record<string, InfrastructureChoice>;
};

export const defaultQuote: QuoteSelection = {
    service: catalog.services[0].id,
    modules: [],
    integrations: [],
    complexity: catalog.complexities[0].id,
    delivery: catalog.delivery[0].id,
    infrastructure: {},
};

export type LandingScenario = {
    domain: InfrastructureChoice["mode"];
    hosting: InfrastructureChoice["mode"];
    publish: boolean;
};

const modes = new Set<unknown>(["none", "owned", "include"]);

export function readLandingScenario(input: unknown): LandingScenario | undefined {
    if (!input || typeof input !== "object") return;
    const value = input as Record<string, unknown>;
    if (!modes.has(value.domain) || !modes.has(value.hosting) || typeof value.publish !== "boolean") return;
    return { domain: value.domain as LandingScenario["domain"], hosting: value.hosting as LandingScenario["hosting"], publish: value.publish };
}

export function landingSelection({ domain, hosting, publish }: LandingScenario): QuoteSelection {
    return {
        ...defaultQuote, service: "landing", delivery: publish ? "publish" : "code",
        infrastructure: { domain: { mode: domain }, hosting: { mode: hosting } },
    };
}

const cents = (amount: number) => Math.round(amount * 100) / 100;

export function servicePricePEN(service: Service, penPerUSD: number) {
    return service.basePricePEN ?? (service.basePriceUSD === null ? null : cents(service.basePriceUSD * penPerUSD));
}

export function infrastructureVariant(service: (typeof catalog.infrastructure)[number], choice?: InfrastructureChoice) {
    return service.variants.find(({ id }) => id === choice?.variant) ?? service.variants[0];
}

export function calculateQuote(selection: QuoteSelection, penPerUSD: number) {
    const service = catalog.services.find(({ id }) => id === selection.service) ?? catalog.services[0];
    const complexity = catalog.complexities.find(({ id }) => id === selection.complexity) ?? catalog.complexities[0];
    const delivery = catalog.delivery.find(({ id }) => id === selection.delivery) ?? catalog.delivery[0];
    const modules = catalog.modules.filter(({ id }) => selection.modules.includes(id));
    const integrations = catalog.integrations.filter(({ id }) => selection.integrations.includes(id));
    const recurring = catalog.infrastructure.flatMap((item) => {
        const choice = selection.infrastructure[item.id];
        if (!choice || choice.mode === "none") return [];
        const variant = infrastructureVariant(item, choice);
        const amount = choice.amount === undefined ? variant.amountPEN : choice.amount.trim() ? Number(choice.amount) : NaN;
        const pricePEN = choice.mode === "owned" ? 0 : Number.isFinite(amount) && amount >= 0 && amount <= 100_000 ? cents(amount) : null;
        return [{ id: item.id, name: choice.mode === "owned" ? item.name : variant.name ?? item.name, period: item.period, mode: choice.mode, pricePEN }];
    });

    const base = servicePricePEN(service, penPerUSD);
    const development = [
        { id: service.id, name: service.name, pricePEN: base },
        ...[...modules, ...integrations].map(({ id, name, priceUSD }) => ({
            id, name, pricePEN: priceUSD === null ? null : cents(priceUSD * penPerUSD),
        })),
    ];
    const subtotal = development.reduce((sum, item) => sum + (item.pricePEN ?? 0), 0);
    const publication = delivery.id === "publish" ? service.publicationPEN ?? null : 0;
    const requiresReview = complexity.multiplier === null || delivery.multiplier === null || publication === null ||
        development.some(({ pricePEN }) => pricePEN === null);
    const totalPEN = requiresReview ? null : cents(subtotal * (complexity.multiplier ?? 1) * (delivery.multiplier ?? 1) + publication);
    const adjustmentPEN = totalPEN === null ? null : cents(totalPEN - subtotal);

    const monthlyPEN = recurring.some((line) => line.period === "mes" && line.pricePEN === null) ? null :
        cents(recurring.filter((line) => line.period === "mes").reduce((sum, line) => sum + (line.pricePEN ?? 0), 0));
    const annualPEN = recurring.some((line) => line.period === "año" && line.pricePEN === null) ? null :
        cents(recurring.filter((line) => line.period === "año").reduce((sum, line) => sum + (line.pricePEN ?? 0), 0));
    const firstYearPEN = totalPEN === null || monthlyPEN === null || annualPEN === null ? null :
        cents(totalPEN + monthlyPEN * 12 + annualPEN);

    return { service, modules, integrations, development, complexity, delivery, recurring, totalPEN, adjustmentPEN, monthlyPEN, annualPEN, firstYearPEN };
}

export function formatQuoteAmount(pen: number, currency: Currency, rates: Rates) {
    return new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(pen * rates[currency] / rates.PEN);
}

export function describeInfrastructure(line: ReturnType<typeof calculateQuote>["recurring"][number], format: (amount: number) => string) {
    if (line.mode === "owned") return "Ya contratado";
    return line.pricePEN === null ? "Por cotizar" : `${format(line.pricePEN)}/${line.period}`;
}

export function buildQuoteRequest(estimate: ReturnType<typeof calculateQuote>, currency: Currency, rates: Rates) {
    const { service, modules, integrations, complexity, delivery, recurring, totalPEN, firstYearPEN } = estimate;
    const format = (amount: number) => formatQuoteAmount(amount, currency, rates);
    return {
        projectType: service.name,
        projectTypeId: service.id,
        service: service.name,
        message: [
            `Hola RimCode, quiero cotizar ${service.name}.`,
            `Complejidad: ${complexity.name}. Entrega: ${delivery.name}.`,
            `Módulos: ${modules.map(({ name }) => name).join(", ") || "Por definir"}.`,
            `Integraciones: ${integrations.map(({ name }) => name).join(", ") || "Por definir"}.`,
            `Infraestructura: ${recurring.map((line) => `${line.name} (${describeInfrastructure(line, format)})`).join(", ") || "Sin gastos recurrentes añadidos"}.`,
            totalPEN === null ? "Desarrollo sujeto a evaluación." : `Referencia de desarrollo: ${format(totalPEN)} (${currency}).`,
            recurring.length && firstYearPEN !== null ? `Total estimado del primer año: ${format(firstYearPEN)}.` : "",
        ].filter(Boolean).join("\n"),
    };
}
