import type { JsonLdValue } from "@/types/seo";

type StructuredDataProps = {
    data: JsonLdValue;
};

/**
 * Renderiza JSON-LD en el documento. Componente de servidor:
 * no añade JavaScript al cliente.
 */
export default function StructuredData({ data }: StructuredDataProps) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}
