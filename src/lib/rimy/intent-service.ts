import { readLandingScenario } from "@/lib/quote";
import { normalize } from "./knowledge";
import { optionsQuestion, reservationQuestion, type ChatState, type Flow, type IntentResult, type RecentTurn } from "./intent";

const validLabel = /^[a-z_]{2,48}$/;
const flows = new Set<string>(["general", "cotizacion", "reunion", "hosting", "aclarar_reserva"]);

export function readChatState(input: unknown): ChatState {
    const state = (input && typeof input === "object" && !Array.isArray(input) ? input : {}) as Record<string, unknown>;
    return {
        ya_se_presento: state.ya_se_presento === true,
        ultima_intencion: typeof state.ultima_intencion === "string" && validLabel.test(state.ultima_intencion) ? state.ultima_intencion : undefined,
        landing_elegida: readLandingScenario(state.landing_elegida),
        flujo_activo: typeof state.flujo_activo === "string" && flows.has(state.flujo_activo) ? state.flujo_activo as Flow : undefined,
        opcion_reserva: state.opcion_reserva === "agendar_reunion" || state.opcion_reserva === "cotizar" ? state.opcion_reserva : undefined,
        turno: typeof state.turno === "number" && Number.isSafeInteger(state.turno) && state.turno >= 0 ? state.turno % 3000 : 0,
    };
}

export function readRecentTurns(input: unknown): RecentTurn[] | undefined {
    if (input === undefined) return [];
    if (!Array.isArray(input) || input.length > 6) return;
    const result: RecentTurn[] = [];
    for (const row of input) {
        if (!row || (row.rol !== "usuario" && row.rol !== "asistente") || typeof row.contenido !== "string" || row.contenido.length > 1200) return;
        result.push({ rol: row.rol, contenido: row.contenido });
    }
    return result;
}

export function intentDecision(intencion: string, confianza: number, threshold = 0.55): IntentResult {
    const ambiguous = intencion === "ambiguo_reserva";
    const clarify = ambiguous || confianza < threshold;
    return { intencion, confianza, necesita_aclaracion: clarify,
        pregunta_aclaracion: clarify ? (ambiguous ? reservationQuestion : optionsQuestion) : null };
}

function fromRules(message: string, history: RecentTurn[], state: ChatState): IntentResult {
    const text = normalize(message);
    const lastBot = history.findLast(({ rol }) => rol === "asistente")?.contenido;
    const pending = state.flujo_activo === "aclarar_reserva" || (!state.flujo_activo && lastBot === reservationQuestion);
    if (/^(?:y )?(?:el otro|la otra(?: opcion)?|otra opcion)$/.test(text)) {
        return state.opcion_reserva ? intentDecision(state.opcion_reserva === "cotizar" ? "agendar_reunion" : "cotizar", 1)
            : intentDecision("otro", 0);
    }
    if (state.flujo_activo === "cotizacion" && state.landing_elegida &&
        /^(?:y )?(?:con todo|todo incluido|al mes|por mes|mensual|al ano|por ano|anual)$/.test(text)) return intentDecision("consultar_precios", 1);
    if (pending) {
        if (/^(?:(?:la|una|prefiero|quiero) )*(?:reunion|reu|cita|llamada|primera)$/.test(text)) return intentDecision("agendar_reunion", 1);
        if (/^(?:(?:la|una|prefiero|quiero) )*(?:cotizador|cotizar|cotizacion|presupuesto|segunda)$/.test(text)) return intentDecision("cotizar", 1);
    }
    if (/\b(?:dentista|medica|hotel|restaurante|pelicula|pizza|mascota|clima|vuelos?|pasaporte)\b/.test(text) &&
        !/\b(?:web|sistema|app|proyecto|pagina)\b/.test(text)) return intentDecision("otro", 0.4);
    const rules: [string, RegExp][] = [
        ["saludo", /^(?:(?:ho+l[ai]+|ola+|holis|buen[ao]s?(?: dia[s]?| tardes?| noches?)?|wuenas|hey|saludos)(?: |$))+(?:rimy|rimcode|equipo|de nuevo)?$/],
        ["charla_social", /^(?:(?:hola )?(?:como|kmo|que tal) (?:estas|stas|andas|te va|vas|te sientes)|todo bien|gracias|muchas gracias|hasta luego|chau|nos vemos)\b/],
        ["agendar_reunion", /\b(?:agend\w*|coordin\w*|reserv\w*|program\w*|quiero)\b.{0,45}\b(?:reunion|reu|cita|videollamada|llamada|sesion)\b|^(?:agendar|coordinar)(?: una)? (?:reunion|cita|llamada)$/],
        ["ambiguo_reserva", /\b(?:reserv\w*|resrv\w*|apartar|separar un cupo)\b/],
        ["contactar_programador", /\b(?:whatsapp|wsp|watsap|contact\w*|contatct\w*|kontact\w*|celular|telefono|correo del)\b|\b(?:hablar|escribir|comunicarme)\b.{0,35}\b(?:programador|desarrollador|samir|persona|equipo)\b/],
        ["consultar_hosting", /\b(?:hosting|host|hostin|osting|alojamiento web|alojar mi|hospedar mi|hospedaje web)\b/],
        ["consultar_precios", /\b(?:precios?|costos?|cuanto (?:cuesta|sale|cobra[ns]?|vale|costaria)|a cuanto|en cuanto queda|tarifas?)\b/],
        ["cotizar", /\b(?:cotiz\w*|cotis\w*|pedidos?|encarg\w*|contrata[rs]\w*|propuesta formal|presupuesto para|abrir simulador)\b/],
    ];
    const match = rules.find(([, pattern]) => pattern.test(text));
    return match ? intentDecision(match[0], 0.9) : intentDecision("otro", 0.4);
}

export async function classifyIntent(message: string, history: RecentTurn[], state: ChatState, signal: AbortSignal) {
    const port = process.env.RIMY_INTENT_PORT?.trim() || "8820";
    if (process.env.RIMY_INTENT_ENABLED === "1" && /^\d{1,5}$/.test(port) && Number(port) > 0 && Number(port) < 65536) {
        try {
            const response = await fetch(`http://127.0.0.1:${port}/intent`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mensaje: message, historial_reciente: history, estado: state }),
                redirect: "error",
                cache: "no-store",
                signal: AbortSignal.any([signal, AbortSignal.timeout(300)]),
            });
            if (response.ok) {
                const data: unknown = await response.json();
                if (data && typeof data === "object" && "intencion" in data && typeof data.intencion === "string" &&
                    validLabel.test(data.intencion) && "confianza" in data && typeof data.confianza === "number" &&
                    0 <= data.confianza && data.confianza <= 1 && "necesita_aclaracion" in data && typeof data.necesita_aclaracion === "boolean") {
                    const clarification = data.necesita_aclaracion || data.intencion === "ambiguo_reserva";
                    return { decision: { intencion: data.intencion, confianza: data.confianza, necesita_aclaracion: clarification,
                        pregunta_aclaracion: clarification ? (data.intencion === "ambiguo_reserva" ? reservationQuestion : optionsQuestion) : null },
                        source: "onnx" as const };
                }
            } else {
                await response.body?.cancel();
            }
        } catch { /* La sesión puede continuar con las reglas locales si el proceso no responde. */ }
    }
    return { decision: fromRules(message, history, state), source: "reglas" as const };
}
