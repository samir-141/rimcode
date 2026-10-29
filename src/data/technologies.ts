import { Technology } from "@/types";

// Distribution around a 3D sphere of radius R = 2.4
function getSpherePoint(index: number, total: number, radius = 2.4): [number, number, number] {
  const phi = Math.acos(1 - 2 * (index + 0.5) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * (index + 0.5);
  const x = Number((radius * Math.sin(phi) * Math.cos(theta)).toFixed(3));
  const y = Number((radius * Math.sin(phi) * Math.sin(theta)).toFixed(3));
  const z = Number((radius * Math.cos(phi)).toFixed(3));
  return [x, y, z];
}

const rawTechnologies: Omit<Technology, "position">[] = [
  {
    id: "react",
    name: "React",
    category: "frontend",
    iconName: "Atom",
    shortDescription: "Biblioteca estándar para construir interfaces de usuario interactivas.",
    fullDescription:
      "React permite modelar interfaces complejas mediante componentes reutilizables, estado predecible y alto rendimiento en renderizado gracias a su arquitectura moderna y concurrent features.",
    primaryUse: "Construcción de dashboards administrativos, componentes interactivos y SPAs de alto dinamismo.",
    keyBenefits: [
      "Arquitectura basada en componentes mantenibles y testeables.",
      "Ecosistema maduro con soporte masivo de librerías y herramientas.",
      "Excelente integración con Next.js y ecosistemas Full-Stack.",
    ],
    docUrl: "https://react.dev",
    color: "#00f0ff",
    relatedProjects: ["angibotica", "beeflow-auditor", "donde-florecen-los-sentimientos"],
  },
  {
    id: "nextjs",
    name: "Next.js",
    category: "frontend",
    iconName: "Globe",
    shortDescription: "Framework de producción para React con App Router y Server Components.",
    fullDescription:
      "Next.js combina Server-Side Rendering (SSR), Static Site Generation (SSG) y Server Components para lograr tiempos de carga mínimos, SEO técnico óptimo y excelente experiencia de desarrollo.",
    primaryUse: "Landing pages comerciales de alta conversión y portales web con optimización SEO estricta.",
    keyBenefits: [
      "Carga inicial ultra rápida gracias a Server Components.",
      "Optimización automática de imágenes, fuentes y scripts.",
      "Ruteo flexible y endpoints de servidor integrados.",
    ],
    docUrl: "https://nextjs.org",
    color: "#38bdf8",
    relatedProjects: ["rimcode", "beeflow-auditor"],
  },
  {
    id: "typescript",
    name: "TypeScript",
    category: "frontend",
    iconName: "Code2",
    shortDescription: "Superset tipado de JavaScript para código robusto y libre de errores en tiempo de ejecución.",
    fullDescription:
      "Aporta tipado estático riguroso a todo el proyecto (frontend y backend), facilitando refactorizaciones seguras, contratos de API consistentes y autocompletado en el equipo de desarrollo.",
    primaryUse: "Tipado estricto en modelos de dominio, validaciones de formularios y contratos cliente-servidor.",
    keyBenefits: [
      "Prevención temprana de fallos en producción (bugs tipográficos y nulos).",
      "Documentación viva del código a través de interfaces y tipos.",
      "Mantenibilidad a largo plazo en aplicaciones empresariales.",
    ],
    docUrl: "https://www.typescriptlang.org",
    color: "#3b82f6",
    relatedProjects: ["angibotica", "rimcode"],
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    category: "frontend",
    iconName: "Palette",
    shortDescription: "Framework CSS utility-first para diseño responsivo ágil y consistente.",
    fullDescription:
      "Proporciona utilidades atómicas combinables para construir interfaces precisas sin escribir CSS disperso, manteniendo una guía de estilos y variables coherente en todo el proyecto.",
    primaryUse: "Maquetación de interfaces responsivas, sistemas de diseño oscuros/claros y microinteracciones.",
    keyBenefits: [
      "Cero hojas de estilos infladas gracias a la purga de clases.",
      "Consistencia geométrica en espaciados, tipografías y colores.",
      "Diseño responsive intuitivo con soporte de temas HSL.",
    ],
    docUrl: "https://tailwindcss.com",
    color: "#06b6d4",
    relatedProjects: ["rimcode", "angibotica", "superlative-choux"],
  },
  {
    id: "nodejs",
    name: "Node.js",
    category: "backend",
    iconName: "Server",
    shortDescription: "Entorno de ejecución asíncrono para servicios backend y APIs escalables.",
    fullDescription:
      "Permite ejecutar JavaScript en el servidor bajo un modelo orientado a eventos sin bloqueo de I/O, ideal para APIs RESTful, microservicios ligeros y procesamiento de solicitudes concurrentes.",
    primaryUse: "Construcción de APIs, endpoints de integración y automatizaciones de procesamiento.",
    keyBenefits: [
      "Excelente rendimiento en operaciones I/O concurrentes.",
      "Uso de un mismo lenguaje (TypeScript/JS) en todo el ciclo de vida del software.",
      "Extenso catálogo de utilidades y librerías comprobadas.",
    ],
    docUrl: "https://nodejs.org",
    color: "#22c55e",
    relatedProjects: ["angibotica"],
  },
  {
    id: "nestjs",
    name: "NestJS",
    category: "backend",
    iconName: "Cpu",
    shortDescription: "Framework backend empresarial y modular sobre Node.js con TypeScript.",
    fullDescription:
      "Inspirado en la arquitectura orientada a servicios, inyección de dependencias y patrones limpios. Permite estructurar sistemas de gestión complejos con módulos, controladores y servicios desacoplados.",
    primaryUse: "Backend del sistema ERP AngiBotica, orquestación de inventarios y autenticación segura.",
    keyBenefits: [
      "Arquitectura limpia y estandarizada que evita el código espagueti.",
      "Inyección de dependencias nativa y tipado estricto.",
      "Soporte de validación automática mediante DTOs y decoradores.",
    ],
    docUrl: "https://nestjs.com",
    color: "#e11d48",
    relatedProjects: ["angibotica"],
  },
  {
    id: "postgresql",
    name: "PostgreSQL",
    category: "database",
    iconName: "Database",
    shortDescription: "Base de datos relacional de nivel empresarial con integridad ACID comprobada.",
    fullDescription:
      "Motor de base de datos relacional líder para datos transaccionales, inventarios, kardex y facturación donde la consistencia de cada registro es innegociable.",
    primaryUse: "Almacenamiento del catálogo de productos, movimientos de inventario y transacciones en AngiBotica.",
    keyBenefits: [
      "Integridad referencial y cumplimiento ACID sin concesiones.",
      "Soporte de índices complejos, triggers y tipos de datos JSONB.",
      "Confiabilidad comprobada en producción para datos financieros y operativos.",
    ],
    docUrl: "https://www.postgresql.org",
    color: "#60a5fa",
    relatedProjects: ["angibotica"],
  },
  {
    id: "prisma",
    name: "Prisma ORM",
    category: "database",
    iconName: "Layers",
    shortDescription: "ORM moderno de nueva generación con tipado seguro de esquemas y migraciones.",
    fullDescription:
      "Permite interactuar con la base de datos con autocompletado y validación de tipos estricta en TypeScript, automatizando migraciones reproducibles y minimizando errores SQL en desarrollo.",
    primaryUse: "Modelado relacional de inventarios, usuarios y ventas con sincronización continua de esquemas.",
    keyBenefits: [
      "Consultas tipadas de extremo a extremo sin errores de tipografía.",
      "Migraciones declarativas que versionan la evolución de la base de datos.",
      "Prisma Studio integrado para inspección visual de datos en desarrollo.",
    ],
    docUrl: "https://www.prisma.io",
    color: "#a855f7",
    relatedProjects: ["angibotica"],
  },
  {
    id: "git",
    name: "Git & GitHub",
    category: "devops-tools",
    iconName: "GitBranch",
    shortDescription: "Control de versiones distribuido y colaboración con flujo de ramas profesional.",
    fullDescription:
      "Gestión de código fuente mediante commits semánticos, ramas de funcionalidades y trazabilidad completa de cambios en el proyecto.",
    primaryUse: "Versionado de repositorios, integración continua y despliegue automatizado.",
    keyBenefits: [
      "Historial inmutable y control detallado de cada cambio de código.",
      "Flujo de trabajo colaborativo seguro.",
      "Integración nativa con pipelines de despliegue en Vercel y VPS.",
    ],
    docUrl: "https://git-scm.com",
    color: "#f97316",
    relatedProjects: ["angibotica", "beeflow-auditor", "donde-florecen-los-sentimientos"],
  },
  {
    id: "docker",
    name: "Docker",
    category: "devops-tools",
    iconName: "Box",
    shortDescription: "Contenedores ligeros para entornos de desarrollo y despliegues predecibles.",
    fullDescription:
      "Empaqueta aplicaciones con sus dependencias exactas en contenedores independientes, garantizando que el software funcione de manera idéntica en local y en producción.",
    primaryUse: "Contenerización de bases de datos PostgreSQL, redis y entornos de pruebas para APIs.",
    keyBenefits: [
      "Eliminación del problema 'en mi máquina sí funciona'.",
      "Aislamiento de servicios y configuración declarativa vía Docker Compose.",
      "Despliegues reproducibles y fáciles de escalar.",
    ],
    docUrl: "https://www.docker.com",
    color: "#0284c7",
    relatedProjects: ["angibotica"],
  },
  {
    id: "rest-apis",
    name: "REST APIs & Integraciones",
    category: "backend",
    iconName: "Webhook",
    shortDescription: "Diseño y consumo de servicios web estandarizados, seguros y versionados.",
    fullDescription:
      "Diseño de contratos de API RESTful con códigos de estado HTTP semánticos, autenticación JWT, rate limiting y sanitización estricta de payloads.",
    primaryUse: "Conexión de sistemas ERP con clientes web, pasarelas de pago y servicios externos de mensajería.",
    keyBenefits: [
      "Interoperabilidad entre plataformas web, móviles y sistemas legados.",
      "Documentación clara de endpoints y validación de esquemas.",
      "Seguridad por capas con control de acceso y sanitización.",
    ],
    docUrl: "https://developer.mozilla.org/es/docs/Glossary/REST",
    color: "#10b981",
    relatedProjects: ["angibotica", "rimcode"],
  },
  {
    id: "threejs",
    name: "Three.js & R3F",
    category: "frontend",
    iconName: "Sparkles",
    shortDescription: "Gráficos 3D interactivos con WebGL y shaders para experiencias digitales inmersivas.",
    fullDescription:
      "Permite crear escenas tridimensionales en el navegador sin plugins externos, renderizando modelos procedimentales, luces reactivas y animaciones coordinadas con el cursor.",
    primaryUse: "Visualización del globo tecnológico de RimCode y avatares procedimentales interactivos.",
    keyBenefits: [
      "Experiencias diferenciadoras que aumentan el engagement del usuario.",
      "Aceleración por hardware mediante WebGL en navegadores modernos.",
      "Control declarativo de la escena mediante React Three Fiber.",
    ],
    docUrl: "https://threejs.org",
    color: "#8b5cf6",
    relatedProjects: ["rimcode", "donde-florecen-los-sentimientos"],
  },
];

export const technologies: Technology[] = rawTechnologies.map((tech, idx) => ({
  ...tech,
  position: getSpherePoint(idx, rawTechnologies.length, 2.05),
}));

export const techCategories: { id: string; label: string; count: number }[] = [
  { id: "all", label: "Todo el Stack", count: technologies.length },
  {
    id: "frontend",
    label: "Frontend & UI",
    count: technologies.filter((t) => t.category === "frontend").length,
  },
  {
    id: "backend",
    label: "Backend & APIs",
    count: technologies.filter((t) => t.category === "backend").length,
  },
  {
    id: "database",
    label: "Bases de Datos",
    count: technologies.filter((t) => t.category === "database").length,
  },
  {
    id: "devops-tools",
    label: "DevOps & Herramientas",
    count: technologies.filter((t) => t.category === "devops-tools").length,
  },
];

