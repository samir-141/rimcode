export type RimBotEmotion =
    | "idle"
    | "wave"
    | "thinking"
    | "talking"
    | "happy"
    | "coding";

export interface ChatMessage {
    id: string;
    sender: "bot" | "user";
    text: string;
    timestamp: string;
    emotion?: RimBotEmotion;
    suggestions?: string[];
}

export interface QuickPrompt {
    id: string;
    label: string;
    query: string;
    icon?: string;
}

export const QUICK_PROMPTS: QuickPrompt[] = [
    {
        id: "services",
        label: "💼 ¿Qué servicios ofrecen?",
        query: "¿Qué servicios ofrece RimCode?",
    },
    {
        id: "founder",
        label: "👤 ¿Quién es el fundador?",
        query: "¿Quién es el fundador de RimCode?",
    },
    {
        id: "stack",
        label: "⚡ Tecnologías que usan",
        query: "¿Qué tecnologías y stack utilizan?",
    },
    {
        id: "quote",
        label: "💰 Quiero cotizar un proyecto",
        query: "¿Cómo puedo cotizar mi proyecto?",
    },
    {
        id: "methodology",
        label: "🚀 Metodología de trabajo",
        query: "¿Cómo es su metodología de desarrollo?",
    },
    {
        id: "contact",
        label: "📞 Contactar con un especialista",
        query: "¿Cómo me contacto con RimCode?",
    },
];

export const INITIAL_BOT_MESSAGE: ChatMessage = {
    id: "welcome-init",
    sender: "bot",
    text: "¡Hola! Soy **RimBot**, la mascota e IA asistente de **RimCode** 🤖💻. Estoy aquí para contarte sobre nuestros servicios, nuestro fundador, calcular presupuestos o ayudarte a iniciar tu próximo software a medida.",
    timestamp: "Ahora",
    emotion: "wave",
    suggestions: [
        "¿Qué servicios ofrecen?",
        "¿Quién es el fundador?",
        "Quiero cotizar un proyecto",
    ],
};

export const RIMCODE_KNOWLEDGE = {
    name: "RimCode",
    founder: "Samir Jhoner Gomez Alarcon",
    tagline: "Desarrollo de software a la medida & Soluciones Digitales",
    mission: "Crear software de alto impacto con arquitectura limpia, escalabilidad robusta y diseño centrado en el usuario.",
    services: [
        "Desarrollo de aplicaciones web de alto rendimiento (Next.js, React, Node.js).",
        "Sistemas a medida, paneles administrativos y plataformas SaaS.",
        "Arquitectura Cloud & Microservicios (AWS, Supabase, Vercel, Docker).",
        "Diseño de interfaces UI/UX modernas y accesibles.",
        "Optimización de rendimiento y Clean Code.",
    ],
    techStack: [
        "Next.js 16 (Turbopack, Server Actions)",
        "React 19 & TypeScript",
        "Tailwind CSS v4",
        "Node.js, Express, Python",
        "PostgreSQL, Prisma, Supabase",
        "Docker, Git, CI/CD",
    ],
    methodology: [
        "Sprint 0: Análisis de requerimientos y arquitectura inicial.",
        "Entregas iterativas cada 1 a 2 semanas con demos funcionales.",
        "Clean Code y pruebas de calidad continuas.",
        "Despliegue automatizado y soporte post-lanzamiento.",
    ],
};

// Generador de respuestas inteligentes contextuales (usado tanto en cliente como en API)
export function getBotResponse(
    query: string,
    currency: "PEN" | "USD" | "EUR" = "PEN"
): { text: string; emotion: RimBotEmotion; suggestions: string[] } {
    const q = query.toLowerCase().trim();

    // 1. Preguntas sobre fundador
    if (
        q.includes("fundador") ||
        q.includes("creador") ||
        q.includes("samir") ||
        q.includes("dueño") ||
        q.includes("quien creo")
    ) {
        return {
            text: `**RimCode** fue fundada por **${RIMCODE_KNOWLEDGE.founder}**. Su visión es construir software artesanal de nivel empresarial combinando **Clean Code**, metodologías ágiles e interfaces modernas de ultra alto rendimiento.`,
            emotion: "happy",
            suggestions: [
                "¿Qué servicios ofrecen?",
                "¿Qué tecnologías usan?",
                "Quiero contactar al equipo",
            ],
        };
    }

    // 2. Servicios
    if (
        q.includes("servicio") ||
        q.includes("hacen") ||
        q.includes("dedican") ||
        q.includes("ofrecen") ||
        q.includes("desarrollo")
    ) {
        return {
            text: `En **RimCode** nos especializamos en:\n\n` +
                RIMCODE_KNOWLEDGE.services.map((s) => `• ${s}`).join("\n") +
                `\n\n¿Tienes un proyecto en mente que quieras hacer realidad?`,
            emotion: "talking",
            suggestions: [
                "Quiero cotizar un proyecto",
                "¿Qué tecnologías usan?",
                "¿Cómo es su metodología?",
            ],
        };
    }

    // 3. Tecnologías / Stack
    if (
        q.includes("tecnolog") ||
        q.includes("stack") ||
        q.includes("lenguaje") ||
        q.includes("framework") ||
        q.includes("react") ||
        q.includes("next")
    ) {
        return {
            text: `Nuestro stack principal está a la vanguardia de la industria:\n\n` +
                RIMCODE_KNOWLEDGE.techStack.map((t) => `⚡ ${t}`).join("\n") +
                `\n\nNos aseguramos de que cada línea de código sea mantenible, rápida y escalable.`,
            emotion: "coding",
            suggestions: [
                "¿Qué metodología usan?",
                "¿Cuánto cuesta un proyecto?",
                "¿Quién es el fundador?",
            ],
        };
    }

    // 4. Cotización / Precios / Simulador
    if (
        q.includes("precio") ||
        q.includes("cotiz") ||
        q.includes("cost") ||
        q.includes("cuanto vale") ||
        q.includes("simulador") ||
        q.includes("presupuesto")
    ) {
        const baseEstimate =
            currency === "PEN"
                ? "S/. 2,500 - S/. 8,000 PEN"
                : currency === "USD"
                ? "$700 - $2,500 USD"
                : "€650 - €2,300 EUR";

        return {
            text: `Los proyectos varían según el alcance, integraciones y requerimientos técnicos. Para un MVP o plataforma web profesional, nuestros rangos parten típicamente desde **${baseEstimate}** (${currency}).\n\nPuedes navegar a la sección **#simulador** para calcular un estimado interactivo o contactarnos directamente para una propuesta personalizada.`,
            emotion: "talking",
            suggestions: [
                "Ir al Simulador",
                "Contactar por WhatsApp",
                "¿Cuánto tardan en desarrollar?",
            ],
        };
    }

    // 5. Metodología
    if (
        q.includes("metodolog") ||
        q.includes("proceso") ||
        q.includes("etapas") ||
        q.includes("tiempo") ||
        q.includes("tardan")
    ) {
        return {
            text: `Nuestra metodología se enfoca en la transparencia y rapidez:\n\n` +
                RIMCODE_KNOWLEDGE.methodology.map((m) => `✔ ${m}`).join("\n") +
                `\n\nUn MVP suele estar listo en un plazo de 2 a 4 semanas.`,
            emotion: "talking",
            suggestions: [
                "Quiero cotizar mi idea",
                "¿Qué servicios ofrecen?",
                "Contactar ahora",
            ],
        };
    }

    // 6. Contacto
    if (
        q.includes("contact") ||
        q.includes("whatsapp") ||
        q.includes("correo") ||
        q.includes("email") ||
        q.includes("telefono") ||
        q.includes("reunion")
    ) {
        return {
            text: `¡Excelente! Puedes escribirnos directamente desde la sección **#contactanos** en esta landing page, o enviarnos un mensaje para agendar una sesión estratégica sin compromiso.`,
            emotion: "happy",
            suggestions: [
                "Ir a Contacto",
                "¿Quién es el fundador?",
                "¿Qué stack tecnológico usan?",
            ],
        };
    }

    // 7. Saludos y bienvenida
    if (
        q.includes("hola") ||
        q.includes("buenos") ||
        q.includes("buenas") ||
        q.includes("hey") ||
        q.includes("que tal")
    ) {
        return {
            text: `¡Hola! Qué gusto saludarte. Soy **RimBot**, tu copiloto en RimCode. ¿Te gustaría conocer nuestros servicios, saber cómo trabajamos o simular un presupuesto?`,
            emotion: "wave",
            suggestions: [
                "¿Qué servicios ofrecen?",
                "¿Quién es el fundador?",
                "Quiero cotizar un proyecto",
            ],
        };
    }

    // Respuesta por defecto inteligente
    return {
        text: `Interesante consulta sobre "${query}". En **RimCode** nos especializamos en transformar desafíos técnicos en plataformas sólidas y de alto rendimiento. ¿Te gustaría cotizar una idea, conocer nuestro stack o hablar de los servicios que ofrecemos?`,
        emotion: "thinking",
        suggestions: [
            "¿Qué servicios ofrecen?",
            "¿Quién es el fundador?",
            "Quiero cotizar un proyecto",
        ],
    };
}
