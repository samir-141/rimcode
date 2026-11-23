export type Currency = "PEN" | "USD" | "EUR";

export type CompanyValue = {
    name: string;
    description: string;
};

export type Company = {
    meta: {
        lastUpdated: string;
        source: string;
        pendingConfirmation: string[];
    };
    name: string;
    legalName: string;
    tagline: string;
    shortDescription: string;
    description: string;
    history: string;
    valueProposition: string;
    mission: string;
    vision: string;
    values: CompanyValue[];
    founder: {
        name: string;
        role: string;
        bio: string;
        quote: string;
    };
    servicesSummary: string[];
    institutional: {
        market: string;
        workingLanguages: string[];
        deliveryModel: string;
    };
};

export type ContactChannel = {
    id: string;
    label: string;
    value: string;
    href: string;
    enabled: boolean;
};

export type Contact = {
    email: string;
    phone: string;
    whatsapp: {
        number: string;
        message: string;
        enabled: boolean;
    };
    location: {
        city: string;
        country: string;
        display: string;
    };
    hours: string;
    channels: ContactChannel[];
    responseTime: string;
    form: {
        successTitle: string;
        successMessage: string;
        errorFallback: string;
        privacyNote: string;
    };
    pendingConfirmation: string[];
};

export type SocialNetwork = {
    id: string;
    name: string;
    url: string;
    icon: string;
    visible: boolean;
};

export type ProjectStatus = "production" | "development" | "prototype" | "archived";

export type ProjectDemo = {
    type: "iframe" | "video" | "external";
    url: string;
    enabled: boolean;
    title: string;
    description: string;
    aspectRatio: string;
};

export type ProjectLinks = {
    website: string;
    github: string;
    documentation: string;
};

export type ProjectSeo = {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    ogType: "website" | "article";
    twitterCard: "summary" | "summary_large_image";
    altText: string;
};

export type Project = {
    id: string;
    slug: string;
    name: string;
    category: string;
    status: ProjectStatus;
    featured: boolean;
    published: boolean;
    shortDescription: string;
    description: string;
    problem: string;
    targetAudience?: string;
    objectives: string[];
    technologies: string[];
    thumbnail: string;
    gallery: string[];
    demo: ProjectDemo;
    links: ProjectLinks;
    features: string[];
    challenges: string[];
    solutions: string[];
    results: string[];
    metrics: string;
    client: string;
    publishedAt: string;
    accent: string;
    pending: string[];
    seo?: ProjectSeo;
};

export type ProjectsData = {
    meta: {
        lastUpdated: string;
        source: string;
        note: string;
    };
    projects: Project[];
};

export type TechnologyCategory = {
    id: string;
    label: string;
};

export type Technology = {
    id: string;
    name: string;
    category: string;
    tag: string;
    description: string;
    highlight: string;
};

export type TechnologiesData = {
    categories: TechnologyCategory[];
    items: Technology[];
    metrics: { value: string; label: string }[];
    intro: string;
};

export type Service = {
    id: string;
    name: string;
    description: string;
    basePriceUSD: number | null;
    basePricePEN?: number;
    publicationPEN?: number;
    legacyLabels: string[];
};

export type ServiceModule = {
    id: string;
    name: string;
    priceUSD: number | null;
};

type QuoteOption = { id: string; name: string; multiplier: number | null };

export type ServicesData = {
    audiences: string;
    services: Service[];
    modules: ServiceModule[];
    integrations: ServiceModule[];
    complexities: QuoteOption[];
    delivery: QuoteOption[];
    infrastructure: {
        id: string;
        name: string;
        period: "mes" | "año";
        variants: { id: string; name?: string; amountPEN: number }[];
    }[];
    disclaimer: string;
    helpText: string;
};

export type MethodologyStep = {
    num: string;
    title: string;
    tag: string;
    description: string;
    deliverable: string;
};

export type MethodologyData = {
    steps: MethodologyStep[];
    guarantee: {
        title: string;
        description: string;
    };
    intro: string;
};

export type FaqTableType =
    | "services"
    | "pricing"
    | "projects"
    | "technologies"
    | "methodology"
    | "contact";

export type FaqItem = {
    id: string;
    question: string;
    variations?: string[];
    answer: string;
    keywords: string[];
    category: string;
    relatedQuestions?: string[];
    tableType?: FaqTableType;
};

export type FaqData = {
    items: FaqItem[];
};

export type RimyAnimationName =
    | "idle"
    | "greeting"
    | "run"
    | "fall"
    | "annoyed"
    | "happy"
    | "thinking"
    | "talking"
    | "error";

export type RimyToneName =
    | "neutral"
    | "happy"
    | "annoyed"
    | "surprised"
    | "thinking";

export type RimyData = {
    name: string;
    role: string;
    personality: string[];
    greeting: {
        text: string;
        audioText: string;
        audioFile: string;
    };
    messages: {
        returning: string;
        alreadyGreeted: string;
        docked: string;
        fastScroll: string;
        repetitiveScroll: string;
        dwelling: string;
        bored: string;
        trip: string;
        wave: string;
        tap: string[];
        sections: Record<
            string,
            {
                animation: RimyAnimationName;
                tone: RimyToneName;
                message: string;
            }
        >;
    };
    projectExplainer: {
        title: string;
        intro: string;
        basicLabel: string;
        detailedLabel: string;
        emptyDetail: string;
        noDescription: string;
        questions: string[];
        outOfScope: string;
    };
    tts: {
        lang: string;
        rate: number;
        pitch: number;
        volume: number;
        sentencePauseMs: number;
    };
    chat: {
        welcome: string;
        title: string;
        subtitle: string;
        inputPlaceholder: string;
        thinkingLabel: string;
        localModeLabel: string;
        aiModeLabel: string;
        scopeNotice: string;
        suggestions: string[];
    };
};

export type SettingsData = {
    site: {
        name: string;
        locale: string;
        defaultUrl: string;
        /** Derivada de NEXT_PUBLIC_APP_URL o de defaultUrl. */
        url?: string;
    };
    theme: {
        storageKey: string;
        default: "light" | "dark";
    };
    currency: {
        storageKey: string;
        default: Currency;
        options: Currency[];
        fallbackRates: Record<Currency, number>;
        ratesEndpoint: string;
        refreshMs: number;
    };
    projects: {
        featuredLimit: number;
        relatedLimit: number;
    };
    chat: {
        maxMessageLength: number;
        minMessageLength: number;
        rateLimitPerMinute: number;
        historyLimit: number;
        timeoutMs: number;
    };
    contact: {
        rateLimitPerHour: number;
        minimumFillTimeMs: number;
        maximumFillTimeMs: number;
        maxMessageLength: number;
        minMessageLength: number;
    };
    credits: {
        year: number;
        text: string;
    };
};
