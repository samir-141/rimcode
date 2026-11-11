/**
 * Servicio de narración de RIMY.
 *
 * Usa la Web Speech API del navegador. Es un singleton porque el audio debe
 * sobrevivir a los cambios de UI y porque RIMY (montada en el layout) necesita
 * conocer el estado aunque el botón que inició la narración esté en otra ruta.
 *
 * No simula un servicio de voz remoto: si el navegador no soporta síntesis de
 * voz, lo indica con `status: "unsupported"` y la interfaz muestra el texto.
 */

export type NarrationStatus =
    | "idle"
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
    error?: string;
};

type SpeakOptions = {
    lang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
    sentencePauseMs?: number;
};

const DEFAULT_OPTIONS: Required<SpeakOptions> = {
    lang: "es-ES",
    rate: 0.95,
    pitch: 1.05,
    volume: 1,
    sentencePauseMs: 220,
};

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
        voice.lang.toLowerCase().startsWith("es")
    );

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

    const voice = pickSpanishVoice();
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

    stop();
    runToken += 1;
    const token = runToken;

    options = { ...DEFAULT_OPTIONS, ...speakOptions };
    sentences.length = 0;
    sentences.push(...splitSentences(clean));
    sentenceIndex = 0;
    paused = false;

    state = {
        status: "speaking",
        text: clean,
        index: 0,
        total: sentences.length,
        supported: true,
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
    paused = false;
    clearPauseTimer();
    sentences.length = 0;
    sentenceIndex = 0;

    if (isSpeechSupported()) {
        try {
            window.speechSynthesis.cancel();
        } catch {
            // Sin soporte real de cancelación.
        }
    }

    emit({ status: "idle", text: "", index: 0, total: 0, error: undefined });
}
