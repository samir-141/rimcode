import { siteConfig } from "./site";

export const projectTypes = [
  { id: "erp", label: "Sistema ERP / Control de Inventario & Ventas" },
  { id: "webapp", label: "Aplicación Web Personalizada" },
  { id: "ecommerce", label: "E-Commerce / Catálogo Interactivo" },
  { id: "api", label: "Desarrollo de API / Integración Backend" },
  { id: "optimization", label: "Auditoría, Mantenimiento u Optimización" },
  { id: "other", label: "Otra necesidad técnica específica" },
];

export const budgetRanges = [
  { id: "range-1", label: "Menos de $1,000 USD (Proyecto inicial / Módulo)" },
  { id: "range-2", label: "$1,000 - $3,000 USD (Sistema completo / MVP)" },
  { id: "range-3", label: "$3,000 - $6,000 USD (Plataforma avanzada)" },
  { id: "range-4", label: "Más de $6,000 USD (Solución integral a medida)" },
  { id: "consult", label: "Prefiero definirlo tras evaluar la solución" },
];

export function buildWhatsAppUrl(customMessage?: string): string {
  const message = customMessage || siteConfig.contact.whatsappDefaultMessage;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${siteConfig.contact.whatsappNumber}?text=${encoded}`;
}

