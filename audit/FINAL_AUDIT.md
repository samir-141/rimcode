# Auditoría final de RimCode

La evolución conserva Next.js App Router, los seis bloques de la landing, el portafolio de siete fichas, las páginas legales, el color de marca y la mascota. La evidencia corresponde al entorno local.

## Implementado y probado

- Catálogo para profesionales, negocios, pymes, empresas con procesos complejos, instituciones educativas y otras organizaciones. Simulación con reglas centralizadas y solicitud de cotización en el formulario. Las referencias separan desarrollo y gastos recurrentes. ERP, SaaS y otros proyectos con alcance abierto pasan a evaluación.
- Cabeceras y CSP, control de enlaces, JSON-LD escapado, APIs con validación y lectura acotada, límites e idempotencia de contacto en pruebas. Las rutas de chat comparten el motor. Una ficha inexistente devuelve HTTP 404.
- Rimy usa respuestas del corpus y, si se configura, un clasificador que elige respuestas autorizadas. Se probaron modo local, selección asistida, respuesta inválida y fallo del proveedor con un doble.
- Voz con autorización acotada, cancelación y control de reproducción. Kokoro, Qwen VoiceDesign y Qwen CustomVoice sintetizaron las mismas 20 frases por modelo en local. Kokoro se reprodujo desde Next con amplitud verificada. Los dos modelos Qwen también produjeron muestras en la demo oficial. El widget se mantiene usable en texto sin servicio de voz.
- Chrome y Firefox pasaron los seis tamaños de la matriz. Las vistas comprobadas con axe tuvieron cero incidencias automáticas. Se verificaron el scroll independiente del chat, cotizaciones antiguas, el foco al navegar desde el simulador, el dictado con un doble y la detención de audio al cambiar de ruta.
- El build y la suite HTTP recorren landing, índice, fichas, legales, robots, sitemap, verificación pública y 404. La auditoría de dependencias pnpm quedó sin avisos.

## Implementado pendiente de validación

- Validar IA con el proveedor y modelo de producción, Rive con un archivo que tenga la máquina documentada y dictado con equipos y permisos reales.
- Verificar el despliegue bajo HTTPS, renovación de consentimiento, disponibilidad del proveedor de voz y límites compartidos en varias réplicas.
- Evaluar naturalidad, pronunciación, acento y consistencia mediante escucha humana. Completar las pruebas con lectores de pantalla y dispositivos físicos.

## Propuesta

- Comparar variantes vocales Qwen en el hardware objetivo antes de fijar la voz. Evaluar entrega progresiva y visemas si la latencia de respuestas largas supera el objetivo del servicio.
- Evaluar el coste para el prerenderizado si se requiere CSP estricta por nonce.

## Bloqueado por infraestructura o credenciales

- Resend y Analytics reales, Redis REST compartido y operación multirréplica requieren configuración y cuentas del despliegue. La clasificación y el correo se probaron con dobles locales. El trabajo corresponde al repositorio y a servidores de prueba locales.

## Evidencias

[Auditoría inicial](./INITIAL_AUDIT.md) · [Seguridad](./SECURITY_REPORT.md) · [Interfaz](./UX_RESPONSIVE_REPORT.md) · [Motor de respuestas](./RIMY_AI_ANALYSIS.md) · [Comparación de TTS](./TTS_MODEL_COMPARISON.md) · [Arquitectura de voz](./VOICE_ARCHITECTURE.md) · [Rendimiento](./PERFORMANCE_RESULTS.md).
