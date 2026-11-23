import type { Currency } from "@/lib/db/types";
import type { ConversationContext } from "./conversation";
import { routeDialogue } from "./dialogue";
import type { ChatState, RecentTurn } from "./intent";
import { classifyIntent } from "./intent-service";

export async function answerChat(message: string, currency: Currency, signal: AbortSignal, context: ConversationContext | undefined,
    state: ChatState, history: RecentTurn[]) {
    const { decision, source } = await classifyIntent(message, history, state, signal);
    const { answer, flow } = routeDialogue(message, currency, decision, state, context);
    const choice = decision.intencion === "cotizar" || decision.intencion === "agendar_reunion" ? decision.intencion : undefined;
    const newState: ChatState = {
        ya_se_presento: true,
        ultima_intencion: decision.intencion,
        landing_elegida: answer.context?.topic === "landing" ? answer.context : state.landing_elegida ?? (context?.topic === "landing" ? context : undefined),
        flujo_activo: flow,
        opcion_reserva: (state.flujo_activo === "aclarar_reserva" || state.opcion_reserva) &&
            choice && !decision.necesita_aclaracion ? choice : undefined,
        turno: (state.turno ?? 0) + 1,
    };
    return { answer, decision, source, newState };
}
