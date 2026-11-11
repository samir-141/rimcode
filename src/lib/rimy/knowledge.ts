import {
    getCompany,
    getContact,
    getFaq,
    getMethodology,
    getProjects,
    getRimy,
    getServices,
    getTechnologies,
} from "@/lib/db";
import type { Currency, Project } from "@/lib/db/types";

export type KnowledgeEntry = {
    id: string;
    title: string;
    text: string;
    keywords: string[];
    source: string;
};

export type LocalAnswer = {
    reply: string;
    suggestions: string[];
    matched: string[];
    inScope: boolean;
};

const company = getCompany();
const contact = getContact();
const faq = getFaq();
const methodology = getMethodology();
const projects = getProjects();
const rimy = getRimy();
const services = getServices();
const technologies = getTechnologies();

const STOPWORDS = new Set([
    "que",
    "qué",
    "como",
    "cómo",
    "cual",
    "cuál",
    "cuales",
    "cuáles",
    "donde",
    "dónde",
    "cuando",
    "cuándo",
    "porque",
    "porqué",
    "para",
    "por",
    "con",
    "sin",
    "los",
    "las",
    "del",
    "las",
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
    "más",
    "mas",
    "muy",
    "hay",
    "tiene",
    "tienen",
    "puedo",
    "pueden",
    "hace",
    "hacen",
    "soy",
    "eres",
    "es",
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
    "y",
    "o",
    "a",
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
    "él",
    "ella",
]);

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
        .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

function projectEntry(project: Project): KnowledgeEntry {
    const parts = [
        `${project.name} es un proyecto de RimCode en la categoría ${project.category}.`,
        project.shortDescription,
        project.problem ? `Problema que resuelve: ${project.problem}` : "",
        project.features.length
            ? `Funcionalidades documentadas: ${project.features.join(", ")}.`
            : "",
        project.technologies.length
            ? `Tecnologías: ${project.technologies.join(", ")}.`
            : "",
        project.results.length
            ? `Resultados documentados: ${project.results.join(", ")}.`
            : "Los resultados ampliados de este proyecto aún no están documentados.",
    ].filter(Boolean);

    return {
        id: `project:${project.slug}`,
        title: project.name,
        text: parts.join(" "),
        keywords: [
            project.name,
            project.slug,
            project.category,
            "proyecto",
            ...project.technologies,
        ],
        source: "db/projects.json",
    };
}

export function getKnowledgeEntries(): KnowledgeEntry[] {
    const entries: KnowledgeEntry[] = [
        {
            id: "company:about",
            title: "RimCode",
            text: `${company.name}: ${company.description} ${company.valueProposition} Misión: ${company.mission}`,
            keywords: ["rimcode", "empresa", "compañia", "negocio", "sobre"],
            source: "db/company.json",
        },
        {
            id: "company:founder",
            title: "Fundador",
            text: `RimCode fue fundada por ${company.founder.name}, ${company.founder.role}. ${company.founder.quote}`,
            keywords: [
                "fundador",
                "creador",
                "samir",
                "gomez",
                "alarcon",
                "detras",
            ],
            source: "db/company.json",
        },
        {
            id: "services:list",
            title: "Servicios",
            text: `Servicios documentados: ${services.services
                .map((service) => `${service.name} (${service.description})`)
                .join("; ")}.`,
            keywords: [
                "servicio",
                "servicios",
                "ofrecen",
                "hacen",
                "desarrollo",
                "saas",
                "ecommerce",
                "erp",
                "landing",
                "web",
                "plataforma",
            ],
            source: "db/services.json",
        },
        {
            id: "services:budget",
            title: "Presupuestos",
            text: `Los precios del simulador son referenciales: ${services.services
                .filter((service) => service.basePriceUSD > 0)
                .map(
                    (service) =>
                        `${service.name} desde ${service.basePriceUSD} USD`
                )
                .join("; ")}. El presupuesto final depende del alcance y se confirma en una propuesta formal.`,
            keywords: [
                "precio",
                "precios",
                "cuesta",
                "costo",
                "cotizar",
                "cotizacion",
                "presupuesto",
                "inversion",
                "simulador",
                "tarifa",
            ],
            source: "db/services.json",
        },
        {
            id: "technologies:stack",
            title: "Tecnologías",
            text: `Stack documentado: ${technologies.items
                .map((item) => item.name)
                .join(", ")}. ${technologies.intro}`,
            keywords: [
                "tecnologia",
                "tecnologias",
                "stack",
                "lenguaje",
                "framework",
                "herramientas",
                "next",
                "react",
                "postgres",
                "docker",
                "python",
            ],
            source: "db/technologies.json",
        },
        {
            id: "methodology:process",
            title: "Metodología",
            text: `Proceso de trabajo: ${methodology.steps
                .map(
                    (step) =>
                        `${step.num}. ${step.title}: ${step.description}`
                )
                .join(" ")}`,
            keywords: [
                "metodologia",
                "proceso",
                "etapas",
                "fases",
                "sprints",
                "trabajan",
                "entrega",
            ],
            source: "db/methodology.json",
        },
        {
            id: "contact:channels",
            title: "Contacto",
            text: `Puedes contactar a RimCode en ${contact.email}. ${
                contact.whatsapp.enabled
                    ? `WhatsApp: +${contact.whatsapp.number}.`
                    : ""
            } ${contact.responseTime}`,
            keywords: [
                "contacto",
                "contactar",
                "correo",
                "email",
                "escribir",
                "reunion",
                "hablar",
                "contratar",
                "whatsapp",
            ],
            source: "db/contact.json",
        },
        {
            id: "company:values",
            title: "Valores",
            text: `Valores de RimCode: ${company.values
                .map((value) => `${value.name} (${value.description})`)
                .join("; ")}.`,
            keywords: ["valores", "garantia", "propiedad", "codigo", "calidad"],
            source: "db/company.json",
        },
        {
            id: "projects:list",
            title: "Proyectos",
            text: `Proyectos documentados: ${projects
                .map((project) => `${project.name} (${project.category})`)
                .join("; ")}.`,
            keywords: [
                "proyecto",
                "proyectos",
                "portafolio",
                "casos",
                "experiencia",
            ],
            source: "db/projects.json",
        },
    ];

    for (const project of projects) {
        entries.push(projectEntry(project));
    }

    for (const item of faq.items) {
        entries.push({
            id: `faq:${item.id}`,
            title: item.question,
            text: item.answer,
            keywords: [item.question, ...item.keywords],
            source: "db/faq.json",
        });
    }

    return entries;
}

function scoreEntry(entry: KnowledgeEntry, message: string): number {
    const normalizedMessage = normalize(message);
    const messageTokens = new Set(tokenize(message));
    let score = 0;

    for (const keyword of entry.keywords) {
        const normalizedKeyword = normalize(keyword);
        if (!normalizedKeyword) continue;

        if (normalizedKeyword.includes(" ")) {
            if (normalizedMessage.includes(normalizedKeyword)) score += 6;
        } else if (messageTokens.has(normalizedKeyword)) {
            score += 4;
        }
    }

    const titleTokens = tokenize(entry.title);
    for (const token of titleTokens) {
        if (messageTokens.has(token)) score += 2;
    }

    return score;
}

const OUT_OF_SCOPE_HINTS = [
    "mundial",
    "futbol",
    "receta",
    "clima",
    "chiste",
    "politica",
    "elecciones",
    "presidente",
    "novia",
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
            reply: `${rimy.chat.welcome} Puedo ayudarte con información sobre RimCode.`,
            suggestions: buildSuggestions(),
            matched: ["greeting"],
            inScope: true,
        };
    }

    if (THANKS_PATTERN.test(normalized) && normalized.length < 40) {
        return {
            reply: "¡Gracias a ti! Si quieres, puedo contarte más sobre nuestros servicios o proyectos. 🤖",
            suggestions: buildSuggestions(),
            matched: ["thanks"],
            inScope: true,
        };
    }

    const offTopic = OUT_OF_SCOPE_HINTS.find((hint) =>
        normalized.includes(hint)
    );
    if (offTopic) {
        return {
            reply: rimy.projectExplainer.outOfScope,
            suggestions: buildSuggestions(),
            matched: [],
            inScope: false,
        };
    }

    const entries = getKnowledgeEntries();
    const ranked = entries
        .map((entry) => ({ entry, score: scoreEntry(entry, message) }))
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score);

    if (ranked.length === 0) {
        return {
            reply: `${rimy.projectExplainer.outOfScope} ${rimy.chat.scopeNotice}`,
            suggestions: buildSuggestions(),
            matched: [],
            inScope: false,
        };
    }

    const best = ranked[0].entry;
    const top = ranked
        .filter((item) => item.score >= Math.max(4, ranked[0].score * 0.6))
        .slice(0, 3);

    let reply = best.text;

    if (best.id === "services:list") {
        reply += ` ${services.helpText}`;
    }

    if (best.id === "services:budget") {
        reply += ` La moneda activa en el sitio es ${currency}; el simulador muestra la conversión referencial. Para una cotización formal, usa el formulario de contacto.`;
    }

    if (
        best.id.startsWith("project:") ||
        best.id === "projects:list"
    ) {
        reply += " Puedes abrir cada proyecto en su página individual para ver el detalle documentado.";
    }

    if (best.id === "contact:channels") {
        reply += ` También tienes el formulario de la sección de contacto.`;
    }

    const extra = top
        .slice(1)
        .map((item) => item.entry.text)
        .join(" ");

    if (extra && reply.length < 700) {
        reply = `${reply} ${extra}`;
    }

    return {
        reply,
        suggestions: buildSuggestions(),
        matched: top.map((item) => item.entry.id),
        inScope: true,
    };
}

export function buildAiContext(message: string): string {
    const entries = getKnowledgeEntries();
    const ranked = entries
        .map((entry) => ({ entry, score: scoreEntry(entry, message) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .filter((item) => item.score > 0);

    const selected = ranked.length > 0 ? ranked.map((item) => item.entry) : entries.slice(0, 5);

    return selected
        .map(
            (entry) =>
                `[${entry.source}] ${entry.title}\n${entry.text}`
        )
        .join("\n\n");
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
