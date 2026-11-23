import { getContact, getServices, getSettings } from "@/lib/db";
import type { Currency } from "@/lib/db/types";
import { formatQuoteAmount } from "@/lib/quote";
import type { ConversationContext } from "./conversation";
import type { ChatAction } from "./intent";
import type { LocalAnswer } from "./knowledge";

export type ChatAnswer = LocalAnswer & { context?: ConversationContext; action?: "quote"; actions?: ChatAction[] };
const simulator = { id: "simulador", label: "Abrir simulador", href: "/#simulador" } as const;
export const form = { id: "formulario", label: "Formulario de contacto", href: "/#contactanos" } as const;
export const chooseQuote = { id: "elegir_cotizar", label: "Solicitar cotización", message: "Quiero cotizar un proyecto" } as const;
export const chooseMeeting = { id: "elegir_reunion", label: "Agendar reunión", message: "Quiero agendar una reunión" } as const;
const chooseHosting = { id: "elegir_hosting", label: "Consultar hosting", message: "¿Qué planes de hosting ofrecen?" } as const;
const chooseContact = { id: "elegir_contacto", label: "Hablar con el programador", message: "Quiero contactar al programador" } as const;
export const menu = [chooseQuote, chooseHosting, chooseContact];
export const quoted = [simulator, form];

export function textAnswer(reply: string, intent: string, actions: ChatAction[] = [], inScope = true): ChatAnswer {
    return { reply, matched: inScope ? [`intent:${intent}`] : [], category: "comercial", suggestions: [], actions, inScope };
}

export function social(text: string, turn: number) {
    if (/\b(?:gracias|agradezco|grx|grcs|te pasaste)\b/.test(text)) {
        return ["¡Con gusto! Si tienes otra consulta sobre tu proyecto, aquí estoy.", "¡De nada! Puedo seguir ayudándote con tu proyecto."][turn % 2];
    }
    if (/\b(?:chau|chao|hasta|nos vemos|cuidate)\b/.test(text)) {
        return ["¡Hasta luego! Aquí estaré si necesitas retomar tu consulta.", "¡Que te vaya bien! Cuando quieras, seguimos con tu proyecto."][turn % 2];
    }
    return ["¡Muy bien, gracias por preguntar! ¿En qué te puedo ayudar hoy?", "¡Todo bien por aquí! ¿Tienes algún proyecto en mente?",
        "¡Bien, gracias! Cuéntame qué necesitas para tu web o proyecto."][turn % 3];
}

export function hosting(currency: Currency, intent: string, turn: number) {
    const item = getServices().infrastructure.find(({ id }) => id === "hosting");
    const rates = getSettings().currency.fallbackRates;
    const plans = item?.variants.map((variant) => {
        const price = variant.amountPEN == null ? "[COMPLETAR]" : formatQuoteAmount(variant.amountPEN, currency, rates);
        return `${variant.name ?? item.name} por ${price} al ${item.period}`;
    }).join(", ") || "[COMPLETAR]";
    return textAnswer([
        `En el simulador puedes cotizar ${plans}. El importe es referencial y puedes ajustarlo según tu proveedor.`,
        `La referencia del catálogo para alojar tu web es ${plans}. Si ya tienes hosting, puedes marcarlo como contratado en el simulador.`,
        `Para tu presupuesto contamos con ${plans} como referencia. Puedes revisar ese gasto por separado en el simulador.`,
    ][turn % 3], intent, [simulator]);
}

export function directContact(intent: string, turn: number, text: string) {
    const catalog = getContact();
    const channel = catalog.channels.find(({ id, enabled, href }) => id === "whatsapp" && enabled && href);
    const whatsapp = channel?.href && channel.value ? { id: "whatsapp", label: "Abrir WhatsApp", href: channel.href } as const : undefined;
    const email = catalog.channels.find(({ id, enabled, href }) => id === "email" && enabled && href);
    const emailAction = email?.href ? { id: "correo", label: "Escribir por correo", href: email.href } as const : undefined;
    const asksEmail = /\b(?:correo|email|mail)\b/.test(text);
    const information = asksEmail && emailAction ? `correo ${email?.value}` :
        whatsapp ? `WhatsApp ${channel?.value}` : emailAction ? `correo ${email?.value}` : "[COMPLETAR]";
    const actions = asksEmail && whatsapp && emailAction ? [emailAction, whatsapp] : [whatsapp ?? emailAction ?? form];
    return textAnswer([
        `Puedes hablar directamente con el programador por ${information}.`,
        `Para conversar con quien desarrolla los proyectos, usa ${information}.`,
        `El canal directo del programador es ${information}. Puedes escribirle sobre tu proyecto.`,
    ][turn % 3], intent, actions);
}
