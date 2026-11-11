# Arquitectura de RimCode

## 1. Visión general

RimCode es una aplicación Next.js 16 (App Router) con tres capas claras:

```
db/*.json                  → contenido institucional y de portafolio
src/lib/db/*               → contratos TypeScript, validación y getters
src/components/*           → UI de landing, proyectos, RIMY y chat
src/app/*                  → rutas, layouts, metadata y route handlers
```

La regla es: **ningún componente de la landing define información empresarial propia**. Los textos, precios, proyectos y mensajes viven en `db/` y se leen mediante `src/lib/db`.

## 2. Estructura principal

```
db/
  company.json        Información corporativa y fundador
  contact.json        Correo, canales, textos del formulario
  social.json         Redes y visibilidad
  projects.json       Portafolio completo
  technologies.json   Stack, categorías y métricas
  services.json       Servicios, módulos y plazos
  methodology.json    Fases y garantía
  faq.json            Preguntas frecuentes y palabras clave
  rimy.json           Personalidad, mensajes, TTS y textos del chat
  settings.json       URL, tema, moneda, límites, créditos

src/
  app/
    layout.tsx        Header + RIMY + asistente persistentes
    page.tsx          Landing con bloques y snap scroll
    projects/
      page.tsx        Índice del portafolio
      [slug]/page.tsx Ficha estática por proyecto
    api/
      contact/route.ts     Envío real de contacto
      rimy/chat/route.ts   Chat exclusivo
      rimbot/route.ts      API legacy compatible
  components/
    header/            Navegación, tema y moneda
    landing/           Secciones y navegación por bloques
    projects/          Tarjeta, demo y explicador RIMY
    rimy/              Mascota, estados, audio y narración
  lib/
    db/                Tipos, getters y validación
    rimy/              knowledge, chat-service, narration
    projects/          Presentación y JSON-LD
    server/            Rate limit e IP
    currency.ts        Store compartido de moneda/tasas
    validation.ts      Correo, saneado y escape HTML
```

## 3. Flujo de datos

1. Los JSON se importan estáticamente en `src/lib/db/index.ts`.
2. Los proyectos se normalizan y validan (campos obligatorios, estados, slugs únicos).
3. Los getters exponen datos ya normalizados. `getContact()` superpone variables públicas (`NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`) y deshabilita WhatsApp si no hay número.
4. Los componentes cliente importan los getters. Al ser JSON estático, el contenido llega al bundle; no hay fetch adicional ni parpadeo.
5. El servidor usa los mismos getters para metadatos, JSON-LD y validación de servicios del formulario.

## 4. Persistencia de UI

- **Header**: en `src/app/layout.tsx`; usa `usePathname` para saber si está en la landing. Desde una ficha navega a `/#seccion`.
- **RIMY**: una sola instancia en el layout. `RimyController` se alinea al hueco `#rimy-hero-slot` cuando existe; si no, `useScrollBehavior` fuerza el modo `docked`.
- **Chat**: en el layout, por lo que conserva la conversación mientras se navega entre la landing y las fichas.
- **Tema**: script inline en `<head>` que aplica `.dark` o `.light` antes del primer paint; el header mantiene el store externo.
- **Moneda**: store externo (`src/lib/currency.ts`) compartido por header y simulador; una sola descarga de tasas cada 5 minutos.

## 5. Portafolio

- `ProjectsSection` filtra por categoría y pinta `ProjectCard`.
- `ProjectCard` resuelve la imagen con `resolveProjectImage` y cae a `fallback.svg` ante error.
- `/projects` lista todo el portafolio publicado.
- `/projects/[slug]` se genera estáticamente con `generateStaticParams`, usa `notFound()` para slugs inexistentes, `generateMetadata` para SEO y JSON-LD `CreativeWork`.
- `ProjectDemo` solo renderiza iframe si `demo.enabled && demo.url`. Si no, muestra un estado vacío honesto. Si el iframe tarda 12 s, sugiere abrir la demo en otra pestaña y explica que algunos sitios bloquean iframes.
- `ProjectExplainer` ofrece resumen básico, explicación detallada y preguntas rápidas; todo el texto es visible y la voz es opcional.

## 6. RIMY

La máquina de estados está en `useRimyState`. Cada animación tiene prioridad y duración:

| Estado | Prioridad | Uso |
| --- | --- | --- |
| idle | 0 | reposo |
| thinking | 20 | espera o duda |
| happy | 40 | respuesta positiva |
| run | 50 | desplazamiento |
| talking | 55 | narración TTS |
| error | 60 | tropiezo de scroll |
| annoyed | 70 | scroll repetitivo |
| fall | 80 | doble toque |
| greeting | 100 | bienvenida única por sesión |

La narración (`src/lib/rimy/narration.ts`) es un singleton con `speak`, `pauseNarration`, `resumeNarration` y `stopNarration`. Divide el texto en frases, selecciona una voz española y expone estado a la UI. `RimyController` observa ese estado y solicita `talking`; al terminar vuelve a `idle`.

## 7. Chat y contacto

- **Chat**: route handler `/api/rimy/chat`. Valida longitud, limita por IP y sanea el historial. Sin IA configurada responde con el motor local sobre `db/` y lo etiqueta. Con IA configurada llama a un endpoint compatible con OpenAI Chat Completions con un system prompt restringido al contexto documentado. Si el proveedor falla, devuelve error 502; no inventa una respuesta.
- **Contacto**: route handler `/api/contact`. Valida en servidor, comprueba honeypot y tiempo mínimo, aplica rate limit y envía por Resend o webhook. Sin configuración devuelve 503 con la lista de variables faltantes. El cliente solo muestra éxito si el servidor devuelve `ok: true`.

## 8. Decisiones de diseño

- No se añadieron librerías de formularios, validación, correo o rate limiting: se mantiene el árbol de dependencias pequeño.
- Los SVG de portada son imágenes de referencia, no capturas reales. La ficha lo indica.
- Los campos sin documentación se representan como `""`, `[]` o `pending`; la UI los muestra como pendientes, no como datos reales.
- El rate limit es en memoria y por instancia; para producción multirréplica debe migrarse a Redis/Upstash.
- `/api/rimbot` se conserva para no romper integraciones antiguas, pero la UI usa `/api/rimy/chat`.

## 9. Extensiones previstas

- Sustituir portadas abstractas por capturas reales cuando existan.
- Añadir demo y enlaces reales en `db/projects.json` cuando estén disponibles.
- Migrar rate limiting a un almacén compartido.
- Añadir pruebas e2e (Playwright) y unitarias del motor de conocimiento.
- Integrar un proveedor SMTP si se prefiere sobre Resend/webhook.
