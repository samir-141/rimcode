# Intenciones locales de Rimy

Rimy clasifica consultas en CPU y responde desde el catálogo de RimCode. Next.js consulta el proceso Python en 127.0.0.1. El modelo devuelve etiquetas y probabilidades. El enrutador de Next.js selecciona la plantilla, conserva el estado y construye los botones con rutas públicas o canales del catálogo.

## Archivos

| Ruta | Contenido |
| --- | --- |
| `examples.txt`, `dataset.py`, `intents.jsonl` | Corpus fuente, generador y 509 consultas de entrenamiento y validación |
| `challenge.txt`, `challenge.jsonl` | 15 variantes adicionales por intención, 135 en total |
| `prepare_model.py` | Instala el encoder preentrenado int8 y el tokenizer. Comprueba SHA-256 |
| `train.py`, `metrics.json` | Entrenamiento, calibración, exportación y métricas |
| `model/` | Encoder y cabezas ONNX int8, tokenizer, etiquetas y pesos léxicos |
| `classifier.py`, `server.py` | Inferencia CPU y servicio privado HTTP |
| `test_intent.py`, `../../qa/rimcode-api.test.mjs` | Pruebas del modelo, del contrato y del diálogo integrado |
| `export_low_confidence.py` | Exportación de consultas de baja confianza para revisión y etiquetado |
| `../../src/lib/rimy/dialogue.ts`, `commercial.ts` en el mismo directorio | Enrutador, plantillas, acciones y catálogo |

## Despliegue en una VPS

Requisitos del proceso de intenciones. Python 3.12, CPU x86-64 con AVX2 y acceso de escritura al directorio del modelo durante la preparación. El encoder es [paraphrase-multilingual-MiniLM-L12-v2](https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2) de Sentence Transformers, Apache 2.0, con su exportación `model_quint8_avx2.onnx` fijada por revisión. El encoder y el tokenizer se descargan una vez para cada instalación. Git versiona la cabeza cuantizada, las etiquetas y los pesos léxicos. Si la VPS no tiene acceso a Internet, copia los archivos ya preparados de `model/`.

Desde la raíz del repositorio, crea un entorno Python e instala producción. Estos comandos usan una shell POSIX. En Windows, sustituye `source …/bin/activate` por `services/intent/.venv/Scripts/Activate.ps1`. También puedes invocar directamente el ejecutable Python del entorno.

```sh
python -m venv services/intent/.venv
source services/intent/.venv/bin/activate
python -m pip install -r services/intent/requirements.txt
python services/intent/prepare_model.py
python -u services/intent/server.py
```

Ejecuta `server.py` como proceso persistente, por ejemplo bajo `systemd`, con reinicio tras fallo y un usuario de servicio. El servicio escucha solo en loopback. Configura el mismo puerto en ambos procesos. `RIMY_INTENT_PORT` vale `8820` por defecto, `RIMY_INTENT_THREADS` vale `2` y `RIMY_INTENT_THRESHOLD` vale `0.55`. Estas dos últimas variables se leen al arrancar Python. Las dependencias de producción excluyen PyTorch, FastAPI y scikit-learn.

En el entorno de Next.js configura lo siguiente y reinicia el proceso web.

```env
RIMY_INTENT_ENABLED=1
RIMY_INTENT_PORT=8820
```

Comprueba `GET http://127.0.0.1:8820/health`. En el chat web, `intentSource: "onnx"` confirma que Next.js usa el modelo. Si el proceso no está disponible, el chat continúa con reglas locales y reporta `intentSource: "reglas"`. Aloja ambos procesos en el mismo espacio de red. El arranque y las consultas usan archivos locales ya preparados.

## Contrato HTTP

`POST /intent` está disponible en Next.js y en el servicio local. Envía `mensaje` de 2 a 600 caracteres, hasta seis turnos opcionales de historial y `estado` opcional. El estado que devuelve `/api/rimy/chat` puede reenviarse al clasificador.

```json
{
  "mensaje": "¿Cómo hago una reserva?",
  "historial_reciente": [{"rol": "usuario", "contenido": "hola"}],
  "estado": {"ya_se_presento": true}
}
```

La respuesta contiene cuatro campos. `confianza` es un número entre 0 y 1. `pregunta_aclaracion` es `null` cuando la clasificación permite seguir. El clasificador siempre pide aclaración ante `ambiguo_reserva`. Ante baja confianza ofrece las acciones generales. Los seguimientos que el estado resuelve de forma determinista tienen confianza 1.

```json
{
  "intencion": "ambiguo_reserva",
  "confianza": 0.99,
  "necesita_aclaracion": true,
  "pregunta_aclaracion": "¿Quieres agendar una reunión o solicitar una cotización?"
}
```

El widget conserva `ya_se_presento`, `ultima_intencion`, `landing_elegida` y `flujo_activo` durante la sesión del chat. También mantiene la última opción de la aclaración de reserva para interpretar «¿y el otro?». El flujo anterior se descarta al cambiar de tema. La landing elegida puede recuperarse en la siguiente cotización.

El precio de hosting se lee de `db/services.json`. Los importes de la landing usan el mismo catálogo que el simulador. Los canales vienen de `db/contact.json` y de la configuración comercial que usa el sitio. **`[COMPLETAR]` enlace de agenda de RimCode.** Por ahora la acción de reunión abre el formulario y el equipo confirma la cita. Las referencias de precios faltantes se muestran como `[COMPLETAR]` o quedan sujetas a evaluación cuando así las define el comercio.

## Entrenamiento y exportación

```sh
python -m pip install -r services/intent/requirements-train.txt
python services/intent/prepare_model.py
python services/intent/dataset.py
python services/intent/train.py --cpu 'Modelo de CPU de tu equipo'
python services/intent/test_intent.py -v
```

El generador mantiene un 20 % de validación estratificada por intención en el corpus inicial. Las 135 variantes adicionales quedan fuera del ajuste. Las etiquetas se derivan del corpus. Para agregar una intención, incorpora bloques con ejemplos de entrenamiento y validación en `examples.txt`, añade sus casos de prueba y define una plantilla en `dialogue.ts` cuando deba tener una acción propia.

`train.py` compara TF‑IDF de caracteres con regresión logística, MiniLM con regresión logística y el modelo híbrido de producción. Este último concatena el embedding con los rasgos de caracteres para manejar abreviaturas y errores de escritura. La ponderación léxica y la temperatura se eligen con predicciones fuera de pliegue dentro del entrenamiento. La exportación conserva `Softmax` en ONNX, usa pesos int8 y comprueba la equivalencia de los rasgos léxicos entre entrenamiento e inferencia. El script falla si el modelo híbrido baja de 90 % de exactitud en validación o si su p95 alcanza 100 ms en la CPU de prueba.

## Resultados

| Modelo | Validación, 102 consultas | Reto, 135 variantes |
| --- | ---: | ---: |
| TF‑IDF + regresión logística | 86,27 % | 90,37 % |
| MiniLM int8 + regresión logística | 90,20 % | 85,19 % |
| MiniLM + TF‑IDF con regresión logística int8 | **94,12 %** | **93,33 %** |

En un Intel Core i5-13420H con dos hilos ONNX, el modelo híbrido registró 14,28 ms de mediana, 22,50 ms en p95 y 137,76 ms de máximo en 102 mediciones. El encoder ocupa 118,45 MB, la cabeza de clasificación 27,66 kB y el conjunto de archivos necesarios para ejecutar el modelo híbrido 127,64 MB. La latencia se midió con el modelo cargado y entradas individuales, igual que en el servicio. Los juegos son ejemplos redactados en español peruano y neutro. La exactitud en tráfico real queda por medir.

[Métricas completas](metrics.json) contiene exactitud, log loss, F1 por clase y las matrices de confusión con filas reales y columnas predichas. El orden de las etiquetas está en `clases`. Los errores indican el índice en cada conjunto evaluado.

## Registro y revisión

Para guardar turnos, define `RIMY_LOG_DIR` con un directorio absoluto privado y `RIMY_LOG_SIGNING_KEY` con un secreto de 32 caracteres o más en Next.js. Configura permisos de lectura y retención en la VPS. El registro genera `turnos-AAAA-MM-DD.jsonl`. Cada turno guarda texto con correos y números largos ocultos, decisión, respuesta y botones. Las acciones quedan en filas con el mismo identificador de turno. El simulador registra su apertura cuando entra en el área visible. El formulario registra un contacto cuando se confirma el envío, sin copiar los datos del formulario al registro de Rimy. Para WhatsApp se registra el clic.

```sh
python services/intent/export_low_confidence.py /ruta/privada/rimy /ruta/de/revision/baja-confianza.jsonl --threshold 0.55
python services/intent/dataset.py --extra /ruta/de/revision/ejemplos-revisados.jsonl
python services/intent/train.py
```

Antes de ampliar el corpus, revisa las consultas exportadas, elimina cualquier dato personal y completa `intencion` con una etiqueta aprobada. Los registros exportados pasan a entrenamiento tras revisión humana. Para verificar la integración, arranca el servicio, compila con `pnpm build` y ejecuta `pnpm test` con `RIMY_TEST_INTENT_PORT=8820`.
