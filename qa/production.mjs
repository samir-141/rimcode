import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const paths = ["donde-florecen-los-sentimientos", "beeflow-auditor", "angibotica", "elecciones-municipio-escolar",
    "edu-dental", "cincit-2026", "mototaxi"];
export const publicRoutes = ["/", "/projects", ...paths.map((slug) => `/projects/${slug}`),
    "/legal/cookies", "/legal/privacidad", "/robots.txt", "/sitemap.xml", "/google57c72655c1c83a9c.html"];

function makeWave() {
    const rate = 24_000;
    const samples = rate * 4;
    const wav = Buffer.alloc(44 + samples * 2);
    wav.write("RIFF");
    wav.writeUInt32LE(wav.length - 8, 4);
    wav.write("WAVEfmt ", 8);
    wav.writeUInt32LE(16, 16);
    wav.writeUInt16LE(1, 20);
    wav.writeUInt16LE(1, 22);
    wav.writeUInt32LE(rate, 24);
    wav.writeUInt32LE(rate * 2, 28);
    wav.writeUInt16LE(2, 32);
    wav.writeUInt16LE(16, 34);
    wav.write("data", 36);
    wav.writeUInt32LE(samples * 2, 40);
    for (let index = 0; index < samples; index++) {
        const envelope = 0.05 + 0.13 * Math.abs(Math.sin(index / 1000));
        wav.writeInt16LE(Math.round(Math.sin(index * Math.PI * 440 / rate) * envelope * 32_767), 44 + index * 2);
    }
    return wav;
}

const wav = makeWave();
const mockToken = "qa-only-tts-token-for-loopback-test";
const appRoot = fileURLToPath(new URL("../", import.meta.url));

async function listen(server) {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    return server.address().port;
}

export async function startProduction({ enabled = true, voiceUrl, voiceToken, intentPort = process.env.RIMY_TEST_INTENT_PORT, logDir = "" } = {}) {
    const state = { voiceCalls: 0, contactCalls: 0, failVoice: false, voiceDelay: 40, contactPayload: undefined };
    const upstream = createServer(async (request, response) => {
        let payload = "";
        for await (const chunk of request) payload += chunk;
        if (request.url === "/synthesize") {
            if (request.headers.authorization !== `Bearer ${mockToken}`) return response.writeHead(401).end();
            state.voiceCalls++;
            await delay(state.voiceDelay);
            if (state.failVoice) return response.writeHead(503).end();
            response.writeHead(200, { "Content-Type": "audio/wav", "Content-Length": wav.length });
            return response.end(wav);
        }
        if (request.url === "/contact") {
            state.contactCalls++;
            state.contactPayload = JSON.parse(payload);
            await delay(80);
            return response.writeHead(200).end();
        }
        return response.writeHead(404).end();
    });
    const upstreamPort = await listen(upstream);
    const reservation = createServer();
    const port = await listen(reservation);
    await new Promise((resolve) => reservation.close(resolve));
    const url = `http://127.0.0.1:${port}`;
    let childLog = "";
    const child = spawn(process.execPath, [
        "node_modules/next/dist/bin/next",
        "start", "--hostname", "127.0.0.1", "--port", String(port),
    ], {
        cwd: appRoot,
        stdio: ["ignore", "pipe", "pipe"],
        env: {
            ...process.env,
            NODE_ENV: "production",
            NEXT_TELEMETRY_DISABLED: "1",
            RIMY_INTENT_ENABLED: intentPort ? "1" : "0",
            RIMY_INTENT_PORT: intentPort || "8820",
            RIMY_LOG_DIR: logDir,
            RIMY_LOG_SIGNING_KEY: "qa-only-rimy-log-signing-key-for-local-test",
            NEXT_PUBLIC_WHATSAPP_NUMBER: "",
            NEXT_PUBLIC_CONTACT_EMAIL: "",
            RIMY_TTS_ENABLED: enabled ? "1" : "0",
            RIMY_TTS_URL: voiceUrl || `http://127.0.0.1:${upstreamPort}/synthesize`,
            RIMY_TTS_TOKEN: voiceToken || mockToken,
            RIMY_TTS_SIGNING_KEY: "qa-only-rimy-signing-key-for-loopback-test",
            RIMCODE_TRUSTED_IP_HEADER: "x-rimcode-qa-ip",
            RIMCODE_REDIS_REST_URL: "",
            RIMCODE_REDIS_REST_TOKEN: "",
            CONTACT_PROVIDER: enabled ? "webhook" : "disabled",
            CONTACT_WEBHOOK_URL: `http://127.0.0.1:${upstreamPort}/contact`,
            CONTACT_WEBHOOK_SECRET: "",
        },
    });
    for (const stream of [child.stdout, child.stderr]) {
        stream.setEncoding("utf8");
        stream.on("data", (chunk) => { childLog += chunk; });
    }

    async function stop() {
        if (child.exitCode === null && child.signalCode === null) {
            const finished = once(child, "exit");
            child.kill();
            await finished;
        }
        upstream.closeAllConnections();
        await new Promise((resolve) => upstream.close(resolve));
    }

    try {
        for (let attempt = 0; attempt < 80; attempt++) {
            if (child.exitCode !== null) break;
            const response = await fetch(`${url}/robots.txt`).catch(() => null);
            if (response?.ok) return { url, state, stop };
            await delay(125);
        }
        assert.fail(`Servidor de prueba no disponible\n${childLog}`);
    } catch (error) {
        await stop();
        throw error;
    }
}
