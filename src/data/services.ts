import { ServiceItem } from "@/types";

export const services: ServiceItem[] = [
  {
    id: "erp-gestion",
    title: "Sistemas ERP y Gestión Empresarial",
    tagline: "Control unificado de inventario, ventas, compras y operaciones",
    colSpan: "large",
    problem:
      "Uso de hojas de cálculo dispersas, pérdida de existencias por falta de kardex en tiempo real y lentitud para saber cuánto vendió el negocio durante el día.",
    solution:
      "Desarrollo de sistemas de gestión a medida con control de inventario por lotes, punto de venta (POS) rápido, registro de movimientos y roles de acceso claros.",
    expectedBenefit:
      "Centralización total de la información operativa, reducción de errores humanos en cajas e inventarios y toma de decisiones basada en datos confiables.",
    deliverables: [
      "Plataforma web de gestión accesible por roles autorizados.",
      "Módulo de punto de venta rápido (POS) con cálculo automático de totales.",
      "Kardex e historial inmutable de movimientos de stock.",
      "Reportes de ventas, productos de baja rotación y márgenes brutos.",
    ],
    icon: "LayoutDashboard",
    accentColor: "cyan",
  },
  {
    id: "web-apps",
    title: "Aplicaciones Web Personalizadas",
    tagline: "Software adaptado exactamente a las reglas y flujos de tu empresa",
    colSpan: "medium",
    problem:
      "Las soluciones empaquetadas en el mercado imponen cobros mensuales elevados y funciones innecesarias, mientras que carecen de las opciones específicas que tu flujo de trabajo diario exige.",
    solution:
      "Creación de aplicaciones web a la medida construidas con Next.js, React y TypeScript, priorizando velocidad, claridad para los operadores y adaptabilidad futura.",
    expectedBenefit:
      "Herramientas digitales que se amoldan a tus procesos en vez de forzar a tu equipo a adaptarse a software rígido.",
    deliverables: [
      "Arquitectura web escalable y modular.",
      "Interfaces limpias, responsivas y fáciles de usar sin capacitación extensa.",
      "Base de datos optimizada para las consultas críticas de tu negocio.",
    ],
    icon: "Code",
    accentColor: "violet",
  },
  {
    id: "ecommerce-experiencias",
    title: "E-Commerce y Experiencias Digitales",
    tagline: "Catálogos interactivos y canales directos de venta online",
    colSpan: "medium",
    problem:
      "Catálogos desactualizados en PDF que resultan incómodos de consultar en móviles, perdiendo clientes que buscan rapidez para ver productos y cotizar al instante.",
    solution:
      "Diseño de experiencias comerciales modernas con navegación ágil, catálogo dinámico y vinculación fluida hacia WhatsApp o pasarelas de pago.",
    expectedBenefit:
      "Mayor agilidad para que tus prospectos descubran tu propuesta de valor y completen sus consultas o pedidos en pocos clics.",
    deliverables: [
      "Catálogo interactivo con filtros rápidos por categoría y disponibilidad.",
      "Integración estructurada con WhatsApp Business para pedidos directos.",
      "Diseño responsive premium adaptado a la identidad visual de tu marca.",
    ],
    icon: "ShoppingBag",
    accentColor: "blue",
  },
  {
    id: "apis-backend",
    title: "APIs y Servicios Backend",
    tagline: "Arquitecturas seguras, eficientes y preparadas para integraciones",
    colSpan: "medium",
    problem:
      "Sistemas desarticulados que obligan a duplicar manualmente la información entre distintas aplicaciones o servicios de terceros.",
    solution:
      "Construcción de APIs RESTful robustas en NestJS / Node.js con autenticación, validación estricta de esquemas y documentación estructurada.",
    expectedBenefit:
      "Comunicación fluida y segura entre tus plataformas web, bases de datos y herramientas externas.",
    deliverables: [
      "Endpoints de API documentados y tipados de extremo a extremo.",
      "Autenticación segura basada en tokens y roles de usuario.",
      "Manejo ordenado de errores y logs para diagnóstico rápido.",
    ],
    icon: "Cpu",
    accentColor: "emerald",
  },
  {
    id: "automatizacion",
    title: "Automatización de Procesos",
    tagline: "Elimina tareas manuales repetitivas y gana horas operativas",
    colSpan: "small",
    problem:
      "Tu equipo invierte horas valiosas copiando datos entre hojas de cálculo, enviando notificaciones manuales y generando resúmenes rutinarios.",
    solution:
      "Implementación de scripts y servicios automatizados que sincronizan información, generan alertas y procesan reportes de forma programada.",
    expectedBenefit:
      "Reducción de tareas monótonas y menor probabilidad de descuidos en tareas rutinarias.",
    deliverables: [
      "Scripts de sincronización y procesamiento de datos.",
      "Alertas automáticas vía correo o mensajería ante eventos clave.",
    ],
    icon: "Zap",
    accentColor: "cyan",
  },
  {
    id: "auditoria-optimizacion",
    title: "Auditoría, Mantenimiento y Optimización",
    tagline: "Acelera tus aplicaciones existentes y corrige fallas de raíz",
    colSpan: "small",
    problem:
      "Sistemas lentos, pantallas que demoran en cargar, caídas repentinas o código heredado difícil de modificar por falta de estructura.",
    solution:
      "Diagnóstico exhaustivo de rendimiento, refactorización de consultas a bases de datos, modernización de componentes y corrección de cuellos de botella.",
    expectedBenefit:
      "Aplicaciones notablemente más rápidas, reducción de costos de infraestructura y mayor estabilidad operativa.",
    deliverables: [
      "Informe técnico de diagnóstico y oportunidades de mejora.",
      "Optimización de consultas SQL y tiempos de respuesta de endpoints.",
      "Corrección de errores críticos y actualización segura de dependencias.",
    ],
    icon: "ShieldCheck",
    accentColor: "violet",
  },
];

