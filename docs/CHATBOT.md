# Chat de Rimy

El widget envía cada pregunta a `POST /api/rimy/chat`. El clasificador ONNX local devuelve una intención y una confianza calibrada. El enrutador usa el estado del chat, el catálogo y las FAQ para construir la respuesta y sus acciones. Conserva las opciones de dominio, hosting y publicación de una landing y el proyecto al que se refieren preguntas breves sobre tecnología, funciones o demo.

## Contrato de API

Envía JSON con `message` y, opcionalmente, `currency` (`PEN`, `USD` o `EUR`), `context`, `estado` e `historial_reciente`. Una respuesta válida devuelve `ok`, `mode` (`local`), `modeLabel`, `reply`, `suggestions`, `matched`, `inScope`, `intent`, `intentSource` y el nuevo `estado`. Según la consulta puede incluir `category`, `table`, `actions`, `context`, `voiceGrant` o `turnGrant`.

`POST /intent` expone solo la decisión del clasificador. El [README de intenciones](../services/intent/README.md) documenta el contrato, el umbral, las métricas y la puesta en marcha del modelo.

`POST /api/rimbot` conserva la forma compatible con `success`, `reply`, `emotion`, `suggestions` y `timestamp`. El widget usa la ruta moderna. Ambas rutas comparten validación, cupos y contenido.

## Operación

- Edita contenido en `db/faq/`, portafolio en `db/projects.json` y copy de UI en `db/rimy.json`. `db/services.json` alimenta simulador, cotización, contacto y tablas del chat.
- Define `RIMY_INTENT_ENABLED=1` y arranca el servicio de intenciones en la misma máquina. Si el servicio está desactivado, ocupado o no disponible, Next.js usa reglas locales. El estado de la conversación vive en el widget. El registro JSONL es configurable de forma independiente.
- El chat protege longitud, tipo y origen de la solicitud y aplica cupos en memoria del proceso. Usa `RIMCODE_TRUSTED_IP_HEADER` solo con un proxy que sobrescriba ese encabezado. Consulta las condiciones de despliegue en la [guía de entorno](./ENVIRONMENT.md).
- Para voz, controles, caché y servicio Python consulta la [arquitectura de voz](../audit/VOICE_ARCHITECTURE.md).

Ejecuta `pnpm build`, `pnpm test` y `pnpm test:browser` para validar los cambios de contenido y flujo. Las [métricas reproducibles](../services/intent/metrics.json) recogen los resultados del clasificador.
