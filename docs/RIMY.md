# RIMY

RIMY es la mascota y asistente de RimCode. Combina un rig SVG animado con una máquina de estados, audio pregrabado, síntesis de voz y un explicador de proyectos.

## 1. Archivos

| Archivo | Función |
| --- | --- |
| `src/components/rimy/RimyController.tsx` | Orquestador único montado en el layout |
| `RimyMascot.tsx` / `.module.css` | Rig SVG y animaciones |
| `RiveRimy.tsx` | Backend Rive opcional |
| `rimy-config.ts` | Prioridades, duraciones y mensajes desde `db/rimy.json` |
| `hooks/useRimyState.ts` | Máquina de estados |
| `hooks/useScrollBehavior.ts` | Señales de scroll, docked y comportamiento |
| `hooks/useRimyAudio.ts` | Audio pregrabado de bienvenida y voz del navegador |
| `src/lib/rimy/narration.ts` | Singleton TTS con pausa/reanudación/parada |
| `src/components/projects/ProjectExplainer.tsx` | Explicación de proyecto + controles de voz |

## 2. Estados

| Estado | Prioridad | Duración base | Cuándo se usa |
| --- | --- | --- | --- |
| `idle` | 0 | — | Reposo |
| `thinking` | 20 | 3.4 s | Duda, permanencia en una sección |
| `happy` | 40 | 1.7 s | Toque, saludo de retorno, sección nueva |
| `run` | 50 | 1.6 s | Paso a modo acoplado |
| `talking` | 55 | mientras haya narración | TTS activo |
| `error` | 60 | 1.5 s | Scroll demasiado rápido |
| `annoyed` | 70 | 2.5 s | Scroll repetitivo |
| `fall` | 80 | 1.9 s | Doble toque rápido |
| `greeting` | 100 | 6.2 s | Bienvenida única por sesión |

Una animación de menor prioridad no interrumpe a otra mayor. El saludo no puede ser interrumpido. La narración puede dominar mensajes de scroll, pero no el saludo.

## 3. Saludo

- Se programa 650 ms después del montaje.
- Se registra en `sessionStorage` con la clave `rimy:greeted:v1`; no se repite en la misma sesión.
- Si ya saludó, muestra “¡Hola de nuevo!”.
- El saludo usa el mismo texto inicial del chat. Su botón solicita la voz de Rimy por intervención del visitante.
- El texto del saludo y el audio están en `db/rimy.json` → `greeting`.

## 4. Audio y TTS

Hay dos mecanismos distintos:

1. Saludo, chat y explicaciones comparten el servicio de voz natural cuando está habilitado. Solo sintetiza saludos y fichas canónicas o respuestas firmadas por el servidor.
2. Cuando la síntesis natural está deshabilitada, las tres superficies usan la misma voz del navegador. Si falla el servicio, el chat permite elegir la voz del dispositivo para el resto de la sesión.

`src/lib/rimy/narration.ts`:

- `speak(text, options)`: divide el texto en frases, selecciona una voz española y reproduce con pausas.
- `pauseNarration()` / `resumeNarration()`: pausa y reanuda.
- `stopNarration()`: cancela y limpia el estado.
- Estado observable (`idle`, `loading`, `speaking`, `paused`, `unsupported`, `error`) mediante `useNarration`.
- Si el navegador no soporta voz, `status` pasa a `unsupported` y la UI mantiene el texto como alternativa.

`RimyController` aplica la animación de habla mientras se reproduce audio. El SVG puede usar amplitud para mover la boca en audio medible. Consulta la [arquitectura de voz](../audit/VOICE_ARCHITECTURE.md) para el servicio Python.

## 5. Explicador de proyectos

`ProjectExplainer` recibe el proyecto desde la ficha y ofrece:

- **Resumen básico**: nombre, categoría y descripción corta.
- **Explicación detallada**: descripción, problema, objetivos, funcionalidades, tecnologías, desafíos, soluciones y resultados disponibles.
- **Preguntas rápidas**: qué es, qué problema resuelve, tecnologías y funcionalidades.
- Texto siempre visible; botón “Escuchar explicación”, pausa/continuar y detener.
- Si faltan campos, muestra `emptyDetail` o `noDescription` en lugar de inventar contenido.

## 6. Comportamiento en rutas

- En la landing, RIMY se alinea con `#rimy-hero-slot` mientras el Hero está visible.
- Al hacer scroll se acopla a la esquina inferior derecha y vuelve al Hero si el usuario sube.
- En `/projects` y `/projects/[slug]` no existe el hueco: `useScrollBehavior` fuerza el modo `docked` desde el inicio.
- Al cambiar de ruta no se desmonta, por lo que conserva animación y estado.
- El chat se puede abrir desde la mascota en el Hero o en modo acoplado. El audio se detiene al cambiar de ruta.

## 7. Rive opcional

Por defecto se usa el rig SVG. Si defines `NEXT_PUBLIC_RIMY_RIVE_SRC` con un archivo `.riv` válido, `RiveRimy` toma el control.

State Machine esperada: `RimyMachine`. Entradas booleanas:

- `isIdle`
- `isGreeting`
- `isHappy`
- `isThinking`
- `isTalking`
- `isError`

Si Rive falla al cargar, se vuelve automáticamente al SVG. El `.riv` actual del repositorio (`public/mascot/rimbot.riv`) no está documentado con esa State Machine; no se asume que funcione.

## 8. Accesibilidad y rendimiento

- `prefers-reduced-motion`: se desactivan animaciones y la mascota no persigue el puntero.
- El SVG tiene `role="img"` y etiqueta descriptiva.
- El globo de diálogo tiene botón de cierre y estado `aria-live` donde corresponde.
- Los controles de voz son botones reales con etiquetas.
- El rig es un único SVG; no hay canvas ni WebGL salvo Rive opcional.

## 9. Configuración

Todo el copy y los tiempos editables están en `db/rimy.json`:

```json
{
  "greeting": { "text": "…", "audioText": "…", "audioFile": "/mascot/rimy-welcome.wav" },
  "messages": { "trip": "¡Ups! Me tropecé 😅", "sections": { "proyectos": { "animation": "happy", "tone": "happy", "message": "…" } } },
  "tts": { "lang": "es-ES", "rate": 0.95, "pitch": 1.05, "volume": 1, "sentencePauseMs": 220 },
  "projectExplainer": { "title": "Pregúntale a RIMY", "basicLabel": "Resumen básico", "detailedLabel": "Explicación detallada" }
}
```

Si cambias una animación de sección, usa solo estados existentes.

## 10. Pruebas manuales recomendadas

1. Primera visita: saludo único, audio bloqueado permitido y botón de activación.
2. Scroll rápido: `error` con mensaje; scroll repetitivo: `annoyed`.
3. Doble toque: `fall` con “¡Ups! Me tropecé 😅”.
4. Ficha de proyecto: RIMY inicia acoplada y el explicador reproduce, pausa, reanuda y detiene.
5. Navegar entre landing y ficha: no se duplica RIMY ni se reinicia el saludo.
6. Reducir movimiento en el sistema operativo y confirmar que no hay animaciones molestas.
