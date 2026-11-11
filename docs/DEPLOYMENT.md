# Despliegue

RimCode es una aplicación Next.js 16 con App Router. Se puede desplegar en Vercel o en cualquier host que ejecute Node.js. Esta guía cubre ambos casos y las comprobaciones previas.

## 1. Requisitos

- Node.js 20.9 o superior (requisito de Next.js 16).
- pnpm 12.18 (definido en `packageManager`). También funciona npm o yarn, pero el lockfile es `pnpm-lock.yaml`; usa pnpm para reproducibilidad.
- Variables de entorno de `.env.example` completadas según el entorno (ver `docs/ENVIRONMENT.md`).

## 2. Comandos

```bash
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm lint
pnpm build
pnpm start
```

- `pnpm dev`: desarrollo con Turbopack.
- `pnpm build`: compilación de producción; genera las fichas estáticas de proyecto.
- `pnpm start`: servidor de producción en el puerto 3000 por defecto.
- `pnpm lint`: ESLint.

No añadas `next export`: la aplicación usa route handlers (`/api/contact`, `/api/rimy/chat`) y necesita un servidor Node.

## 3. Salida del build esperada

```
○ /                      Landing
○ /_not-found
ƒ /api/contact
ƒ /api/rimbot
ƒ /api/rimy/chat
○ /projects
◐ /projects/[slug]
  ├ ○ /projects/rimbill-pro
  ├ ○ /projects/datarim-ai
  └ ○ /projects/novastore-global
```

- Las fichas se generan con `generateStaticParams` a partir de `db/projects.json`.
- Al añadir un proyecto y volver a compilar, su ruta aparece automáticamente.
- Los endpoints son dinámicos (`ƒ`).

## 4. Vercel

1. Importa el repositorio en Vercel.
2. Framework preset: **Next.js**. Build command: `pnpm build`. Install: `pnpm install`.
3. Define las variables de entorno del apartado 6 en *Project Settings → Environment Variables*.
4. Despliega.
5. Verifica:
   - `/` carga y el modo claro/oscuro responde.
   - `/projects` y las tres fichas cargan.
   - `POST /api/rimy/chat` responde en modo local o IA según configuración.
   - `POST /api/contact` responde 503 si faltan variables o envía realmente si están.
6. Añade el dominio real y actualiza `NEXT_PUBLIC_APP_URL`; vuelve a desplegar para regenerar metadata y canonical.

### Limitaciones en Vercel

- **Rate limit en memoria:** cada instancia/serverless function tiene su propio contador. Para un límite fiable entre réplicas, sustituye `src/lib/server/rate-limit.ts` por Redis/Upstash manteniendo la firma `rateLimit(key, limit, windowMs)`.
- **Tiempo de ejecución:** los endpoints usan timeouts de 15 s (contacto) y 20 s (chat). Ajusta el límite de la función si tu plan es más restrictivo.
- **IP del cliente:** `getClientIp` lee `x-forwarded-for`, `x-real-ip` y `cf-connecting-ip`. Detrás de un proxy propio, asegúrate de que reenvíe la IP real.

## 5. Servidor Node propio (VPS, Docker, Render, Railway…)

```bash
pnpm install --frozen-lockfile
pnpm build
NODE_ENV=production pnpm start
```

- Expón el puerto 3000 detrás de un proxy inverso (Nginx, Caddy, Traefik) con HTTPS.
- Usa un gestor de procesos (systemd, PM2 o el del contenedor) para reiniciar ante fallos.
- Sirve archivos estáticos de `public/` directamente desde Next; el proxy solo debe reenviar tráfico al puerto de la app.
- Configura `NEXT_PUBLIC_APP_URL` con la URL pública real.

### Docker (ejemplo orientativo)

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["pnpm", "start"]
```

Ajusta la versión de Node a la que use tu host. El contenedor necesita las variables de entorno en tiempo de ejecución; las `NEXT_PUBLIC_*` se incrustan en el build, así que **deben estar presentes también durante `pnpm build`**.

## 6. Variables por entorno

Mínimo para producción:

```env
NEXT_PUBLIC_APP_URL=https://rimcode.com
```

Recomendado:

```env
NEXT_PUBLIC_CONTACT_EMAIL=contacto@rimcode.com
NEXT_PUBLIC_WHATSAPP_NUMBER=51XXXXXXXXX

AI_API_KEY=...
AI_MODEL=...
AI_BASE_URL=https://api.openai.com/v1

CONTACT_PROVIDER=resend
RESEND_API_KEY=...
CONTACT_EMAIL=contacto@rimcode.com
CONTACT_FROM_EMAIL=RimCode <no-reply@rimcode.com>
```

Notas:

- **`NEXT_PUBLIC_*` se incrusta en el bundle en tiempo de build.** Si cambias una, hay que recompilar y redesplegar.
- Las variables de servidor se leen al arrancar; reinicia el proceso tras cambiarlas.
- No subas `.env.local` ni claves al repositorio.
- Si el formulario y el chat no están configurados, el sitio funciona y lo indica honestamente (503/502 y modo local), pero no podrás recibir consultas ni usar IA.

## 7. Checklist previo a publicar

- [ ] `pnpm exec tsc --noEmit` sin errores.
- [ ] `pnpm lint` sin errores.
- [ ] `pnpm build` correcto y mismas rutas esperadas.
- [ ] `NEXT_PUBLIC_APP_URL` apunta al dominio real (sin barra final).
- [ ] Metadata y canonical correctos en `/`, `/projects` y `/projects/[slug]`.
- [ ] Imágenes de proyectos cargan; el fallback funciona si se rompe una URL.
- [ ] Formulario: envío real probado con el proveedor configurado.
- [ ] Honeypot y validaciones probados; no se declara éxito si el proveedor falla.
- [ ] Chat: modo local o IA probado; rechazo de temas externos.
- [ ] WhatsApp oculto si no hay número real.
- [ ] Modo claro/oscuro y responsive verificados en móvil y escritorio.
- [ ] RIMY no se duplica al navegar entre landing y fichas.
- [ ] TTS: pausa, reanudación, parada y alternativa textual.
- [ ] Sin claves en `NEXT_PUBLIC_*` ni en el repositorio.
- [ ] Rate limit revisado: en multirréplica, migrado a un almacén compartido.

## 8. Verificación posterior

```bash
curl -sI https://tu-dominio.com/
curl -s https://tu-dominio.com/projects
curl -s -X POST https://tu-dominio.com/api/rimy/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"¿Qué servicios ofrecen?"}'
```

- La landing y `/projects` deben devolver 200.
- El chat debe devolver `ok: true` y `mode` coherente con la configuración.
- Si esperas contacto configurado, prueba un envío real y confirma la recepción en la bandeja.
- Revisa logs del servidor para errores `[contact]` o `[rimy-chat]`.

## 9. Rollback

1. Si usas Vercel, promociona el despliegue anterior desde el historial.
2. Si usas un servidor propio, conserva la build anterior y cambia el proceso a esa carpeta; reinicia.
3. Las variables de entorno no se versionan: documenta los cambios para poder revertirlos.

## 10. Contenido y mantenimiento

- Los proyectos, servicios, FAQ y textos se editan en `db/*.json` y requieren nueva build (importación estática).
- Las portadas actuales son SVG abstractos de referencia; sustitúyelas por capturas reales cuando existan.
- Las demos y enlaces de proyecto están desactivados/vacíos hasta disponer de URLs reales.
- Si migras el rate limit a Redis, actualiza `docs/ENVIRONMENT.md` y este documento.
