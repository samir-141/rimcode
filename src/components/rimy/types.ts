export type RimyAnimation =
    | "idle"
    | "greeting"
    | "run"
    | "fall"
    | "annoyed"
    | "happy"
    | "thinking"
    | "talking"
    | "error";

export type RimyMode = "hero" | "docked";

export type RimyTone = "neutral" | "happy" | "annoyed" | "surprised" | "thinking";

export type RimySectionId =
    | "hero"
    | "tecnologias"
    | "proyectos"
    | "simulador"
    | "metodologia"
    | "contactanos";

export type RimyMessage = {
    id: number;
    text: string;
    tone: RimyTone;
};

export type RimyRequestOptions = {
    duration?: number;
    message?: string;
    messageDuration?: number;
    tone?: RimyTone;
};

export type RimyAudioState = {
    muted: boolean;
    blocked: boolean;
    speaking: boolean;
    supported: boolean;
};
