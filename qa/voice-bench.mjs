import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { performance } from "node:perf_hooks";

const endpoint = process.env.RIMY_TTS_URL || "http://127.0.0.1:8810/synthesize";
const token = process.env.RIMY_TTS_TOKEN;
const sampleDirectory = process.env.RIMY_BENCH_SAMPLES;
if (!token) throw new Error("Configura RIMY_TTS_TOKEN para el servicio de pruebas.");

const phrases = JSON.parse(await readFile(new URL("./voice-sentences.json", import.meta.url), "utf8"));
assert(phrases.length >= 20);
if (sampleDirectory) await mkdir(sampleDirectory, { recursive: true });
const results = [];

for (const [index, text] of phrases.entries()) {
    for (const phase of ["first", "cached"]) {
        const started = performance.now();
        let result;
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ text, cache: "public-answer" }),
                signal: AbortSignal.timeout(120_000),
            });
            const headersMs = performance.now() - started;
            if (!response.ok) {
                result = { index: index + 1, phase, status: response.status, headersMs };
            } else {
                const wav = Buffer.from(await response.arrayBuffer());
                const totalMs = performance.now() - started;
                assert.equal(wav.toString("ascii", 0, 4), "RIFF");
                assert.equal(wav.toString("ascii", 8, 12), "WAVE");
                assert(wav.length > 100);
                const durationSeconds = (wav.length - 44) / wav.readUInt32LE(28);
                result = { index: index + 1, phase, status: response.status, headersMs, totalMs, bytes: wav.length, durationSeconds };
                if (sampleDirectory && phase === "first") await writeFile(join(sampleDirectory, `rimy-${index + 1}.wav`), wav);
            }
        } catch (error) {
            result = { index: index + 1, phase, error: error.name };
        }
        results.push(result);
        console.log(JSON.stringify(result));
    }
}

function percentile(numbers, p) {
    if (!numbers.length) return null;
    const sorted = [...numbers].sort((left, right) => left - right);
    return Math.round(sorted[Math.ceil(sorted.length * p) - 1] * 10) / 10;
}
for (const phase of ["first", "cached"]) {
    const batch = results.filter((result) => result.phase === phase);
    const ok = batch.filter((result) => result.status === 200);
    console.log(JSON.stringify({
        phase, passed: ok.length, errors: batch.length - ok.length,
        headersP50Ms: percentile(ok.map((item) => item.headersMs), 0.5),
        headersP95Ms: percentile(ok.map((item) => item.headersMs), 0.95),
        totalP50Ms: percentile(ok.map((item) => item.totalMs), 0.5),
        totalP95Ms: percentile(ok.map((item) => item.totalMs), 0.95),
    }));
}
if (results.some((item) => item.status !== 200)) process.exitCode = 1;
