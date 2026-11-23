# Comparación de voz para Rimy

## Candidatos

| Modelo | Español y voz | Infraestructura y mantenimiento | Distribución |
| --- | --- | --- | --- |
| Qwen3-TTS 1.7B VoiceDesign | Español admitido. Acepta una descripción del timbre, el acento y la prosodia. Se usó la descripción juvenil, cálida y profesional solicitada. | El archivo principal publicado pesa 3,83 GB, antes de tokenizador, entorno y memoria de ejecución. Probar GPU dedicada y consistencia entre frases. Proyecto oficial con paquete Python, tarjetas y demo. | Apache 2.0. |
| Qwen3-TTS 0.6B CustomVoice | Español admitido con voces predefinidas. La prueba usó Ryan. La tarjeta documenta su voz nativa en inglés y no lista un hablante nativo de español entre los predefinidos. | Archivo principal de 1,81 GB. Es candidato a menor coste de inferencia, a medir con la misma GPU y corpus. Comparte el ecosistema del modelo de diseño. | Apache 2.0. |
| Kokoro-82M | El perfil `ef_dora` ofrece español con una voz fija. Se probó en CPU. El frontend fonético usa eSpeak para español y requiere revisar nombres, siglas, puntuación y acento latinoamericano con oyentes. | Menor modelo, despliegue ligero comparado con los pesos Qwen. Dependencia adicional de fonetización y entorno PyTorch. Cuenta con catálogo de voces y documentación del autor. | Apache 2.0 para los pesos publicados. |
| Web Speech del navegador | Disponibilidad, acento y naturalidad dependen del navegador y sistema. El saludo previo es un WAV de voz fija. | Sin infraestructura de síntesis para RimCode. El sitio conserva el texto y puede usar la voz disponible en el dispositivo. | Rigen los términos de la voz instalada o del navegador. |

Fuentes de capacidades, licencias y voces. [Qwen VoiceDesign](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign), [Qwen CustomVoice](https://huggingface.co/Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice), [Kokoro](https://huggingface.co/hexgrad/Kokoro-82M), [voces Kokoro](https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md).

## Piloto

En la demo oficial, Qwen VoiceDesign y CustomVoice produjeron audio para la misma pregunta sobre inventario en español. El tiempo total de la petición remota, incluida la cola de la demo, fue de 9,76 s y 12,58 s respectivamente. Esta observación comprueba síntesis y disponibilidad en esa demo. La latencia del alojamiento se mide en el hardware objetivo. [Demo oficial de Qwen](https://huggingface.co/spaces/Qwen/Qwen3-TTS).

Los tres modelos se evaluaron localmente con las mismas 20 frases, con 20 WAV válidos por modelo. El corpus incluye nombres, cifras, SEO, ERP, API REST, PostgreSQL y preguntas comerciales. Las medianas de síntesis y descarga fueron 1,79 s con Kokoro en CPU, 14,51 s con VoiceDesign y 15,25 s con CustomVoice en la GPU disponible. CustomVoice ocupó menos memoria de GPU que VoiceDesign en las lecturas realizadas. Kokoro es el candidato para un piloto interactivo en este entorno. VoiceDesign permite explorar la identidad vocal desde una descripción. [Resultados de rendimiento](./PERFORMANCE_RESULTS.md).

Para fijar la identidad vocal falta una escucha humana con varios oyentes y una rúbrica de pronunciación, acento, naturalidad, pausas y consistencia. Si el timbre de VoiceDesign cambia demasiado entre frases, se puede evaluar una referencia sintetizada por RimCode para un perfil propio. La prueba no usó voces de terceros como referencia.
