import {
    getCompany,
    getContact,
    getFaq,
    getMethodology,
    getProjects,
    getRimy,
    getServices,
    getSettings,
    getTechnologies,
} from "@/lib/db";
import type { Currency, FaqItem, FaqTableType, Project } from "@/lib/db/types";

export type KnowledgeEntry = {
    id: string;
    title: string;
    text: string;
    keywords: string[];
    source: string;
};

export type AnswerTable = {
    headers: string[];
    rows: string[][];
};

export type LocalAnswer = {
    reply: string;
    table?: AnswerTable;
    suggestions: string[];
    matched: string[];
    category?: string;
    inScope: boolean;
};

const company = getCompany();
const contact = getContact();
const faq = getFaq();
const methodology = getMethodology();
const projects = getProjects();
const rimy = getRimy();
const services = getServices();
const settings = getSettings();
const technologies = getTechnologies();

const STOPWORDS = new Set([
    "que",
    "como",
    "cual",
    "cuales",
    "donde",
    "cuando",
    "porque",
    "para",
    "por",
    "con",
    "sin",
    "los",
    "las",
    "del",
    "una",
    "uno",
    "unos",
    "unas",
    "este",
    "esta",
    "esto",
    "estos",
    "estas",
    "sobre",
    "mas",
    "muy",
    "hay",
    "tiene",
    "tienen",
    "puedo",
    "pueden",
    "soy",
    "eres",
    "son",
    "me",
    "mi",
    "tu",
    "su",
    "sus",
    "el",
    "la",
    "de",
    "en",
    "al",
    "un",
    "se",
    "lo",
    "le",
    "les",
    "nos",
    "te",
    "ti",
    "yo",
    "ella",
    "ustedes",
    "tu",
    "tus",
    "su",
    "sus",
]);

const SYNONYM_GROUPS: string[][] = [
    ["servicios", "servicio", "hacen", "dedican", "ofrecen", "ofrece", "brindan", "soluciones", "desarrollan", "crean"],
    ["erp", "gestion", "inventario", "pos", "kardex", "botica", "farmacia", "almacen", "facturacion", "ventas"],
    ["tienda", "tiendas", "virtual", "virtuales", "ecommerce", "comercio", "carrito", "checkout", "catalogo"],
    ["proyectos", "proyecto", "portafolio", "casos", "ejemplos", "experiencia", "trabajos", "desarrollado"],
    ["tecnologias", "tecnologia", "stack", "lenguaje", "lenguajes", "framework", "frameworks", "herramientas"],
    ["metodologia", "trabajan", "trabajas", "proceso", "fases", "etapas", "sprints", "forma"],
    ["cuesta", "costo", "costos", "precio", "precios", "cotizar", "cotizacion", "presupuesto", "inversion", "tarifa", "vale", "cuanto"],
    ["tarda", "tiempo", "plazo", "semanas", "demora", "duracion", "entrega", "cuando"],
    ["contratar", "contacto", "contactar", "contactarlos", "whatsapp", "correo", "email", "hablar", "escribir", "reunion", "telefono"],
    ["demo", "demostracion", "demostraciones", "probar", "prueba", "muestra", "vivo", "ver"],
    ["codigo", "propiedad", "fuente", "repositorio", "garantia"],
    ["fundador", "creador", "samir", "jhoner", "gomez", "alarcon", "arquitecto"],
];

const SYNONYM_LOOKUP = new Map<string, Set<string>>();
for (const group of SYNONYM_GROUPS) {
    const groupSet = new Set(group);
    for (const word of group) {
        SYNONYM_LOOKUP.set(word, groupSet);
    }
}

export function normalize(value: string): string {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s@._/-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function tokenize(value: string): string[] {
    return normalize(value)
        .split(" ")
        .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function expandTokens(tokens: string[]): Set<string> {
    const expanded = new Set<string>(tokens);
    for (const token of tokens) {
        const group = SYNONYM_LOOKUP.get(token);
        if (group) {
            for (const syn of group) {
                expanded.add(syn);
            }
        }
    }
    return expanded;
}

const STATUS_LABELS: Record<Project["status"], string> = {
    production: "En Producción",
    development: "Implementación Activa",
    prototype: "Fase Final",
    archived: "Histórico",
};

function buildTable(tableType: FaqTableType | undefined, currency: Currency): AnswerTable | undefined {
    if (!tableType) return undefined;

    if (tableType === "services") {
        return {
            headers: ["Servicio", "Descripción", "Base (USD)"],
            rows: services.services.map((srv) => [
                srv.name,
                srv.description,
                srv.basePriceUSD > 0 ? `Desde $${srv.basePriceUSD}` : "A medida",
            ]),
        };
    }

    if (tableType === "pricing") {
        const rate = settings.currency.fallbackRates[currency] ?? 1;
        const symbol = currency === "PEN" ? "S/" : currency === "EUR" ? "€" : "$";
        return {
            headers: ["Solución", `Referencia (${currency})`, "Base USD"],
            rows: services.services
                .filter((srv) => srv.basePriceUSD > 0)
                .map((srv) => [
                    srv.name,
                    `Desde ${symbol} ${Math.round(srv.basePriceUSD * rate).toLocaleString("es-PE")}`,
                    `$${srv.basePriceUSD} USD`,
                ]),
        };
    }

    if (tableType === "projects") {
        return {
            headers: ["Proyecto", "Categoría", "Estado"],
            rows: projects.map((proj) => [
                proj.name,
                proj.category,
                STATUS_LABELS[proj.status],
            ]),
        };
    }

    if (tableType === "technologies") {
        const catMap = new Map(
            technologies.categories.map((cat) => [cat.id, cat.label])
        );
        const grouped = new Map<string, string[]>();
        for (const item of technologies.items) {
            const label = catMap.get(item.category) ?? item.category;
            const list = grouped.get(label) ?? [];
            list.push(item.name);
            grouped.set(label, list);
        }
        return {
            headers: ["Área", "Tecnologías"],
            rows: Array.from(grouped.entries()).map(([area, list]) => [
                area,
                list.join(", "),
            ]),
        };
    }

    if (tableType === "methodology") {
        return {
            headers: ["Fase", "Etapa", "Entregable"],
            rows: methodology.steps.map((step) => [
                step.num,
                step.title,
                step.deliverable,
            ]),
        };
    }

    if (tableType === "contact") {
        const rows: string[][] = [["Correo", contact.email]];
        if (contact.whatsapp.enabled && contact.whatsapp.number) {
            rows.push(["WhatsApp", `+${contact.whatsapp.number}`]);
        }
        if (contact.phone) {
            rows.push(["Teléfono", contact.phone]);
        }
        rows.push(["Tiempo de respuesta", contact.responseTime]);
        return {
            headers: ["Canal", "Detalle"],
            rows,
        };
    }

    return undefined;
}

function scoreFaqItem(item: FaqItem, normalizedMsg: string, rawTokens: string[], expandedTokens: Set<string>): number {
    const normQuestion = normalize(item.question);
    if (normalizedMsg === normQuestion) return 100;

    const normVariations = (item.variations ?? []).map(normalize);
    if (normVariations.includes(normalizedMsg)) return 95;

    let score = 0;

    if (normalizedMsg.length >= 6 && normQuestion.includes(normalizedMsg)) {
        score += 24;
    }
    for (const variation of normVariations) {
        if (normalizedMsg.includes(variation) || (normalizedMsg.length >= 6 && variation.includes(normalizedMsg))) {
            score += 26;
        }
    }

    const questionTokens = new Set([
        ...tokenize(item.question),
        ...(item.variations ?? []).flatMap(tokenize),
    ]);

    for (const token of rawTokens) {
        if (questionTokens.has(token)) score += 7;
    }

    for (const kw of item.keywords) {
        const normKw = normalize(kw);
        if (!normKw) continue;
        if (normKw.includes(" ")) {
            if (normalizedMsg.includes(normKw)) score += 16;
        } else if (rawTokens.includes(normKw)) {
            score += 9;
        } else if (expandedTokens.has(normKw)) {
            score += 5;
        }
    }

    return score;
}

function matchSpecificProject(normalizedMsg: string, rawTokens: string[]): Project | null {
    let best: { project: Project; score: number } | null = null;

    for (const project of projects) {
        const normName = normalize(project.name);
        const normSlug = normalize(project.slug.replace(/-/g, " "));
        let score = 0;

        if (normalizedMsg.includes(normName) || normalizedMsg.includes(normSlug)) {
            score += 40;
        }

        const nameTokens = tokenize(project.name);
        for (const token of rawTokens) {
            if (token.length >= 4 && nameTokens.includes(token)) {
                score += 14;
            }
        }

        if (project.slug === "angibotica" && normalizedMsg.includes("marifarma")) {
            score += 35;
        }
        if (project.slug === "donde-florecen-los-sentimientos" && normalizedMsg.includes("flores")) {
            score += 28;
        }
        if (project.slug === "cincit-2026" && (normalizedMsg.includes("cincit") || normalizedMsg.includes("cencit"))) {
            score += 35;
        }

        if (score >= 14 && (!best || score > best.score)) {
            best = { project, score };
        }
    }

    return best?.project ?? null;
}

const OUT_OF_SCOPE_HINTS = [
    "mundial",
    "futbol",
    "receta",
    "clima",
    "chiste",
    "politica",
    "elecciones presidenciales",
    "horoscopo",
    "traduce",
    "tarea",
    "ensayo",
    "cancion",
    "pelicula",
];

const GREETING_PATTERN =
    /^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|que tal|saludos)\b/;
const THANKS_PATTERN = /\b(gracias|muchas gracias|te agradezco)\b/;

function buildSuggestions(): string[] {
    return rimy.chat.suggestions.slice(0, 4);
}

export function answerLocally(
    message: string,
    currency: Currency = "PEN"
): LocalAnswer {
    const normalized = normalize(message);

    if (GREETING_PATTERN.test(normalized) && normalized.length < 40) {
        return {
            reply: rimy.chat.welcome,
            suggestions: buildSuggestions(),
            matched: ["greeting"],
            category: "empresa",
            inScope: true,
        };
    }

    if (THANKS_PATTERN.test(normalized) && normalized.length < 45) {
        return {
            reply: "Con gusto. Si tienes otra pregunta sobre RimCode, nuestros servicios o proyectos, escríbela aquí o revisa las sugerencias.",
            suggestions: buildSuggestions(),
            matched: ["thanks"],
            category: "empresa",
            inScope: true,
        };
    }

    const offTopic = OUT_OF_SCOPE_HINTS.find((hint) => normalized.includes(hint));
    if (offTopic) {
        return {
            reply: `${rimy.projectExplainer.outOfScope} Si necesitas consultar un proyecto a medida, aquí tienes nuestros canales directos:`,
            table: buildTable("contact", currency),
            suggestions: buildSuggestions(),
            matched: [],
            inScope: false,
        };
    }

    const rawTokens = tokenize(message);
    const expandedTokens = expandTokens(rawTokens);

    // 1. Verificar si consulta por un proyecto específico del portafolio
    const specificProject = matchSpecificProject(normalized, rawTokens);
    if (specificProject) {
        const rows: string[][] = [
            ["Categoría", specificProject.category],
            ["Estado", STATUS_LABELS[specificProject.status]],
            ["Tecnologías", specificProject.technologies.join(", ")],
            [
                "Público objetivo",
                specificProject.targetAudience || specificProject.client || "RimCode",
            ],
        ];
        if (specificProject.links.website) {
            rows.push(["Sitio en vivo", specificProject.links.website]);
        }

        return {
            reply: `${specificProject.name}: ${specificProject.description}`,
            table: {
                headers: ["Ficha", "Detalle"],
                rows,
            },
            suggestions: [
                "¿Qué proyectos han desarrollado?",
                "¿Puedo solicitar una demostración?",
                "¿Cuánto cuesta desarrollar un sistema?",
                "¿Cómo puedo contratar sus servicios?",
            ],
            matched: [`project:${specificProject.slug}`],
            category: "proyectos",
            inScope: true,
        };
    }

    // 2. Buscar mejor coincidencia en db/faq/*.json
    const rankedFaq = faq.items
        .map((item) => ({
            item,
            score: scoreFaqItem(item, normalized, rawTokens, expandedTokens),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);

    const bestFaq = rankedFaq[0];
    if (bestFaq && bestFaq.score >= 7) {
        return {
            reply: bestFaq.item.answer,
            table: buildTable(bestFaq.item.tableType, currency),
            suggestions:
                bestFaq.item.relatedQuestions?.slice(0, 4) ?? buildSuggestions(),
            matched: [`faq:${bestFaq.item.id}`],
            category: bestFaq.item.category,
            inScope: true,
        };
    }

    // 3. Fallback sin inventar datos: sugerir preguntas + contacto
    return {
        reply: "No encontré un detalle exacto para esa consulta. Puedes elegir una de las preguntas sugeridas o comunicarte directamente con nuestro equipo:",
        table: buildTable("contact", currency),
        suggestions: buildSuggestions(),
        matched: [],
        inScope: false,
    };
}

export function getKnowledgeEntries(): KnowledgeEntry[] {
    return [
        {
            id: "company:about",
            title: company.name,
            text: `${company.name}: ${company.description}`,
            keywords: ["rimcode", "empresa"],
            source: "db/company.json",
        },
        ...faq.items.map((item) => ({
            id: `faq:${item.id}`,
            title: item.question,
            text: item.answer,
            keywords: [item.question, ...(item.variations ?? []), ...item.keywords],
            source: `db/faq/${item.category}.json`,
        })),
    ];
}

export function getOutOfScopeReply(): string {
    return rimy.projectExplainer.outOfScope;
}

export function getChatCopy() {
    return rimy.chat;
}

export function getRimyTtsConfig() {
    return rimy.tts;
}
