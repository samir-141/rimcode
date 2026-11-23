# RimCode

Sitio comercial y portafolio en Next.js, con el catálogo en `db/services.json` y el asistente Rimy.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

La aplicación usa `http://localhost:3000`. Para entrenar y desplegar el clasificador ONNX de Rimy en CPU, consulta el [README de intenciones](services/intent/README.md). La configuración de contacto, voz y registro está en la [guía de entorno](docs/ENVIRONMENT.md).

## Validación

```bash
pnpm lint
pnpm build
pnpm test
pnpm test:browser
```

Las pruebas de API y navegador levantan un servidor de producción local y usan dobles para correo y voz. Define `RIMY_TEST_INTENT_PORT=8820` para probar contra el proceso ONNX local. El navegador predeterminado es Chrome. Para Firefox, ejecuta `pnpm exec playwright install firefox` y define `RIMCODE_TEST_BROWSER=firefox`.

Para activar síntesis, instalar el servicio Python o medir el corpus de voz, consulta la [arquitectura de voz](audit/VOICE_ARCHITECTURE.md). La [auditoría final](audit/FINAL_AUDIT.md) recoge la evidencia y el alcance pendiente.
