"use client";

import { useSyncExternalStore } from "react";
import {
    getNarrationSnapshot,
    subscribeNarration,
    type NarrationState,
} from "@/lib/rimy/narration";

export function useNarration(): NarrationState {
    return useSyncExternalStore(
        subscribeNarration,
        getNarrationSnapshot,
        getNarrationSnapshot
    );
}
