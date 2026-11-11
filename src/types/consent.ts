export type ConsentCategoryId =
    | "necessary"
    | "preferences"
    | "analytics"
    | "marketing";

export type ConsentSource =
    | "accept_all"
    | "reject_optional"
    | "custom"
    | "revoked";

export type ConsentCategories = Record<ConsentCategoryId, boolean>;

export type ConsentRecord = {
    /** Versión de la política que aceptó el visitante. */
    version: string;
    /** Fecha y hora de la última actualización del registro. */
    updatedAt: string;
    /** Fecha y hora del consentimiento original. */
    consentedAt: string;
    /** Cómo se produjo la última decisión. */
    source: ConsentSource;
    /** Categorías autorizadas. `necessary` siempre es true. */
    categories: ConsentCategories;
};

export type ConsentState = ConsentRecord | null;

export type ConsentEventDetail = {
    record: ConsentRecord;
};
