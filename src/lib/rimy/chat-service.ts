import { answerLocally } from "./knowledge";

export type ChatTurn = {
    role: "user" | "assistant";
    content: string;
};

export type AiResult =
    | { ok: true; reply: string }
    | { ok: false; error: string; detail?: string };

export function isAiConfigured(): boolean {
    return false;
}

export function getAiConfigurationMissing(): string[] {
    return [];
}

export async function answerWithAi(
    message: string
): Promise<AiResult> {
    const local = answerLocally(message);
    return {
        ok: true,
        reply: local.reply,
    };
}
