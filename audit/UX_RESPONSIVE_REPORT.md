# Interfaz, accesibilidad y responsive

- Se conservaron los seis bloques de la landing. El catálogo reúne seis soluciones configurables. El trámite de cotización transfiere solución, complejidad, módulos, integraciones, entrega y gastos recurrentes al formulario y enfoca el campo de nombre.
- Se conservaron el tema oscuro, lima, cian y Geist. Se mejoraron contraste, indicadores de foco y espaciado del simulador. Los anclajes dejan el título por debajo del header. El globo se limita al Hero y la navegación lateral aparece cuando el ancho deja margen.
- Rimy abre la conversación desde el Hero y desde el modo acoplado. El historial se desplaza dentro del panel. Escape minimiza y devuelve el foco. El control de voz queda dentro del chat y se inicia por acción del visitante.
- El modal de privacidad usa un diálogo nativo, captura Tab y Escape y devuelve el foco a su control de apertura. La navegación por bloques respeta el scroll del chat, los controles de formulario y la preferencia de movimiento reducido.

## Matriz

La suite recorre 320 × 568, 390 × 640, 768 × 900, 844 × 390, 1280 × 900 y 1920 × 1080. Comprueba el ancho del documento, menú, navegación, transferencia de una solicitud de ERP, foco, chat, instancia única y posición del campo de texto. Los casos de 390 y 1280 recorren el modal, voz activa, pausa, continuación, cancelación, fallo y nuevo mensaje. El caso de 390 envía el formulario a un webhook local de prueba. Una prueba separada abre una ficha durante la reproducción y observa el movimiento de boca antes de navegar.

Chrome y Firefox completaron la matriz. Axe devolvió cero incidencias para 390 px en ambos temas y 1280 px en tema oscuro. Se verificaron scroll independiente del chat, recuperación de una cotización antigua, dictado con un doble y detención de reproducción al cambiar de ruta. Chrome midió amplitud del audio. Firefox headless mantuvo la animación de habla y la reproducción mientras el contexto de Web Audio permanecía suspendido.

Se revisaron capturas del simulador y del chat. Los controles de cookies y del menú se muestran por encima de la mascota cuando comparten espacio. La mascota acoplada todavía puede coincidir con texto del extremo derecho durante el desplazamiento en escritorio. Se verificó el acceso a los campos y al botón de cotización mediante scroll. La evaluación con lectores de pantalla, equipos físicos y captura de micrófono real queda pendiente.

Ejecución reproducible con `pnpm build` y `pnpm test:browser`. Define `RIMCODE_TEST_BROWSER=firefox` para el segundo motor y `RIMCODE_AXE_DETAILS=1` para ver los nodos señalados. [Suite de navegador](../qa/rimcode-browser.mjs).
