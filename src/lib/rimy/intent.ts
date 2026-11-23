import type { LandingScenario } from "@/lib/quote";

export const reservationQuestion = "¿Quieres agendar una reunión o solicitar una cotización?";
export const optionsQuestion = "¿Quieres cotizar, consultar por hosting o hablar con el programador?";

export type IntentResult = {
    intencion: string;
    confianza: number;
    necesita_aclaracion: boolean;
    pregunta_aclaracion: string | null;
};

export type RecentTurn = { rol: "usuario" | "asistente"; contenido: string };
export type ReservationChoice = "agendar_reunion" | "cotizar";
export type Flow = "general" | "cotizacion" | "reunion" | "hosting" | "aclarar_reserva";
export type ChatState = {
    ya_se_presento: boolean;
    ultima_intencion?: string;
    landing_elegida?: LandingScenario;
    flujo_activo?: Flow;
    opcion_reserva?: ReservationChoice;
    turno?: number;
};

export type ActionId = "simulador" | "formulario" | "whatsapp" | "correo" | "elegir_reunion" | "elegir_cotizar" | "elegir_hosting" | "elegir_contacto";
export type ChatAction = { id: ActionId; label: string } & ({ href: string } | { message: string });
