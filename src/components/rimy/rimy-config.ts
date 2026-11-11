import rimyData from "../../../db/rimy.json";
import type { RimyAnimation, RimySectionId, RimyTone } from "./types";

/**
 * RIMY se controla con una pequeña máquina de estados. Cada animación tiene una
 * prioridad y una duración base; así una acción importante (saludar) no puede
 * ser interrumpida por otra secundaria (correr).
 */
export const RIMY_PRIORITY: Record<RimyAnimation, number> = {
    idle: 0,
    thinking: 20,
    happy: 40,
    run: 50,
    talking: 55,
    error: 60,
    annoyed: 70,
    fall: 80,
    greeting: 100,
};

export const RIMY_DURATION: Record<RimyAnimation, number> = {
    idle: 0,
    thinking: 3400,
    happy: 1700,
    talking: 120000,
    run: 1600,
    error: 1500,
    annoyed: 2500,
    fall: 1900,
    greeting: 6200,
};

export const RIMY_GREETING_TEXT = rimyData.greeting.text;

export const RIMY_GREETING_AUDIO_TEXT = rimyData.greeting.audioText;

export const RIMY_WELCOME_AUDIO = rimyData.greeting.audioFile;

/** Evita repetir la bienvenida en cada render / navegación interna. */
export const RIMY_GREETING_KEY = "rimy:greeted:v1";
export const RIMY_MUTED_KEY = "rimy:muted:v1";

type RimySectionMessage = {
    animation: RimyAnimation;
    tone: RimyTone;
    message: string;
};

type RimyMessages = {
    returning: string;
    alreadyGreeted: string;
    docked: string;
    fastScroll: string;
    repetitiveScroll: string;
    dwelling: string;
    bored: string;
    trip: string;
    wave: string;
    tap: string[];
    sections: Partial<Record<RimySectionId, RimySectionMessage>>;
};

export const RIMY_MESSAGES = rimyData.messages as RimyMessages;

export const RIMY_SECTIONS: RimySectionId[] = [
    "hero",
    "tecnologias",
    "proyectos",
    "simulador",
    "metodologia",
    "contactanos",
];
