/**
 * Servicio de narración de RIMY.
 *
 * Comparte voz, volumen y controles entre saludo, chat y fichas.
 */

import { getRimy } from "@/lib/db";
import { prepareRimySpeech, type VoiceReference } from "./voice-text";

export type NarrationStatus =
    | "idle"
    | "loading"
    | "speaking"
    | "paused"
    | "unsupported"
    | "error";

export type NarrationState = {
    status: NarrationStatus;
    text: string;
    index: number;
    total: number;
    supported: boolean;
    source?: "device" | "natural";
    measured?: boolean;
    error?: string;
};

type SpeakOptions = {
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    sentencePauseMs?: number;
};

const DEFAULT_OPTIONS: Required<SpeakOptions> = getRimy().tts;

let state: NarrationState = {
    status: "idle",
    text: "",
    index: 0,
    total: 0,
    supported: true,
};

const listeners = new Set<() => void>();
const sentences: string[] = [];
let sentenceIndex = 0;
let options: Required<SpeakOptions> = { ...DEFAULT_OPTIONS };
let pauseTimer: ReturnType<typeof setTimeout> | null = null;
let runToken = 0;
let paused = false;
let speechActive = false;
let request: AbortController | undefined;
let audio: HTMLAudioElement | undefined;
let objectUrl: string | undefined;
let audioContext: AudioContext | undefined;
let mediaSource: MediaElementAudioSourceNode | undefined;
let analyser: AnalyserNode | undefined;
let gain: GainNode | undefined;
let samples: Float32Array<ArrayBuffer> | undefined;
let frame = 0;
let volume = 1;
let preferDeviceVoice = false;
let selectedDeviceVoice: SpeechSynthesisVoice | null = null;
const mouthListeners = new Set<(level: number) => void>();

export function subscribeMouth(listener: (level: number) => void) {
    mouthListeners.add(listener);
    return () => { mouthListeners.delete(listener); };
}

function stopMeter() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    mouthListeners.forEach((listener) => listener(0));
}

function measureAudio() {
    if (!analyser || !samples || !mouthListeners.size) return;
    analyser.getFloatTimeDomainData(samples);
    const rms = Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
    mouthListeners.forEach((listener) => listener(Math.min(1, rms * 5)));
    frame = requestAnimationFrame(measureAudio);
}

function prepareAudioContext() {
    if (!window.AudioContext || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    try {
        audioContext ??= new AudioContext();
        void audioContext.resume().catch(() => {});
    } catch {
        // La reproducción puede seguir sin medición.
    }
}

export function setNarrationVolume(value: number) {
    volume = Math.min(1, Math.max(0, value));
    options.volume = volume;
    if (gain) gain.gain.value = volume;
    else if (audio) audio.volume = volume;
}

function releaseAudio() {
    stopMeter();
    if (audio) {
        audio.onplaying = audio.onpause = audio.onended = audio.onerror = null;
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        audio = undefined;
    }
    mediaSource?.disconnect();
    analyser?.disconnect();
    gain?.disconnect();
    mediaSource = analyser = gain = samples = undefined;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = undefined;
}

function playAudio(url: string, token: number) {
    const player = new Audio();
    audio = player;
    player.volume = volume;
    if (audioContext?.state === "running") {
        mediaSource = audioContext.createMediaElementSource(player);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        samples = new Float32Array(analyser.fftSize);
        gain = audioContext.createGain();
        mediaSource.connect(analyser);
        analyser.connect(gain);
        gain.connect(audioContext.destination);
        gain.gain.value = volume;
        player.volume = 1;
    }
    player.onplaying = () => {
        if (token !== runToken) return;
        emit({ status: "speaking", measured: Boolean(analyser) });
        stopMeter();
        measureAudio();
    };
    player.onpause = stopMeter;
    player.onended = () => { if (token === runToken) stopNarration(); };
    player.onerror = () => failAudio(token);
    player.src = url;
    return player.play();
}

function failAudio(token: number) {
    if (token !== runToken || state.status === "error") return;
    releaseAudio();
    emit({ status: "error", measured: false, error: "No se pudo reproducir la voz. Puedes seguir leyendo la respuesta." });
}

export function speakRimy(text: string, reference?: VoiceReference, useDevice = false) {
    if (useDevice) preferDeviceVoice = true;
    if (preferDeviceVoice || !reference) {
        speak(text, { volume });
    } else {
        void speakNaturally(text, reference);
    }
}

async function speakNaturally(text: string, reference: VoiceReference) {
    stopNarration();
    const token = runToken;
    prepareAudioContext();
    const controller = new AbortController();
    request = controller;
    emit({ status: "loading", text, source: "natural", supported: true });
    try {
        const response = await fetch("/api/rimy/voice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, ...reference }),
            signal: controller.signal,
        });
        if (response.headers.get("x-rimy-voice") === "device") {
            if (token === runToken) speak(text, { volume });
            return;
        }
        if (!response.ok || response.headers.get("content-type") !== "audio/wav") throw new Error();
        const blob = await response.blob();
        if (token !== runToken) return;
        objectUrl = URL.createObjectURL(blob);
        await playAudio(objectUrl, token);
    } catch {
        failAudio(token);
    } finally {
        if (request === controller) request = undefined;
    }
}

function isBrowser(): boolean {
    return typeof window !== "undefined";
}

export function isSpeechSupported(): boolean {
    return (
        isBrowser() &&
        "speechSynthesis" in window &&
        typeof window.SpeechSynthesisUtterance !== "undefined"
    );
}

function emit(patch: Partial<NarrationState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
}

function clearPauseTimer() {
    if (pauseTimer) {
        clearTimeout(pauseTimer);
        pauseTimer = null;
    }
}

function pickSpanishVoice(): SpeechSynthesisVoice | null {
    if (!isBrowser() || !("speechSynthesis" in window)) return null;

    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const spanish = voices.filter((voice) =>
        voice.localService && voice.lang.toLowerCase().startsWith("es")
    );
    const latinAmerican = spanish.find((voice) => !["es", "es-es"].includes(voice.lang.toLowerCase()));
    if (latinAmerican) return latinAmerican;

    const preferredNames = [
        "helena",
        "sabina",
        "monica",
        "mónica",
        "paulina",
        "laura",
        "elvira",
        "google",
        "natural",
    ];

    for (const name of preferredNames) {
        const match = spanish.find((voice) =>
            voice.name.toLowerCase().includes(name)
        );
        if (match) return match;
    }

    return spanish[0] ?? null;
}

export function splitSentences(text: string): string[] {
    return text
        .replace(/\s+/g, " ")
        .split(/(?<=[.!?…])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean);
}

export function subscribeNarration(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function getNarrationSnapshot(): NarrationState {
    return state;
}

function speakCurrent(token: number) {
    if (token !== runToken || paused) return;

    const sentence = sentences[sentenceIndex];
    if (!sentence) {
        emit({ status: "idle", index: 0, total: 0 });
        return;
    }

    const utterance = new SpeechSynthesisUtterance(sentence);
    utterance.lang = options.lang;
    utterance.rate = options.rate;
    utterance.pitch = options.pitch;
    utterance.volume = options.volume;

    selectedDeviceVoice ??= pickSpanishVoice();
    const voice = selectedDeviceVoice;
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
        if (token !== runToken) return;
        emit({
            status: "speaking",
            index: sentenceIndex,
            total: sentences.length,
            error: undefined,
        });
    };

    utterance.onend = () => {
        if (token !== runToken || paused) return;
        sentenceIndex += 1;

        if (sentenceIndex >= sentences.length) {
            speechActive = false;
            emit({ status: "idle", index: sentences.length, total: sentences.length });
            return;
        }

        emit({
            status: "speaking",
            index: sentenceIndex,
            total: sentences.length,
        });

        pauseTimer = setTimeout(() => {
            pauseTimer = null;
            speakCurrent(token);
        }, options.sentencePauseMs);
    };

    utterance.onerror = () => {
        if (token !== runToken) return;
        emit({
            status: "error",
            error: "No se pudo reproducir la narración.",
        });
    };

    try {
        window.speechSynthesis.speak(utterance);
    } catch {
        emit({
            status: "error",
            error: "El navegador rechazó la síntesis de voz.",
        });
    }
}

export function speak(text: string, speakOptions: SpeakOptions = {}): boolean {
    const clean = text.trim();

    if (!clean) return false;

    if (!isSpeechSupported()) {
        emit({
            status: "unsupported",
            text: clean,
            supported: false,
            error: "Este navegador no admite síntesis de voz.",
        });
        return false;
    }

    stopNarration();
    const token = runToken;

    options = { ...DEFAULT_OPTIONS, ...speakOptions };
    speechActive = true;
    sentences.length = 0;
    sentences.push(...splitSentences(prepareRimySpeech(clean)));
    sentenceIndex = 0;
    paused = false;

    state = {
        status: "loading",
        text: clean,
        index: 0,
        total: sentences.length,
        supported: true,
        source: "device",
    };
    listeners.forEach((listener) => listener());

    // Diferimos un tick: algunos navegadores ignoran speak() si se llama justo
    // después de cancel().
    pauseTimer = setTimeout(() => {
        pauseTimer = null;
        speakCurrent(token);
    }, 60);

    return true;
}

export function pauseNarration(): void {
    if (audio && state.status === "speaking") {
        audio.pause();
        emit({ status: "paused" });
        return;
    }
    if (!isSpeechSupported() || state.status !== "speaking") return;

    paused = true;
    clearPauseTimer();

    try {
        window.speechSynthesis.pause();
    } catch {
        // Algunos navegadores no implementan pause(); mantenemos el estado.
    }

    emit({ status: "paused" });
}

export function resumeNarration(): void {
    if (audio && state.status === "paused") {
        const token = runToken;
        void audio.play().catch(() => failAudio(token));
        return;
    }
    if (!isSpeechSupported() || state.status !== "paused") return;

    paused = false;

    // `speechSynthesis.resume()` no es fiable en todos los navegadores y no
    // hace nada si la pausa ocurrió entre frases. Reanudamos desde el inicio
    // de la frase actual, que es un comportamiento predecible.
    try {
        window.speechSynthesis.cancel();
    } catch {
        // Sin cancelación real: el token invalida la locución anterior.
    }

    runToken += 1;
    const token = runToken;
    emit({ status: "speaking" });
    speakCurrent(token);
}

export function stopNarration(): void {
    runToken += 1;
    request?.abort();
    request = undefined;
    releaseAudio();
    paused = false;
    clearPauseTimer();
    sentences.length = 0;
    sentenceIndex = 0;

    if (speechActive && isSpeechSupported()) {
        try {
            window.speechSynthesis.cancel();
        } catch {
            // Sin soporte real de cancelación.
        }
    }

    speechActive = false;
    emit({ status: "idle", text: "", index: 0, total: 0, error: undefined, source: undefined, measured: false });
}
