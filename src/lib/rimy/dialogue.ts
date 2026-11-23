import type { Currency } from "@/lib/db/types";
import { answerConversation, type ConversationContext } from "./conversation";
import { chooseMeeting, chooseQuote, directContact, form, hosting, menu, quoted, social, textAnswer, type ChatAnswer } from "./commercial";
import { optionsQuestion, reservationQuestion, type ChatState, type Flow, type IntentResult } from "./intent";
import { answerFromFaq, answerLocally, getChatCopy, normalize } from "./knowledge";

const copy = getChatCopy();

export function routeDialogue(message: string, currency: Currency, decision: IntentResult, state: ChatState, previous?: ConversationContext):
    { answer: ChatAnswer; flow: Flow } {
    const text = normalize(message);
    const turn = state.turno ?? 0;
    const intent = decision.intencion;
    const local = answerLocally(message, currency);
    const canRoute = !decision.necesita_aclaracion;
    const ongoingQuote = previous?.topic === "landing" && (/^(?:y |solo |ya |sin |con |incluye )/.test(text) ||
        /\b(?:con todo|todo incluido|precio de la landing)\b/.test(text));
    const chooseLanding = /\b(?:landing|landings|(?:web|pagina) (?:sencilla|simple|de una (?:sola )?pagina))\b/.test(text);
    const infrastructureChange = /\b(?:dominio|publicacion|publicar|subir)\b/.test(text) &&
        /\b(?:tengo|con|sin|precio|publican|pueden|necesito|incluye|cuesta|publicar|subir)\b/.test(text);
    const hostingWithLanding = chooseLanding && /\b(?:con|sin|incluye|incluyen) (?:el )?(?:hosting|dominio)\b/.test(text);
    const useLanding = (ongoingQuote || infrastructureChange || hostingWithLanding || (chooseLanding && intent !== "cotizar")) &&
        !(canRoute && ["contactar_programador", "agendar_reunion"].includes(intent)) && intent !== "ambiguo_reserva";
    const contextual = answerConversation(message, currency, previous, local, useLanding);
    if (contextual) {
        return contextual.action === "quote" ? { answer: { ...contextual, actions: quoted }, flow: "cotizacion" } :
            { answer: contextual, flow: "general" };
    }

    if (intent === "ambiguo_reserva") {
        return { answer: textAnswer(reservationQuestion, intent, [chooseMeeting, chooseQuote]), flow: "aclarar_reserva" };
    }

    if (canRoute) {
        switch (intent) {
            case "saludo":
                return { answer: textAnswer(state.ya_se_presento ? ["¡Hola de nuevo! ¿En qué te ayudo?", "¡Hola! ¿Qué quieres consultar?",
                    "¡Hola otra vez! Cuéntame en qué puedo ayudarte."][turn % 3] : copy.welcome, intent), flow: "general" };
            case "charla_social":
                return { answer: textAnswer(social(text, turn), intent), flow: "general" };
            case "agendar_reunion":
                return { answer: textAnswer([
                    "Puedes solicitar una reunión en el formulario de contacto. Cuéntanos de qué trata el proyecto y en qué horarios podrías conversar.",
                    "Para coordinar una reunión, escribe tu idea y tu disponibilidad en el formulario. El equipo podrá confirmar la cita contigo.",
                    "Deja una solicitud de reunión con tu disponibilidad en el formulario de contacto. El equipo revisará contigo la fecha.",
                ][turn % 3], intent, [form]), flow: "reunion" };
            case "contactar_programador":
                return { answer: directContact(intent, turn, text), flow: "general" };
            case "consultar_hosting":
                return { answer: hosting(currency, intent, turn), flow: "hosting" };
            case "consultar_precios": {
                const prices = answerFromFaq("costo-proyecto", currency);
                const answer = textAnswer([
                    "Puedes comparar estas referencias de desarrollo. El importe depende del alcance que elijas.",
                    "Estos son los valores base que figuran en el simulador. El equipo confirma el presupuesto tras revisar el proyecto.",
                ][turn % 2], intent, quoted);
                return { answer: { ...answer, table: prices?.table }, flow: "cotizacion" };
            }
            case "cotizar": {
                const inquiring = local.inScope && /^(?:pueden|ofrecen|desarrollan|trabajan|hacen|tienen)\b/.test(text) &&
                    !/\b(?:cotiz\w*|pedido|precio|presupuesto|propuesta)\b/.test(text);
                if (inquiring) return { answer: local, flow: "general" };
                const preferLanding = !/\b(?:tienda|erp|saas|software a medida|app|web profesional)\b/.test(text);
                const scenario = preferLanding && (state.landing_elegida ?? (chooseLanding ? { domain: "none", hosting: "none", publish: false } as const : undefined));
                const context = scenario ? { topic: "landing" as const, ...scenario } : undefined;
                const carry = context ? " Puedes continuar con tu Landing Esencial en el simulador." : "";
                const answer = textAnswer([
                    "Para pedir una cotización, elige la solución y lo que necesitas en el simulador. También puedes contarnos tu idea en el formulario.",
                    "Puedes empezar con una estimación en el simulador o enviar tu solicitud por el formulario para que revisemos el alcance.",
                    "Para iniciar un pedido, arma una estimación o describe tu proyecto en el formulario de contacto.",
                ][turn % 3] + carry, intent, quoted);
                return { answer: { ...answer, context, action: context ? "quote" : undefined }, flow: "cotizacion" };
            }
        }
    }

    if (local.inScope && local.matched.some((match) => match.startsWith("faq:") && (canRoute ||
        !["faq:contratar-contacto", "faq:costo-proyecto"].includes(match)))) return { answer: local, flow: "general" };
    const fallback = textAnswer([
        "Puedo orientarte sobre cotizaciones, hosting y contacto con el programador. Elige una opción para continuar.",
        "Si buscas ayuda con tu web, puedo guiarte para cotizar, revisar el hosting o hablar con el programador.",
        "Puedo ayudarte a estimar un proyecto, revisar el hosting o ponerte en contacto con el programador.",
    ][turn % 3] + (decision.necesita_aclaracion ? ` ${optionsQuestion}` : ""), intent, menu, false);
    return { answer: fallback, flow: state.flujo_activo === "aclarar_reserva" && decision.necesita_aclaracion ? "aclarar_reserva" : "general" };
}
