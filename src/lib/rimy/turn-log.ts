import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { isAbsolute, join } from "node:path";
import type { ChatAnswer } from "./commercial";
import type { ActionId, IntentResult } from "./intent";

const expiresIn = 2 * 60 * 60_000;
const availableActions = new Set<string>(["simulador", "formulario", "whatsapp", "correo", "elegir_reunion", "elegir_cotizar", "elegir_hosting", "elegir_contacto"]);
type TurnGrant = { id: string; until: number; actions: ActionId[] };

async function record(event: Record<string, unknown>) {
    const directory = process.env.RIMY_LOG_DIR?.trim();
    if (!directory || !isAbsolute(directory) || !signingKey()) return false;
    const fecha = new Date().toISOString();
    try {
        await mkdir(directory, { recursive: true, mode: 0o700 });
        await appendFile(join(directory, `turnos-${fecha.slice(0, 10)}.jsonl`), JSON.stringify({ fecha, ...event }) + "\n", { encoding: "utf8", mode: 0o600 });
        return true;
    } catch {
        console.warn("[rimy-log] No se pudo escribir el registro de turnos");
        return false;
    }
}

function signingKey() {
    const key = process.env.RIMY_LOG_SIGNING_KEY?.trim();
    return key && key.length >= 32 ? key : undefined;
}

function signature(payload: string, key: string) {
    return createHmac("sha256", key).update(`rimy-turn:${payload}`).digest("base64url");
}

function verify(grant: unknown): TurnGrant | undefined {
    const key = signingKey();
    if (!key || typeof grant !== "string" || !/^[\w-]{20,430}\.[\w-]{43}$/.test(grant)) return;
    const [payload, signed] = grant.split(".");
    if (!timingSafeEqual(Buffer.from(signed), Buffer.from(signature(payload, key)))) return;
    const turn = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as TurnGrant;
    if (turn.until > Date.now()) return turn;
}

function redact(message: string) {
    return message.replace(/[\p{L}\d._%+-]+@[\p{L}\d.-]+/gu, "[correo omitido]")
        .replace(/(?<!\d)(?:\+?\d[ ()\-.]*){7,}\d(?!\d)/g, "[número omitido]");
}

export async function recordTurn(message: string, decision: IntentResult, source: string, answer: ChatAnswer) {
    const id = randomUUID();
    const key = signingKey();
    if (!key) return;
    const actions = answer.actions?.map(({ id }) => id) ?? [];
    if (!await record({ evento: "turno", turno: id, mensaje: redact(message), ...decision, clasificador: source,
        respuesta: answer.reply, tabla: answer.table, botones_mostrados: actions,
        boton_clic: null, simulador_abierto: false, dejo_contacto: false })) return;
    if (!actions.length) return;
    const payload = Buffer.from(JSON.stringify({ id, until: Date.now() + expiresIn, actions })).toString("base64url");
    return `${payload}.${signature(payload, key)}`;
}

export async function recordChatEvent(grant: unknown, event: unknown, action?: unknown) {
    const turn = verify(grant);
    if (!turn) return false;
    if (event === "boton_clic" && typeof action === "string" && availableActions.has(action) && turn.actions.includes(action as ActionId)) {
        await record({ evento: event, turno: turn.id, boton_clic: action });
    } else if (event === "simulador_abierto" && turn.actions.includes("simulador")) {
        await record({ evento: event, turno: turn.id, simulador_abierto: true });
    } else if (event === "dejo_contacto" && (turn.actions.includes("formulario") || turn.actions.includes("simulador"))) {
        await record({ evento: event, turno: turn.id, dejo_contacto: true });
    } else return false;
    return true;
}
