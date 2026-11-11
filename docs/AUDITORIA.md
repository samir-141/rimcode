# Auditoría de RimCode

Fecha: 2026-11-09
Alcance: repositorio `rimcode` completo (aplicación Next.js, componentes, estilos, API y assets).

## 1. Stack y estructura

| Elemento | Valor |
| --- | --- |
| Framework | Next.js 16.4.5 (App Router, Turbopack, `cacheComponents`) |
| UI | React 19.3, TypeScript 5 estricto, Tailwind CSS v4 |
| Paquetes | pnpm 12.18 |
| Animación | RIMY con rig SVG propio; Rive opcional vía `@rive-app/react-webgl2` |
| Datos | JSON centralizado en `db/` + capa tipada de acceso en `src/lib/db` |
| Rutas | `/`, `/projects`, `/projects/[slug]`, `/api/contact`, `/api/rimy/chat`, `/api/rimbot` (compatibilidad) |

La landing conserva sus 6 bloques: inicio, tecnologías, proyectos, simulador, metodología y contacto. Header, RIMY y el asistente viven en el layout raíz para persistir al navegar entre la landing y las fichas de proyecto.

## 2. Funcionalidades existentes y estado real

| Funcionalidad | Estado inicial | Estado actual |
| --- | --- | --- |
| Navegación por bloques (rueda, teclado, indicador) | Operativa en escritorio; dependía de IDs locales | Operativa; resolución de `/#seccion` al volver desde fichas, sin duplicación de Header/RIMY en `page.tsx` |
| Header responsive, tema y moneda | Funcional, tasas hardcodeadas en el componente | Consume `db/settings.json`; tasas y moneda compartidas con el simulador |
| Modo claro | **Roto**: el bootstrap solo añadía `.dark` y el CSS oscurecía `:root:not(.light)` | Corregido: se alternan `.light`/`.dark` y el fallback ya no pisa la elección |
| Hero y mensajes de bienvenida | Textos hardcodeados | Consume `db/company.json` y `db/rimy.json` |
| Tecnologías y filtros | Hardcodeadas en array local | Consume `db/technologies.json` dinámicamente |
| Proyectos | Tarjetas estáticas sin enlaces ni página individual | Tarjetas dinámicas conectadas a `db/projects.json` (incluyendo PosFarma), filtros, imagen con fallback, `Conocer más ↗`, demo iframe y ficha individual `/projects/[slug]` |
| Simulador PEN/USD/EUR | Funcional con precios y tasas fijas | Precios, módulos y plazos desde `db/services.json` y tasas dinámicas del store compartido |
| Metodología | Hardcodeada en componente | Consume `db/methodology.json` |
| Formulario de contacto | **Simulado** con `setTimeout`; mostraba éxito sin enviar | POST real a `/api/contact`, validación cliente/servidor, honeypot, tiempo mínimo anti-bot y manejo honesto de errores (503 si faltan credenciales) |
| Chat | Reglas locales; respondía fuera de alcance | `/api/rimy/chat` con alcance exclusivo RimCode, motor local documentado sobre `db/*.json` y proveedor IA opcional |
| RIMY | Máquina de estados y scroll | Se añadió `talking`, narración TTS con pausa/reanudación/parada y modo acoplado en rutas sin Hero |
| WhatsApp | Enlace con número placeholder `51999999999` | Deshabilitado hasta configurar `NEXT_PUBLIC_WHATSAPP_NUMBER` real |
| Documentación | Inexistente | `docs/` completo y `.env.example` estructurado |
| Variables de entorno | Sin ejemplo ni `.gitignore` específico | `.env.example` versionado; `.env*` ignorado salvo el ejemplo |

## 3. Errores y riesgos encontrados

1. **Falso éxito de contacto**: el formulario no enviaba nada y mostraba un éxito falso con `setTimeout`. Riesgo reputacional y de negocio grave. Corregido con llamada real a `/api/contact`, validaciones de servidor y respuestas honestas.
2. **Modo claro roto**: el script de layout no añadía `.light`; el media query oscurecía el sitio aunque el usuario eligiera claro. Corregido.
3. **Datos empresariales dispersos**: proyectos, precios, tecnologías, FAQ y mensajes vivían en componentes TSX. Centralizados en `db/`.
4. **Chat fuera de alcance**: el motor de reglas respondía preguntas generales no relacionadas con la empresa. Sustituido por recuperación sobre `db/` + rechazo explícito; con IA se usa un prompt restringido al contexto.
5. **WhatsApp placeholder**: se mostraba un número no verificado. Ahora se oculta si no hay variable real.
6. **Proyectos sin página ni demo**: no existían rutas individuales. Implementadas con `generateStaticParams`, `generateMetadata`, JSON-LD y demo iframe controlada.
7. **RIMY y Header duplicados**: `layout.tsx` y `page.tsx` montaban simultáneamente `<HeadLanding />` y `<RimyController />`, causando colisión de eventos y elementos duplicados. Corregido centralizando en `layout.tsx`.
8. **Componentes legacy**: `src/components/home/Home.tsx`, `src/components/tecnologias/tecnologias.tsx`, `RimBot.tsx` y `rimbot-data.ts` no participan en la landing actual. Se conservan para no romper compatibilidad; `/api/rimbot` sigue operativo.
9. **Sin protección de spam**: el formulario aceptaba cualquier envío. Añadidos honeypot, tiempo mínimo/máximo y rate limit.
10. **Rate limit en memoria**: suficiente para una instancia, no para varias réplicas serverless. Documentado como limitación para futura migración a Redis/Upstash.

## 4. Rendimiento

- `RimyMascot.tsx` es un SVG autónomo (~53 KB de código). Se mantiene porque evita descargar binarios y funciona sin WebGL. Rive es opcional.
- Los JSON de `db/` se importan estáticamente y se validan una vez; el coste es de bundle, no de red en cada render.
- Las portadas de proyectos son SVG locales de peso bajo. Se usa `<img>` con `loading="lazy"` y fallback, en lugar de `next/image`, para admitir URL externas sin configurar dominios.
- El simulador actualiza el cálculo en memoria; no hay llamadas por cambio de módulo.
- El chat y el contacto tienen timeout y rate limit; el proveedor IA se corta a los 20 s.
- La narración usa Web Speech API (sin red) y divide el texto en frases para pausas naturales.

## 5. Responsive

- El secuestro de rueda solo se activa con ancho ≥1024 px y alto ≥750 px; en móvil y portátiles compactas se permite scroll nativo continuo.
- Las rejillas pasan de 1 a 2/3/4 columnas según breakpoint.
- El panel del chat limita su alto a `calc(100dvh - 120px)` y su ancho a `calc(100vw - 32px)`.
- RIMY reduce su escala en el Hero y se acopla a la esquina inferior derecha; el lanzador del chat se oculta mientras RIMY ocupa el Hero en una sola columna para evitar solapamientos.
- Verificado en runtime a 800 px y a 384 px (iframe de 390 px), sin errores de consola.

## 6. Accesibilidad

Corregido o añadido:

- Botones reales en tarjetas de metodología, filtros, módulos del simulador y preguntas sugeridas (`aria-pressed`).
- Etiquetas `htmlFor`/`id` y `aria-invalid`/`aria-describedby` en el formulario.
- `role="alert"` para errores, `role="status"` para éxito y estados de carga.
- `aria-live` en el chat y en el estado de narración.
- Foco visible, tamaños mínimos de 44 px en acciones táctiles y texto alternativo en imágenes.
- RIMY respeta `prefers-reduced-motion` y su rig tiene etiqueta descriptiva.
- La narración es opcional y siempre existe equivalente textual; si el navegador no soporta voz se informa.

## 7. Dependencias

No se añadieron dependencias innecesarias. Resend y los webhooks se consumen con `fetch` nativo. La síntesis de voz usa la Web Speech API del navegador. Esto evita aumentar el bundle y mantiene la instalación reproducible.

## 8. Plan ejecutado por prioridades

1. **P0 · Seguridad y honestidad**: eliminar éxito simulado, validar servidor, ocultar WhatsApp placeholder, documentar variables, no inventar demos.
2. **P0 · Datos**: crear `db/` y la capa tipada; migrar componentes (`WelcomeSection`, `TechSection`, `ProjectsSection`, `SimulatorSection`, `MethodologySection`, `ContactSection`).
3. **P1 · Portafolio**: tarjetas dinámicas, imágenes con fallback, fichas SEO, demo iframe, proyectos relacionados y ficha de PosFarma.
4. **P1 · RIMY**: `talking`, TTS, explicador, persistencia en layout y rutas sin Hero.
5. **P1 · Chat**: alcance exclusivo, rate limit, motor local y proveedor IA opcional.
6. **P2 · Calidad**: modo claro, navegación desde subrutas, accesibilidad, lint/build y documentación completa en `docs/`.

## 9. Verificación realizada

```
pnpm exec tsc --noEmit   → OK
pnpm lint                → OK
pnpm build               → OK (fichas estáticas de proyectos generadas)
```

### Pruebas de runtime

- Rutas `/`, `/projects`, `/projects/posfarma`, `/projects/rimbill-pro`, `/projects/datarim-ai` y `/projects/novastore-global` responden 200; un slug inexistente responde 404.
- Chat sin IA: responde en modo local documentado para servicios, proyectos y precios; rechaza temas externos e intentos de extraer prompts; mensajes fuera de rango devuelven 422.
- Contacto sin configuración: validaciones 422, honeypot 200 sin envío, tiempo mínimo 400 y envío válido 503 con la lista de variables faltantes. Nunca devuelve un éxito simulado.
- Formulario: el envío muestra el error real del servidor y restaura el botón, sin mostrar éxito falso.
- Modo claro/oscuro: alterna `.light`/`.dark`, persiste en `localStorage` y no parpadea al recargar.
- RIMY: inicia en el Hero de la landing, se acopla al hacer scroll, nace acoplada en las fichas y vuelve al Hero al regresar a la landing.
- Navegación cliente: header, RIMY y la conversación del chat persisten entre la landing y las fichas.
- Responsive: verificado en dispositivos móviles, tablets y monitores de escritorio.
- Imágenes de proyectos: cargan los SVG locales; las tarjetas usan fallback ante error y las demos permanecen desactivadas.

Pruebas funcionales pendientes de credenciales reales: envío de correo (Resend/webhook) y respuestas con proveedor de IA. Sin esas variables el sistema responde 503/502 de forma explícita y el chat usa el motor local etiquetado.

## 10. Información pendiente de negocio

- Historia corporativa, datos legales y visión aprobada.
- WhatsApp, teléfono, ubicación y horarios reales.
- URLs de demo, repositorios, documentación y galerías de los proyectos en producción.
- Verificación de métricas publicadas en la landing original como resultados oficiales.

Estos campos permanecen vacíos o marcados en `pending`; no se rellenaron con datos ficticios.
