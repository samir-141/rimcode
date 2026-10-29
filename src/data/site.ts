import { SiteConfig } from "@/types";

export const siteConfig: SiteConfig = {
  name: "RimCode",
  shortName: "RimCode",
  developer: "Samir Jhoner Gómez Alarcón",
  role: "Full-Stack Developer",
  tagline: "Transformo problemas operativos y necesidades de negocio en soluciones digitales funcionales.",
  subheadline:
    "Desarrollo de sistemas ERP, herramientas de gestión empresarial, aplicaciones web personalizadas y experiencias digitales diseñadas para optimizar procesos y escalar operaciones.",
  valueProposition:
    "Soluciones digitales a medida con arquitectura moderna, código mantenible, interfaces intuitivas y enfoque directo en la rentabilidad operativa de tu negocio.",
  contact: {
    email: "jhonergomez20@gmail.com",
    whatsappNumber: "51929284937",
    whatsappFormatted: "+51 929 284 937",
    whatsappDefaultMessage:
      "Hola Samir, vengo desde RimCode y me gustaría consultar sobre el desarrollo de un proyecto.",
    githubUrl: "https://github.com/samir-141",
    linkedinUrl: "https://www.linkedin.com/in/samir-jhoner-g%C3%B3mez-alarc%C3%B3n/",
  },
  availabilityStatus: {
    isAvailable: true,
    text: "Disponible para nuevos proyectos",
    detail: "Aceptando consultorías y desarrollo de sistemas a medida",
  },
  navigation: [
    { label: "Tecnologías", href: "#tecnologias" },
    { label: "Demo Mini ERP", href: "#demo-erp" },
    { label: "Proyectos", href: "#proyectos" },
    { label: "Servicios", href: "#servicios" },
    { label: "Sobre mí", href: "#sobre-mi" },
    { label: "Proceso", href: "#proceso" },
    { label: "Contacto", href: "#contacto" },
  ],
};

export const seoConfig = {
  title: "RimCode | Samir Jhoner Gómez Alarcón — Full-Stack Developer & Soluciones Digitales",
  description:
    "Portafolio y servicios de Samir Jhoner Gómez Alarcón (RimCode). Desarrollo de sistemas ERP, aplicaciones web a medida, APIs escalables y optimización de software empresarial.",
  keywords: [
    "RimCode",
    "Samir Jhoner Gómez Alarcón",
    "Desarrollador Full-Stack Perú",
    "Sistemas ERP a medida",
    "Desarrollo web Next.js",
    "React TypeScript PostgreSQL",
    "Software de inventario y ventas",
    "Landing pages interactivas",
    "Soluciones digitales para pymes",
  ],
  author: "Samir Jhoner Gómez Alarcón",
  siteUrl: "https://rimcode.dev", // Configurable base URL
  ogImage: "/images/og-rimcode.png",
};

