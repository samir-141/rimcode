import type { ActionId } from "./intent";

const contactKey = "rimy:contact-turn";
export const simulatorEvent = "rimy:simulator-turn";

export function readRimyGrant(key = contactKey) {
    try { return sessionStorage.getItem(key) ?? undefined; } catch { return undefined; }
}

export function clearRimyGrant(key = contactKey) {
    try { sessionStorage.removeItem(key); } catch { /* El almacenamiento puede estar deshabilitado. */ }
}

export function sendRimyEvent(turnGrant: string, evento: "boton_clic" | "simulador_abierto", accion?: ActionId) {
    void fetch("/api/rimy/event", {
        method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
        body: JSON.stringify({ turnGrant, evento, accion }),
    }).catch(() => {});
}

export function recordRimyAction(turnGrant: string | undefined, action: ActionId) {
    if (!turnGrant) return;
    sendRimyEvent(turnGrant, "boton_clic", action);
    try {
        if (action === "simulador" || action === "formulario") sessionStorage.setItem(contactKey, turnGrant);
        if (action === "simulador") sessionStorage.setItem(simulatorEvent, turnGrant);
    } catch { /* El evento cubre el simulador cuando está montado. */ }
    if (action === "simulador") window.dispatchEvent(new CustomEvent(simulatorEvent, { detail: turnGrant }));
}
