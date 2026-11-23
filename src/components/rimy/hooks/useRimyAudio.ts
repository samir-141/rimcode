"use client";

import { useNarration } from "../useNarration";
import { RIMY_GREETING_TEXT } from "../rimy-config";
import { speakRimy, stopNarration } from "@/lib/rimy/narration";

export function useRimyAudio() {
    const narration = useNarration();
    const welcome = narration.text === RIMY_GREETING_TEXT;
    const speaking = welcome && narration.status === "speaking";
    const loading = welcome && narration.status === "loading";
    const blocked = welcome && (narration.status === "error" || narration.status === "unsupported");

    function toggle() {
        if (speaking || loading) stopNarration();
        else speakRimy(RIMY_GREETING_TEXT, { greeting: true });
    }

    return { muted: !speaking && !loading, speaking, blocked, toggle };
}
