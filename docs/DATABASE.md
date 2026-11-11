# Base de datos documental (`db/`)

`db/` no es una base de datos relacional: es una **fuente de contenido versionada en JSON**. Se importa de forma estática y se valida en `src/lib/db`.

## 1. Archivos

| Archivo | Contenido | Consumidores |
| --- | --- | --- |
| `company.json` | Nombre, descripción, misión, visión, valores, fundador, mercado | Landing, layout, contacto, chat |
| `contact.json` | Correo, WhatsApp, canales, textos del formulario | Contacto, chat, API |
| `social.json` | Redes con URL, icono y visibilidad | Preparado para footer/contacto |
| `projects.json` | Portafolio completo | Landing, `/projects`, `/projects/[slug]`, chat |
| `technologies.json` | Stack, categorías, métricas e intro | Sección de tecnologías |
| `services.json` | Servicios, módulos, precios referenciales y plazos | Simulador, contacto, chat |
| `methodology.json` | Fases, entregables y garantía | Sección de metodología |
| `faq.json` | Preguntas, respuestas y palabras clave | Chat |
| `rimy.json` | Personalidad, mensajes, TTS y copy del chat | RIMY, chat, explicador |
| `settings.json` | URL, tema, moneda, límites y créditos | Header, layout, APIs |

## 2. Contrato de proyectos

Cada entrada de `projects.json` cumple `Project` en `src/lib/db/types.ts`:

```json
{
  "id": "rimbill-pro",
  "slug": "rimbill-pro",
  "name": "RimBill Pro",
  "category": "Fintech & Enterprise",
  "status": "production",
  "featured": true,
  "published": true,
  "shortDescription": "…",
  "description": "…",
  "problem": "…",
  "objectives": [],
  "technologies": ["Next.js 16"],
  "thumbnail": "/images/projects/rimbill-pro.svg",
  "gallery": [],
  "demo": {
    "type": "iframe",
    "url": "",
    "enabled": false,
    "title": "Demostración de RimBill Pro",
    "description": "",
    "aspectRatio": "16 / 9"
  },
  "links": { "website": "", "github": "", "documentation": "" },
  "features": ["…"],
  "challenges": [],
  "solutions": [],
  "results": ["…"],
  "metrics": "…",
  "client": "…",
  "publishedAt": "",
  "accent": "#a3e635",
  "pending": ["Galería de imágenes", "Enlaces y demostración pública"]
}
```

Campos obligatorios validados: `id`, `slug`, `name`, `category`, `shortDescription`, `description`, `thumbnail`, `status` válido, arrays de textos y `demo`/`links` como objetos. Los slugs duplicados se descartan y se registra un error en desarrollo.

### Estados admitidos

`production`, `development`, `prototype`, `archived`.

### Reglas de imágenes

`resolveProjectImage(source)` acepta:

- Rutas locales que empiecen por `/` y terminen en `png`, `jpg`, `jpeg`, `webp`, `svg` o `avif` (con query opcional).
- URLs absolutas `http://` o `https://`.

Cualquier otro valor cae a `/images/projects/fallback.svg`. Si una imagen externa falla en el navegador, `ProjectCard` cambia al fallback con `onError`.

### Reglas de demo

- `demo.enabled: false` o `demo.url: ""` → no se renderiza iframe; se muestra “Demostración pública pendiente”.
- `demo.enabled: true` y URL válida → iframe con `title`, `loading="lazy"` y `referrerPolicy="no-referrer"`.
- Nunca se intenta evadir `X-Frame-Options` ni CSP de terceros. Se ofrece abrir en otra pestaña.
- No se inventan URLs.

## 3. Cómo añadir un proyecto

1. Copia un objeto existente en `db/projects.json`.
2. Define un `id` y `slug` únicos (minúsculas y guiones).
3. Completa solo información documentada. Deja `""` o `[]` en lo que falte y añade la etiqueta correspondiente en `pending`.
4. Añade la imagen en `public/images/projects/` o una URL externa válida.
5. Si existe demo, define `demo.url` y `demo.enabled: true`; si no, déjala desactivada.
6. Ejecuta `pnpm build`; la ficha `/projects/<slug>` se genera automáticamente.
7. Añade el enlace al chat solo si está en `projects.json`; el motor de conocimiento lo lee de ahí.

El proyecto aparecerá en la landing si `featured` es `true` y en `/projects` si `published` no es `false`.

## 4. Contacto y servicios

`services.services[].contactLabel` es el valor que envía el formulario y el que valida `/api/contact`. Si cambias la etiqueta, actualiza el formulario automáticamente; no hay una segunda lista hardcodeada.

El simulador guarda la estimación en `sessionStorage` con la clave `rimcode:quote` y emite el evento `rimcode:quote`. El formulario escucha ese evento y, si ya está montado, prerrellena asunto, servicio y mensaje como borrador editable. El servicio solo se aplica si su etiqueta coincide con `contactLabel`; nunca se inventan datos del visitante.

`contact.form` contiene los textos de éxito, error y privacidad. `contact.channels` define los canales visibles; el correo y WhatsApp se recalculan con variables de entorno.

## 5. RIMY y chat

- `rimy.messages` alimenta los mensajes contextuales de scroll, saludo, caída y toques.
- `rimy.greeting.audioFile` apunta al audio pregrabado.
- `rimy.tts` define idioma, velocidad, tono, volumen y pausa entre frases.
- `rimy.chat` define textos, sugerencias y etiquetas de modo local/IA.
- `rimy.projectExplainer` define títulos y textos de respaldo.
- `faq.items[].keywords` se usan para recuperación local y como contexto del proveedor IA.

## 6. Ajustes

`settings.json` centraliza:

- URL canónica de respaldo (`defaultUrl`), sobrescrita por `NEXT_PUBLIC_APP_URL`.
- Clave de tema y moneda, tasas de respaldo, endpoint y frecuencia.
- Límites de chat (longitud, historial, rate limit, timeout).
- Límites de contacto (mensajes por hora, tiempo mínimo/máximo, longitud).
- Límite de proyectos destacados y relacionados.

## 7. Validación y mantenimiento

- TypeScript no valida el contenido de un JSON importado con `as`; por eso existe `validateProject`.
- En desarrollo, los errores de validación se muestran en consola y el proyecto inválido se omite.
- Los JSON deben ser UTF-8 y no incluir comentarios (JSON estricto).
- No guardes secretos, correos privados ni credenciales en `db/`. Las claves viven solo en `.env.local`.
- Los datos sensibles o dinámicos (leads, mensajes enviados) no se almacenan aquí; el formulario los envía al proveedor configurado.

## 8. Contenido pendiente actual

Los tres proyectos documentados (RimBill Pro, DataRim AI, NovaStore Global) conservan los textos publicados en la landing original. Permanecen pendientes: objetivos, galerías, desafíos, soluciones, enlaces públicos y demos. Los SVG de portada son abstractos y se identifican como imágenes de referencia.
