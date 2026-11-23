# Resultados de rendimiento y voz

Las mediciones locales se hicieron con un Intel Core i5-13420H y una RTX 3050 Laptop de 6 GiB. Kokoro corrió en CPU con PyTorch 2.8.0+cpu y cuatro hilos declarados. Las mediciones de un despliegue remoto dependerán de sus recursos y red.

## Comparación inicial

| Indicador | Antes | Después |
| --- | --- | --- |
| JavaScript de la landing en Chrome | 199 331 bytes codificados después del arranque | 198 404 a 198 890 bytes en la matriz final, medidos con `encodedBodySize`. |
| Solicitud del saludo WAV | El archivo de 99 274 bytes se solicitaba automáticamente a las cinco anchuras iniciales | Ausente antes de que el visitante solicite audio. |
| Tasas de moneda | Header y simulador obtenían las tasas por separado | Un store y una petición inicial comprobada con respuesta controlada. |
| Voz | Saludo WAV y Web Speech según dispositivo | Síntesis opcional, sin pesos ni solicitudes de voz en la carga inicial. |

La línea base resolvía el chat desde el navegador. El flujo nuevo añade la latencia de una solicitud y muestra la respuesta completa al recibirla. La síntesis anterior usaba el navegador, por lo que no hay un tiempo de inferencia de servidor comparable.

## Chat, audio y sincronización

En una pasada de API se observó respuesta de chat local en 15,4 ms. Con un doble de voz que espera 40 ms, se observaron 61,5 ms hasta encabezados y 62,6 ms hasta completar el WAV. Estas cifras verifican orquestación. En un ensayo Chrome con Next y Kokoro real, el texto completo de almacén apareció en 325 ms y el audio empezó en 12,60 s en la primera solicitud. Se observó amplitud en la mascota y detención desde su control. Con el resultado en caché, el gateway entregó encabezados en 26,0 ms y el WAV completo en 34,3 ms.

## Kokoro-82M, 20 frases

El servicio se precargó y después se hizo una primera síntesis y una repetición con caché para cada frase. Los WAV tenían cabecera RIFF/WAVE y señal válida. Las muestras duraron 3,33 a 5,40 s. Se observaron 1 329 MiB residentes, pico de 1 409 MiB y 119,5 s acumulados de CPU, incluyendo calentamiento y síntesis. La precarga duró 17,5 s con activos mayormente en caché de disco y red para descargar la voz.

| Escenario | Éxitos | Primeros encabezados p50 / p95 | WAV completo p50 / p95 |
| --- | ---: | ---: | ---: |
| Primera síntesis, CPU local | 20/20 | 1 789,3 / 2 178,7 ms | 1 790,5 / 2 179,6 ms |
| Repetición desde caché | 20/20 | 2,3 / 3,9 ms | 3,5 / 5,7 ms |

El servicio entrega el WAV después de sintetizar los segmentos. Se verificó `--warm-faq` con una respuesta del corpus y un arranque independiente. El WAV precargado de 734 924 bytes se completó en 9,7 ms por loopback en su primera solicitud HTTP. La validación de pronunciación y naturalidad requiere oyentes humanos. [Corpus](../qa/voice-sentences.json) y [script de voz](../qa/voice-bench.mjs).

## Qwen local

El banco usó la RTX 3050 Laptop, PyTorch y TorchAudio 2.8.0+cu128 y los pesos oficiales descargados antes de activar el modo sin red. VoiceDesign se precargó en 21,3 s y CustomVoice en 81,7 s. Las lecturas de GPU indicaron 4 803 MiB ocupados con VoiceDesign y 3 321 MiB con CustomVoice, incluido el sistema. La ejecución usó la ruta estándar de PyTorch, con FlashAttention ausente en este entorno.

| Modelo y escenario | Éxitos | Primeros encabezados p50 / p95 | WAV completo p50 / p95 |
| --- | ---: | ---: | ---: |
| VoiceDesign 1.7B, primera síntesis | 20/20 | 14 512,3 / 19 798,2 ms | 14 513,4 / 19 799,6 ms |
| VoiceDesign 1.7B, repetición | 20/20 | 3,9 / 6,4 ms | 5,7 / 13,8 ms |
| CustomVoice 0.6B, primera síntesis | 20/20 | 15 231,2 / 23 643,3 ms | 15 246,5 / 23 644,9 ms |
| CustomVoice 0.6B, repetición | 20/20 | 3,5 / 9,2 ms | 5,2 / 21,6 ms |

Una frase de VoiceDesign llegó a 23,93 s en el servicio local y una de CustomVoice a 29,57 s. El gateway web tiene un límite de 25 s. Para tráfico interactivo con Qwen, las respuestas largas requieren precarga, infraestructura más rápida o entrega progresiva.

## Qwen oficial

Sobre una pregunta en español la demo produjo audio para VoiceDesign y para CustomVoice. Los tiempos totales fueron 9,76 s y 12,58 s, incluida la cola de la demo. Un entorno controlado permite comparar latencia y consumo de inferencia entre modelos. [Demo oficial](https://huggingface.co/spaces/Qwen/Qwen3-TTS).
