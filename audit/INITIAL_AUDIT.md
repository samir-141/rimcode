# Auditoría inicial de RimCode

Referencia `main` en `12dd839`, Next.js 16.4.5 (Turbopack), React 19.3.0, TypeScript 5, Node 26.12.1 y pnpm 12.18.0. Se revisaron `AGENTS.md`, las guías instaladas de App Router, CSP, headers y variables, `docs/` y los componentes, datos y manejadores de `src/`. No se encontraron skills dentro del repositorio ni pruebas versionadas.

| Severidad | Evidencia y componente | Corrección prevista |
| --- | --- | --- |
| Alta | `POST /api/rimbot` acepta cuerpos sin límite, usa otro corpus y elude el límite del chat principal. El cliente visible consulta directamente `answerLocally`. | Unificar entrada, validación, límite y fuente de datos. Preservar la forma de la API anterior. |
| Media | Contacto y chat confían en encabezados de IP sin una frontera de confianza explícita. El contador vive por instancia. | Hacer explícito el proxy confiable, acotar memoria y admitir un contador compartido. |
| Media | `StructuredData` inserta JSON sin escapar `<`. Faltan CSP y encabezados. Las demos tienen iframe sin sandbox. | Escapar JSON-LD, restringir orígenes, validar URL y aplicar sandbox. |
| Media | Contacto ignora teléfono, expone detalles de configuración, acepta duplicados y lee todo el JSON antes de validarlo. | Limitar lectura, validar campos, proteger origen, usar idempotencia y respuestas genéricas. |
| Media | `pnpm audit` detectó un aviso moderado de `minimatch` 10.2.6 en la cadena de ESLint. | Evaluar versión corregida y confirmar compatibilidad del linter. |
| Media | Simulador mezcla cálculo, tarifas y React, presupone módulos y presenta fechas de entrega uniformes para alcances distintos. | Separar reglas, catálogo configurable y cotización por evaluación. |
| Media | Saludo intenta reproducir WAV al montar. Chat y fichas dibujan una mascota adicional, la boca usa un ciclo fijo y el chat oculta fallos de voz. | Audio por acción, única mascota, estado compartido y sincronización. |
| Baja | Formulario, preferencias de cookies, encabezado y chat compiten por espacio en móvil. El chat vuelve a enfocar el campo al añadir mensajes. | Revisar breakpoints, foco, scroll y controles. |

`pnpm lint`, `pnpm build` y `pnpm audit --prod` terminaron con código 0 antes de modificar la aplicación. El build generó la landing, el índice y siete fichas, legales, 404, robots, sitemap y tres APIs. Se revisaron Inicio, Tecnologías, Proyectos, Simulador, Metodología y Contacto, el header, navegación por bloques, privacidad/consentimiento y la máquina de estados SVG/Rive. Se identificaron componentes de una generación anterior fuera de los flujos activos.

No se identificaron rutas administrativas, sesiones de usuario ni bases de datos con operaciones de escritura. El repositorio consume JSON versionado, correo Resend/webhook, tasas externas, Analytics opcional y demos externas. `chat-service.ts` era un stub local aunque algunos documentos describían IA activa. La entrega real de correo, Analytics con propiedad real, demos fuera de este host y el entorno de despliegue quedaron fuera de la línea base local. El repo solo versiona `.env.example`.
