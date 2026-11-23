import { getProjectBySlug, getSettings } from "@/lib/db";
import type { Currency } from "@/lib/db/types";
import { calculateQuote, describeInfrastructure, formatQuoteAmount, landingSelection, readLandingScenario, type LandingScenario } from "@/lib/quote";
import { normalize, type LocalAnswer } from "./knowledge";

type Mode = LandingScenario["domain"];
export type ConversationContext =
    | ({ topic: "landing" } & LandingScenario)
    | { topic: "project"; slug: string };

type ConversationAnswer = LocalAnswer & { context: ConversationContext; action?: "quote" };

const landingReference = /\b(?:landing(?:s)?|(?:web|pagina) (?:sencilla|simple|de una (?:sola )?pagina))\b/;
const domainReference = /\b(?:dominio|dns|\.com|\.pe)\b/;
const hostingReference = /\b(?:hosting|hospedaje|alojamiento)\b/;
const publicationReference = /\b(?:public(?:ar|acion|ada|ado)|subir|ponerla en linea)\b/;
const priceReference = /\b(?:precio|cuesta|costo|total|cobra|presupuesto|cotizar|sale|cuanto|mensual|anual|por mes|al mes|por ano|al ano)\b/;
const otherService = /\b(?:erp|saas|ecommerce|tienda virtual|software a medida|web profesional)\b/;
const complete = /\b(?:con todo|todo incluido|los dos|ambos|completa)\b/;

export function readConversationContext(input: unknown): ConversationContext | undefined {
    if (!input || typeof input !== "object" || Array.isArray(input)) return;
    const value = input as Record<string, unknown>;
    if (value.topic === "project" && typeof value.slug === "string" && getProjectBySlug(value.slug)) {
        return { topic: "project", slug: value.slug };
    }
    const scenario = value.topic === "landing" ? readLandingScenario(value) : undefined;
    if (scenario) return { topic: "landing", ...scenario };
}

function readInfrastructure(message: string, target: "dominio" | "hosting", previous: Mode, addAll: boolean): Mode {
    const subject = target === "hosting" ? "(?:hosting|alojamiento|hospedaje)" : "dominio";
    if (new RegExp(`\\b(?:sin|no necesito|quita|excluye|no incluyas) (?:el |un )?${subject}\\b`).test(message)) return "none";
    if (new RegExp(`\\b(?:ya (?:tengo|cuento con)|tengo mi|tengo un|ya contrate|ya compre) .{0,30}?${subject}\\b`).test(message) ||
        new RegExp(`\\b${subject} (?:propio|comprado|contratado)\\b`).test(message)) return "owned";
    if (new RegExp(`\\b(?:con|incluye|incluir|agrega|sumale|necesito) (?:el |un )?${subject}\\b`).test(message)) return "include";
    return addAll && previous !== "owned" ? "include" : previous;
}

function replyLanding(message: string, currency: Currency, previous?: Extract<ConversationContext, { topic: "landing" }>): ConversationAnswer {
    const completePackage = complete.test(message);
    const includeAll = completePackage || (domainReference.test(message) && hostingReference.test(message) &&
        /\b(?:con|incluye|incluir|precio|cuanto|cuesta)\b/.test(message));
    const domain = readInfrastructure(message, "dominio", previous?.domain ?? "none", includeAll ||
        (hostingReference.test(message) && /\by dominio\b/.test(message) && /\bcon\s+(?:el\s+)?hosting\b/.test(message)));
    const hosting = readInfrastructure(message, "hosting", previous?.hosting ?? "none", includeAll ||
        (domainReference.test(message) && /\by hosting\b/.test(message) && /\bcon\s+(?:el\s+)?dominio\b/.test(message)));
    const publish = /\b(?:solo (?:el )?codigo|sin publicacion|no (?:la )?publiques)\b/.test(message) ? false :
        completePackage || publicationReference.test(message) || (previous?.publish ?? false);
    const context = { topic: "landing", domain, hosting, publish } as const;
    const rates = getSettings().currency.fallbackRates;
    const format = (amount: number) => formatQuoteAmount(amount, currency, rates);
    const estimate = calculateQuote(landingSelection(context), rates.PEN);
    const development = estimate.totalPEN === null ? "[COMPLETAR]" : format(estimate.totalPEN);
    const hasPrice = priceReference.test(message) || includeAll || publish || estimate.recurring.length > 0;
    let reply: string;

    if (/\b(?:mensual|por mes|al mes)\b/.test(message)) {
        const host = estimate.recurring.find(({ id }) => id === "hosting");
        reply = host ? `Hosting: ${describeInfrastructure(host, format)}. El desarrollo de la landing se paga una sola vez.` :
            "Con las opciones que elegiste no hay pagos mensuales. Puedes añadir hosting y editar el importe en el simulador.";
    } else if (hasPrice) {
        const lines = [
            publish ? `La landing con entrega del código y publicación se estima en ${development} como pago único.` :
                `La Landing Esencial parte de ${development} como pago único. Incluye una página adaptable a móviles, un botón de contacto y el código.`,
            ...estimate.recurring.map((line) => `${line.name}: ${describeInfrastructure(line, format)}.`),
        ];
        if (estimate.recurring.some((line) => line.mode === "include") && estimate.firstYearPEN !== null) {
            lines.push(`Con esos valores, el primer año se estima en ${format(estimate.firstYearPEN)}. Puedes editar el coste de tu proveedor en el simulador.`);
        } else if (domain === "owned" || hosting === "owned") {
            lines.push("Podemos aprovechar lo que ya contrataste. Para dejarla en línea, revisamos los accesos y la configuración.");
        } else {
            lines.push("Puedes añadir dominio, hosting o publicación en el simulador.");
        }
        reply = lines.join(" ");
    } else if (domainReference.test(message) || hostingReference.test(message)) {
        reply = "El dominio es la dirección que visita tu cliente. El hosting aloja la página. Si ya contrataste alguno, puedes marcarlo en el simulador y estimar únicamente lo que te falta.";
    } else {
        reply = `La Landing Esencial incluye ${estimate.service.description.toLowerCase()} El desarrollo parte de ${development}. ¿Ya tienes dominio o necesitas también publicarla?`;
    }

    return {
        reply,
        inScope: true,
        matched: ["intent:landing-config"],
        category: "comercial",
        context,
        action: "quote",
        suggestions: [
            domain === "owned" ? "¿Cuánto cuesta con hosting?" : "Ya tengo dominio",
            "¿Y con dominio y hosting?",
            "Solo quiero el código",
        ],
    };
}

export function answerConversation(question: string, currency: Currency, previous: ConversationContext | undefined, local: LocalAnswer,
    useLanding: boolean): ConversationAnswer | undefined {
    const message = normalize(question);
    const priorLanding = previous?.topic === "landing" ? previous : undefined;
    const explicitProject = local.matched.find((match) => match.startsWith("project:"));
    const project = explicitProject ? getProjectBySlug(explicitProject.slice(8)) :
        previous?.topic === "project" && !otherService.test(message) && !landingReference.test(message) &&
        /^(?:(?:y|que|cual|como|para|puedo|tiene)\s|tecnologias$|funciones$|demo$)/.test(message)
            ? getProjectBySlug(previous.slug) : undefined;
    if (project) {
        const context = { topic: "project", slug: project.slug } as const;
        const asksTech = /\b(?:tecnologias|stack|framework|lenguaje)\b/.test(message);
        const asksDemo = /\b(?:demo|demostracion|probar|enlace)\b/.test(message);
        const asksFeatures = /\b(?:funciones|funcionalidades|caracteristicas)\b/.test(message);
        if (asksTech || asksDemo || asksFeatures) {
            const reply = asksTech ? `${project.name} usa ${project.technologies.join(", ") || "las tecnologías documentadas en su ficha"}.` :
                asksDemo ? `La ficha de ${project.name} ${project.demo.enabled ? "incluye el enlace para abrir la demo" : "incluye los detalles disponibles del proyecto"}.` :
                    `En ${project.name} destacan estas funciones: ${project.features.slice(0, 3).join("; ") || project.shortDescription}.`;
            return { ...local, reply, table: undefined, inScope: true, matched: [`project:${project.slug}`], category: "proyectos", context,
                suggestions: ["¿Qué tecnologías usa?", "¿Tiene demo?", "¿Qué funciones incluye?"] };
        }
        if (explicitProject) return { ...local, context };
    }
    if (!useLanding) return;
    const infrastructure = domainReference.test(message) || hostingReference.test(message);
    const followup = priceReference.test(message) || infrastructure || publicationReference.test(message) ||
        complete.test(message) || /\b(?:incluye|solo (?:el )?codigo)\b/.test(message);
    if (landingReference.test(message) || (!otherService.test(message) && (infrastructure || (priorLanding && followup)))) {
        return replyLanding(message, currency, priorLanding);
    }
}
