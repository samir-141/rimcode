# Variables de entorno

Todas las variables se declaran en `.env.example` (versionado). Copia ese archivo a `.env.local` y completa solo lo que vayas a usar. `.env.local` y cualquier otro `.env*` están ignorados por git salvo el ejemplo.

> **Regla de seguridad:** ninguna clave, token o secreto debe llevar el prefijo `NEXT_PUBLIC_`. Ese prefijo expone el valor al navegador. Las claves de IA, correo y webhooks viven solo en el servidor.

## 1. Resumen

| Variable | Público | Obligatoria | Uso |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Sí | Recomendada | URL canónica para metadata, OG, canonical y JSON-LD |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Sí | No | Correo visible; si falta se usa `db/contact.json` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Sí | No | WhatsApp comercial; si falta el canal se oculta |
| `RIMY_INTENT_ENABLED`, `RIMY_INTENT_PORT` | No | Para ONNX | `1` habilita la inferencia en loopback. Puerto por defecto `8820` |
| `RIMY_INTENT_THRESHOLD`, `RIMY_INTENT_THREADS` | No | No | Umbral y número de hilos para el proceso Python |
| `RIMY_LOG_DIR`, `RIMY_LOG_SIGNING_KEY` | No | Para registrar turnos | Directorio absoluto privado y clave de al menos 32 caracteres |
| `CONTACT_PROVIDER` | No | No | `resend` o `webhook`; si falta se autodetecta |
| `RESEND_API_KEY` | No | Para Resend | Clave de Resend |
| `CONTACT_EMAIL` | No | Para Resend | Bandeja que recibe las consultas |
| `CONTACT_FROM_EMAIL` | No | Para Resend | Remitente verificado |
| `CONTACT_WEBHOOK_URL` | No | Para webhook | Endpoint que recibe el JSON del formulario |
| `CONTACT_WEBHOOK_SECRET` | No | No | Se envía como `Authorization: Bearer <secreto>` |
| `NEXT_PUBLIC_RIMY_RIVE_SRC` | Sí | No | Archivo `.riv` opcional para el backend Rive |
| `RIMY_TTS_ENABLED`, `RIMY_TTS_URL` | No | Para TTS | Activación del servicio y URL privada de síntesis |
| `RIMY_TTS_TOKEN`, `RIMY_TTS_SIGNING_KEY` | No | Para TTS | Autenticación del servicio y firma de respuestas |
| `RIMCODE_TRUSTED_IP_HEADER` | No | No | Encabezado de IP que sobrescribe un proxy de confianza |
| `RIMCODE_REDIS_REST_URL`, `RIMCODE_REDIS_REST_TOKEN` | No | Para límites compartidos | URL HTTPS y token Redis REST |

## 2. Sitio

### `NEXT_PUBLIC_APP_URL`

- Formato: URL absoluta sin barra final. Ejemplo: `https://rimcode.com`.
- Se usa como `metadataBase`, canonical, Open Graph y JSON-LD.
- Si falta, se usa `settings.site.defaultUrl` (`http://localhost:3000`). En producción **debes** definirla para evitar canonical y sitemap incorrectos.

### `NEXT_PUBLIC_CONTACT_EMAIL`

- Correo que se muestra en la sección de contacto y en el chat.
- Si falta, se usa el correo definido en `db/contact.json`.
- No es un secreto; puede ser público.

### `NEXT_PUBLIC_WHATSAPP_NUMBER`

- Solo dígitos con código de país. Ejemplo: `51987654321`.
- Si falta, el canal de WhatsApp queda **deshabilitado** y no se muestra el número placeholder.
- No se valida contra WhatsApp; es responsabilidad del negocio.

## 3. Intenciones y registro de Rimy

- El proceso Python carga los archivos ONNX al arrancar. Next.js lo consulta en `127.0.0.1` cuando `RIMY_INTENT_ENABLED=1`. Si no obtiene una respuesta válida en 300 ms, usa las reglas locales.
- Las variables `RIMY_INTENT_THRESHOLD` y `RIMY_INTENT_THREADS` se definen en el entorno del proceso Python. Sus valores por defecto son `0.55` y `2`.
- Define `RIMY_LOG_DIR` fuera de `public/` y `RIMY_LOG_SIGNING_KEY` en Next.js para activar el JSONL. En una instalación con varios procesos, configura la misma clave para correlacionar los eventos que correspondan a un turno.
- Las variables anteriores `RIMY_AI_ENABLED` y `AI_*` quedaron obsoletas. Consulta el [README de intenciones](../services/intent/README.md).

## 4. Contacto

Sin configuración válida el formulario devuelve un mensaje público genérico con código HTTP 503.

### Detección del proveedor

1. Si `CONTACT_PROVIDER=resend` → Resend.
2. Si `CONTACT_PROVIDER=webhook` → webhook.
3. Si no se define: usa Resend cuando existe `RESEND_API_KEY`; si no, webhook cuando existe `CONTACT_WEBHOOK_URL`.
4. `CONTACT_PROVIDER=disabled` desactiva el envío.

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

Para levantar el servicio de voz y configurar secretos, consulta la [arquitectura de voz](../audit/VOICE_ARCHITECTURE.md).

El chat y la ruta de intenciones aplican límites en memoria del proceso. Contacto y voz pueden compartir sus límites entre réplicas con las dos variables Redis REST y un encabezado de IP sobrescrito por tu proxy.

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
- El formulario de contacto responde HTTP 503 hasta configurar su proveedor.

### Producción recomendada

```env
NEXT_PUBLIC_APP_URL=https://rimcode.com
NEXT_PUBLIC_CONTACT_EMAIL=contacto@rimcode.com
NEXT_PUBLIC_WHATSAPP_NUMBER=51XXXXXXXXX

RIMY_INTENT_ENABLED=1
RIMY_INTENT_PORT=8820

CONTACT_PROVIDER=resend
RESEND_API_KEY=...
CONTACT_EMAIL=contacto@rimcode.com
CONTACT_FROM_EMAIL=RimCode <no-reply@rimcode.com>
```

## 7. Diagnóstico

| Síntoma | Causa probable |
| --- | --- |
| El chat reporta `intentSource: reglas` | Proceso ONNX desactivado, ocupado o no disponible |
| El formulario devuelve 503 | Configuración incompleta, envío desactivado o límite compartido no disponible |
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
