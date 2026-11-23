# Motor de respuestas de Rimy

El [módulo de intenciones ONNX](../services/intent/README.md) reemplazó la clasificación externa que describe esta auditoría histórica.

## Base inicial

El widget ejecutaba `answerLocally` en el navegador. Este motor quitaba acentos, normalizaba, tokenizaba, excluía palabras comunes, expandía sinónimos mediante grupos manuales y ponderaba coincidencias de preguntas, variantes, palabras clave y nombres de proyectos. Los saludos, agradecimientos y consultas fuera de alcance tenían reglas. Las tablas se construían desde JSON institucional. El handler `/api/rimy/chat` aplicaba algunas validaciones y respondía solo en modo local. `/api/rimbot` mantenía otro algoritmo y otro corpus. El adaptador de IA devolvía texto local aunque la documentación sugería otra cosa.

## Flujo actual

1. El cliente envía una consulta y la moneda. El servidor limita bytes, caracteres y ritmo de solicitudes. La conversación sí se muestra durante la navegación local, en memoria del navegador.
2. Se normalizan y deduplican términos. La búsqueda comprueba nombres, alias y relevancia suficiente en el portafolio. El ranking conserva los pesos de coincidencias directas, variantes y sinónimos, y exige separación entre las mejores FAQ salvo coincidencia fuerte.
3. Una coincidencia local clara devuelve texto, tabla y sugerencias del corpus. Almacén, control por lotes e instituciones educativas tienen respuestas y preguntas de seguimiento revisadas.
4. Si falta una coincidencia clara y existen hasta cinco candidatos plausibles, el clasificador opcional recibe el mensaje acotado y los títulos e identificadores candidatos. `NONE`, respuesta inválida, error o timeout conservan la alternativa local.
5. El servidor valida pertenencia a la lista y recupera la respuesta canónica por ID. El modelo carece de herramientas y permisos sobre operaciones de RimCode. El texto enviado a TTS es la respuesta aprobada. El usuario puede leerla inmediatamente.
6. La API compatible comparte el mismo motor y conserva campos de respuesta como `success`, `emotion`, `suggestions` y `timestamp`.

Para estos datos y esta latencia se mantuvo el ranking léxico, con respuestas comerciales en `db/faq/` y el catálogo en `db/services.json`. El proveedor externo solo resuelve ambigüedad de intención. Esto admite tono por contenido y seguimientos documentados, con una superficie pequeña y sin coste de un índice vectorial. Las consultas que requieren interpretación abierta se orientan hacia Contacto.

La conversación conserva los estados de dominio, hosting y publicación al calcular una landing y puede transferir el escenario al simulador. Cuando la consulta identifica un proyecto, puede resolver seguimientos sobre su tecnología, demo y funciones. Guarda únicamente opciones del catálogo e identificadores públicos, sin añadir historial al proveedor externo.

La verificación reproduce coincidencias locales, clasificación con respuesta permitida, ID ajeno, caída del proveedor y modo desactivado. El proveedor configurado durante QA es un doble controlado. Queda validar latencia, políticas de retención y calidad de clasificación con la cuenta de producción. [Pruebas de API](../qa/rimcode-api.test.mjs).
