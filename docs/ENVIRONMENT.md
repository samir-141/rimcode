# Variables de entorno

Todas las variables se declaran en `.env.example` (versionado). Copia ese archivo a `.env.local` y completa solo lo que vayas a usar. `.env.local` y cualquier otro `.env*` están ignorados por git salvo el ejemplo.

> **Regla de seguridad:** ninguna clave, token o secreto debe llevar el prefijo `NEXT_PUBLIC_`. Ese prefijo expone el valor al navegador. Las claves de IA, correo y webhooks viven solo en el servidor.

## 1. Resumen

| Variable | Público | Obligatoria | Uso |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Sí | Recomendada | URL canónica para metadata, OG, canonical y JSON-LD |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Sí | No | Correo visible; si falta se usa `db/contact.json` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Sí | No | WhatsApp comercial; si falta el canal se oculta |
| `AI_API_KEY` | No | No | Clave del proveedor de IA |
| `AI_MODEL` | No | No | Modelo de chat a usar |
| `AI_BASE_URL` | No | No | Endpoint compatible con OpenAI; por defecto `https://api.openai.com/v1` |
| `CONTACT_PROVIDER` | No | No | `resend` o `webhook`; si falta se autodetecta |
| `RESEND_API_KEY` | No | Para Resend | Clave de Resend |
| `CONTACT_EMAIL` | No | Para Resend | Bandeja que recibe las consultas |
| `CONTACT_FROM_EMAIL` | No | Para Resend | Remitente verificado |
| `CONTACT_WEBHOOK_URL` | No | Para webhook | Endpoint que recibe el JSON del formulario |
| `CONTACT_WEBHOOK_SECRET` | No | No | Se envía como `Authorization: Bearer <secreto>` |
| `NEXT_PUBLIC_RIMY_RIVE_SRC` | Sí | No | Archivo `.riv` opcional para el backend Rive |

## 2. Sitio

### `NEXT_PUBLIC_APP_URL`

- Formato: URL absoluta sin barra final. Ejemplo: `https://rimcode.com`.
- Se usa como `metadataBase`, canonical, Open Graph y JSON-LD.
- Si falta, se usa `settings.site.defaultUrl` (`http://localhost:3000`). En producción **debes** definirla para evitar canonical y sitemap incorrectos.

### `NEXT_PUBLIC_CONTACT_EMAIL`

- Correo que se muestra en la sección de contacto y en el chat.
- Si falta, se usa `contacto@rimcode.com` de `db/contact.json`.
- No es un secreto; puede ser público.

### `NEXT_PUBLIC_WHATSAPP_NUMBER`

- Solo dígitos con código de país. Ejemplo: `51987654321`.
- Si falta, el canal de WhatsApp queda **deshabilitado** y no se muestra el número placeholder.
- No se valida contra WhatsApp; es responsabilidad del negocio.

## 3. Chat con IA

Sin `AI_API_KEY` y `AI_MODEL`, el chat usa el **motor local documentado** sobre `db/*.json` y lo indica en la interfaz. No se simula una conexión.

### `AI_API_KEY` y `AI_MODEL`

- Deben definirse **ambas** para activar el modo IA.
- `AI_MODEL` es el identificador exacto del proveedor (por ejemplo, el nombre de modelo que ofrece tu API compatible).
- Si una falta, el chat sigue en modo local.

### `AI_BASE_URL`

- Endpoint compatible con OpenAI Chat Completions.
- Debe incluir la versión si el proveedor la requiere; por ejemplo `https://api.openai.com/v1`.
- El código añade `/chat/completions` y elimina una barra final.

### Comportamiento ante fallos

- Error del proveedor, timeout (20 s) o respuesta vacía → **502**.
- No hay fallback a una respuesta inventada.
- En desarrollo se devuelve `detail`; en producción se omite.

## 4. Contacto

El formulario **no simula éxito**. Sin configuración válida responde **503** e indica las variables que faltan.

### Detección del proveedor

1. Si `CONTACT_PROVIDER=resend` → Resend.
2. Si `CONTACT_PROVIDER=webhook` → webhook.
3. Si no se define: usa Resend cuando existe `RESEND_API_KEY`; si no, webhook cuando existe `CONTACT_WEBHOOK_URL`.
4. Si no hay ninguno → 503 con variables requeridas.

### Opción A · Resend

```env
CONTACT_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxx
CONTACT_EMAIL=ventas@tudominio.com
CONTACT_FROM_EMAIL=RimCode <no-reply@tudominio.com>
```

- `CONTACT_FROM_EMAIL` debe ser un remitente verificado en Resend.
- Se envía HTML y texto plano; `reply_to` es el correo del visitante.
- Si Resend falla → 502; no se declara éxito.

### Opción B · Webhook

```env
CONTACT_PROVIDER=webhook
CONTACT_WEBHOOK_URL=https://tu-automatizacion.example/hook
CONTACT_WEBHOOK_SECRET=un-secreto-largo
```

Payload enviado:

```json
{
  "source": "rimcode-contact-form",
  "submittedAt": "2026-11-09T12:00:00.000Z",
  "name": "...",
  "email": "...",
  "company": "...",
  "service": "...",
  "subject": "...",
  "message": "..."
}
```

- El webhook debe responder 2xx; cualquier otro código se trata como fallo (502).
- Si defines secreto, se envía `Authorization: Bearer <secreto>`.
- El endpoint debe usar HTTPS en producción.

### Validación y anti-spam

- Honeypot `website`: si llega relleno se responde `ok: true` sin enviar (falso positivo deliberado para bots).
- Tiempo mínimo de relleno: `settings.contact.minimumFillTimeMs` (2.5 s).
- Tiempo máximo: `settings.contact.maximumFillTimeMs` (2 h).
- Rate limit: `settings.contact.rateLimitPerHour` (5 por hora e IP).
- Mensaje mínimo: 10 caracteres; máximo: 5000.
- Servicio validado contra `db/services.json`.
- El correo se valida en cliente y servidor.

## 5. RIMY

### `NEXT_PUBLIC_RIMY_RIVE_SRC`

- Opcional. Ruta pública a un `.riv` con la State Machine `RimyMachine`.
- Si falta, se usa el rig SVG local.
- El `.riv` del repositorio no está documentado con esa State Machine; no se asume que funcione.
- Si Rive falla, se vuelve al SVG.

## 6. Ejemplo mínimo

### Desarrollo sin proveedores

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Resultado:

- Web completa.
- Chat en modo local documentado.
- Formulario de contacto responde 503 con variables faltantes (comportamiento honesto).

### Producción recomendada

```env
NEXT_PUBLIC_APP_URL=https://rimcode.com
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

## 7. Diagnóstico

| Síntoma | Causa probable |
| --- | --- |
| El chat dice “Modo local documentado” | Faltan `AI_API_KEY` o `AI_MODEL` |
| El chat devuelve 502 | Clave/modelo inválido, cuota agotada o timeout |
| El formulario devuelve 503 | Faltan variables del proveedor; revisa `missing` en la respuesta |
| El formulario devuelve 502 | El proveedor rechazó el envío; revisa logs del servidor |
| WhatsApp no aparece | Falta `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| Canonical apunta a localhost | Falta `NEXT_PUBLIC_APP_URL` en producción |
| Las variables nuevas no surten efecto | Reinicia el servidor; las variables de servidor se leen al arrancar |

## 8. Comprobación rápida

```powershell
# Chat en modo local
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/rimy/chat `
  -ContentType "application/json" `
  -Body '{"message":"¿Qué servicios ofrecen?"}'

# Contacto sin configuración (esperado 503 con "missing")
try {
  Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/contact `
    -ContentType "application/json" `
    -Body '{"name":"Prueba","email":"prueba@example.com","subject":"Prueba","message":"Mensaje de prueba suficientemente largo","startedAt":0}'
} catch {
  $_.ErrorDetails.Message
}
```

En PowerShell, `Invoke-RestMethod` lanza excepción en respuestas 4xx/5xx; el cuerpo del error está en `$_.ErrorDetails.Message`.
