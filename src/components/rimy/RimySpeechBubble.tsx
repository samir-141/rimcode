"use client";

import type { RimyMessage, RimyMode, RimyTone } from "./types";
import { SpeakerIcon } from "./RimyIcons";
import styles from "./RimyUI.module.css";

type RimySpeechBubbleProps = {
    message: RimyMessage;
    mode: RimyMode;
    hidden?: boolean;
    audioBlocked?: boolean;
    onEnableAudio?: () => void;
    onDismiss: () => void;
};

const toneClass: Record<RimyTone, string> = {
    neutral: styles.toneNeutral,
    happy: styles.toneHappy,
    annoyed: styles.toneAnnoyed,
    surprised: styles.toneSurprised,
    thinking: styles.toneThinking,
};

export default function RimySpeechBubble({
    message,
    mode,
    hidden = false,
    audioBlocked = false,
    onEnableAudio,
    onDismiss,
}: RimySpeechBubbleProps) {
    return (
        <div
            key={message.id}
            className={`${styles.bubble} ${
                mode === "hero" ? styles.bubbleHero : styles.bubbleDocked
            } ${toneClass[message.tone]} ${
                hidden ? styles.bubbleHidden : ""
            }`}
            role="status"
            aria-live="polite"
        >
            <div className={styles.bubbleHead}>
                <span className={styles.bubbleBrand}>
                    <span className={styles.brandDot} aria-hidden="true" />
                    RIMY
                </span>

                <button
                    type="button"
                    className={styles.bubbleClose}
                    onClick={onDismiss}
                    aria-label="Ocultar mensaje de RIMY"
                >
                    ✕
                </button>
            </div>

            <p className={styles.bubbleText}>{message.text}</p>

            {audioBlocked && onEnableAudio && (
                <button
                    type="button"
                    className={styles.bubbleAction}
                    onClick={onEnableAudio}
                >
                    <SpeakerIcon className={styles.bubbleActionIcon} />
                    Activar voz
                </button>
            )}

            <span
                className={`${styles.tail} ${styles.tailBottom}`}
                aria-hidden="true"
            />
            <span
                className={`${styles.tail} ${styles.tailRight}`}
                aria-hidden="true"
            />
        </div>
    );
}
