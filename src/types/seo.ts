export type JsonLdValue =
    | Record<string, unknown>
    | Array<Record<string, unknown>>;

export type SeoPageOverrides = {
    title?: string;
    description?: string;
    canonical?: string;
    path?: string;
    type?: "website" | "article";
    images?: Array<{ url: string; alt?: string; width?: number; height?: number }>;
    publishedTime?: string;
    keywords?: string[];
    noIndex?: boolean;
};
