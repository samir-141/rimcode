import { Project } from "@/types";

export const projects: Project[] = [
  {
    id: "donde-florecen-los-sentimientos",
    title: "Donde Florecen los Sentimientos",
    subtitle: "Experiencia Web Interactiva de Narrativa Romántica",
    category: "Experiencias Web Interactivas",
    statusBadge: "En Vivo • Vercel",
    summary:
      "Aplicación web temática diseñada para transformar el significado de las flores amarillas en una experiencia digital romántica, mediante una narrativa visual que busca transmitir emociones, cariño y conexión a través de una interfaz inmersiva.",
    problem:
      "Los mensajes románticos tradicionales suelen limitarse a textos, imágenes estáticas o dedicatorias convencionales. Este proyecto busca ofrecer una alternativa más personal e inmersiva, convirtiendo una dedicatoria en una experiencia digital que invite al usuario a explorar, descubrir y conectar emocionalmente con la historia.",
    personalContribution:
      "Conceptualización y desarrollo de una experiencia web centrada en la narrativa visual, combinando diseño de interfaz, composición estética y elementos interactivos para construir una presentación romántica con identidad propia.",
    keyFeatures: [
      "Diseño visual inspirado en las flores amarillas y su simbolismo romántico.",
      "Presentación narrativa orientada a transmitir emociones mediante una experiencia digital.",
      "Interfaz visual diseñada para generar una conexión emocional con el usuario.",
      "Experiencia web accesible y optimizada desde navegadores modernos.",
      "Enfoque en la combinación de estética, contenido y exploración interactiva.",
    ],
    technologies: ["React", "TypeScript", "Tailwind CSS", "JavaScript", "Vercel"],
    image: "/images/projects/flores-amarillas-preview.png",
    demoUrl: "https://flores-amarrillaslvoe-delta.vercel.app/",
    repoUrl: "https://github.com/samir-141",
    isPrivateRepo: false,
  },
  {
    id: "beeflow-auditor",
    title: "BEEFLOW Auditor",
    subtitle: "Sistema de Auditoría de Servicio y Generación de Reportes Apícolas",
    category: "Herramientas Web & Auditoría",
    statusBadge: "En Vivo • Netlify",
    summary:
      "Aplicación web orientada a digitalizar el registro y la auditoría de colmenas, permitiendo organizar información de campo, gestionar lotes de registros y generar documentos estandarizados para su impresión y revisión operativa. La interfaz contempla captura desde dispositivos móviles y tablets, junto con una vista previa de los documentos en formato A4.",
    problem:
      "Los procesos de auditoría realizados mediante formularios físicos dificultan la consolidación de información, aumentan el riesgo de errores de transcripción y requieren tiempo adicional para organizar los datos y preparar informes. BEEFLOW Auditor busca centralizar estos registros en una interfaz digital y facilitar su conversión en documentos listos para imprimir.",
    personalContribution:
      "Desarrollo de una herramienta web especializada en la gestión de registros apícolas, con formularios estructurados, operaciones masivas sobre registros, organización por lotes y generación de reportes imprimibles, priorizando la eficiencia del trabajo de campo y la estandarización documental.",
    keyFeatures: [
      "Gestión de auditorías: registro de campo, apicultor, fecha, proyecto y lote.",
      "Registro de colmenas: identificación individual y control de atributos como número de marcos y estado de la colmena.",
      "Procesamiento por lotes: carga de muestras, creación de registros y aplicación masiva de valores.",
      "Búsqueda y organización: localización de colmenas y administración de hojas de registro.",
      "Generación de documentos: vista previa de reportes, exportación a PDF e impresión en formato A4 horizontal.",
      "Intercambio de información: importación y exportación de datos mediante archivos JSON y CSV.",
      "Interfaz multidispositivo: herramientas para captura de información desde móviles y tablets.",
    ],
    technologies: ["JavaScript", "HTML5", "CSS3", "Netlify", "JSON / CSV"],
    image: "/images/projects/beeflow-preview.png",
    demoUrl: "https://superlative-choux-f30238.netlify.app/",
    repoUrl: "https://github.com/samir-141",
    isPrivateRepo: false,
  },
  {
    id: "angibotica",
    title: "AngiBotica",
    subtitle: "Sistema de Gestión y Control Operativo para Farmacias",
    category: "Sistemas ERP & Gestión",
    statusBadge: "En Desarrollo Activo",
    summary:
      "Plataforma integral diseñada para centralizar el control de inventario farmacéutico, ventas de mostrador, control de lotes y trazabilidad de movimientos en pequeñas y medianas boticas.",
    problem:
      "Las pequeñas boticas y farmacias locales enfrentan discrepancias frecuentes entre el inventario físico y registrado, vencimiento desapercibido de medicamentos y lentitud en la atención por falta de un punto de venta conectado al kardex en tiempo real.",
    personalContribution:
      "Diseño integral de la arquitectura Full-Stack: modelado de datos relacionales en PostgreSQL con Prisma, implementación del backend modular con NestJS, y desarrollo de la interfaz de usuario con React y Tailwind CSS.",
    keyFeatures: [
      "Control de inventario por lotes y alertas automáticas de stock mínimo.",
      "Módulo de punto de venta rápido (POS) con registro directo en el kardex.",
      "Búsqueda instantánea de medicamentos por nombre comercial y principio activo.",
      "Registro de movimientos con trazabilidad por rol de usuario.",
      "Generación de reportes operativos de ventas y rotación de productos.",
    ],
    technologies: ["React", "NestJS", "PostgreSQL", "Prisma ORM", "TypeScript", "Tailwind CSS"],
    image: "/images/projects/angibotica-preview.png",
    repoUrl: "https://github.com/samir-141",
    isPrivateRepo: true,
  },
];
