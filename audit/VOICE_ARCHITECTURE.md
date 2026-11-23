# Arquitectura de voz de Rimy

```text
Chat de Next.js → chat/FAQ autorizada → texto + autorización temporal
     ↓ reproducción explícita o activada por el visitante
POST /api/rimy/voice → verificación + cuota → servicio privado Python
     ↑ WAV validado                     ← modelo precargado + caché
Reproducción y subtítulos → estado de Rimy → amplitud del audio en SVG
```

El chat muestra el texto de inmediato. El visitante puede escuchar una respuesta, volver a escuchar, pausar, continuar, ajustar el volumen o detener. «Reproducir respuestas» empieza desactivado en cada visita. El saludo, las respuestas y las explicaciones de proyectos usan el mismo perfil cuando se activa el servicio. Si el servicio está desactivado, comparten la voz del navegador. Un fallo de síntesis conserva el texto y el chat permite cambiar explícitamente la voz del resto de la sesión.

El orquestador entrega una autorización firmada válida durante 30 minutos para el texto canónico de una respuesta. `/api/rimy/voice` verifica contenido, firma y límite. Mantiene el token del servicio en el servidor y solo acepta la URL configurada con HTTPS o HTTP en loopback. El navegador cancela solicitudes activas al detener, minimizar, enviar un nuevo mensaje o cambiar de ruta. El servicio detecta desconexiones entre segmentos según se las propague el proxy. Una llamada a inferencia que ya entró al modelo termina su segmento.

El servicio Python carga un solo modelo y realiza una síntesis de arranque. Usa una generación simultánea por proceso, límites de tamaño y caché LRU de hasta 32 MiB para respuestas públicas. La clave incorpora motor, voz, versión de perfil y texto. El perfil se puede cambiar con `RIMY_TTS_PROFILE_VERSION`. Con el transporte actual, la API devuelve un WAV completo tras ensamblar segmentos con pausas. Streaming de primer segmento y visemas quedan como evolución tras medir el piloto.

La mascota es una instancia de layout. La animación de habla sigue la reproducción real. Con Web Audio/SVG y movimiento habilitado, la boca sigue la amplitud y la cabeza tiene un movimiento moderado. Web Speech y Rive opcional usan el estado de habla. El chat expone estados de búsqueda, escucha, explicación, silencio, error y desconexión. El dictado usa el reconocimiento que ofrezca el navegador y rellena el campo para revisión. El visitante controla cuándo enviar ese texto.

## Arranque local

1. Crea un entorno Python 3.12. Para Kokoro instala PyTorch para tu CPU/GPU, eSpeak NG según tu sistema y `pip install -r services/tts/requirements-kokoro.txt`. Para Qwen instala PyTorch y TorchAudio de la misma versión, una rueda CUDA compatible, SoX según tu sistema y `pip install -r services/tts/requirements-qwen.txt`. Usa entornos separados. [Qwen3-TTS](https://github.com/QwenLM/Qwen3-TTS), [Kokoro](https://github.com/hexgrad/kokoro).
2. Configura en ambos procesos el mismo `RIMY_TTS_TOKEN` aleatorio, de al menos 24 caracteres. Ejecuta `python services/tts/server.py --engine qwen-design --device cuda:0` para VoiceDesign, `--engine qwen-custom --device cuda:0` para el modelo de 0.6B, o `--engine kokoro --device cpu` para Kokoro. Espera el mensaje de precarga antes de usar el endpoint.
3. En el proceso Next, configura `RIMY_TTS_ENABLED=1`, `RIMY_TTS_URL=http://127.0.0.1:8810/synthesize` y `RIMY_TTS_SIGNING_KEY` aleatoria e independiente del token, de al menos 32 caracteres. Mantén estas variables fuera del bundle público.
4. Ejecuta `pnpm bench:voice` con el token y URL del servicio para comparar las 20 frases del corpus. Define `RIMY_BENCH_SAMPLES` para conservar WAVs de la primera pasada. El script mide obtención de encabezados y descarga completa. `--warm-faq db/faq/comercial.json` precarga respuestas públicas frecuentes antes de aceptar tráfico. `RIMY_QWEN_STYLE` permite comparar descripciones de VoiceDesign.

## Alojamiento

Next puede continuar en Vercel o Node. La inferencia debe vivir en un proceso dedicado con capacidad medida y acceso privado o tras un proxy autenticado HTTPS. Para GPU, valida disponibilidad de calentamiento, memoria y tiempos de espera antes de activar tráfico. Kokoro tiene un candidato de piloto en CPU. Qwen VoiceDesign es el candidato de identidad vocal. Prepara el audio de frases frecuentes con las mismas respuestas autorizadas para aprovechar la caché y vuelve a medir si cambias el perfil. Usa el contador compartido en un despliegue con réplicas y evita multiplicar la concurrencia de síntesis sin medir recursos.
