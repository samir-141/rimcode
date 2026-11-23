"use client";

import { SpeakerIcon } from "./RimyIcons";
import styles from "./RimyUI.module.css";

type RimyAudioProps = {
    muted: boolean;
    blocked: boolean;
    speaking: boolean;
    onToggle: () => void;
    className?: string;
};

export default function RimyAudio({
    muted,
    blocked,
    speaking,
    onToggle,
    className = "",
}: RimyAudioProps) {
    const label = muted ? "Escuchar saludo de Rimy" : "Detener saludo de Rimy";

    return (
        <button
            type="button"
            onClick={onToggle}
            className={`${styles.audioButton} ${
                blocked ? styles.audioBlocked : ""
            } ${speaking ? styles.audioSpeaking : ""} ${className}`}
            aria-label={label}
            aria-pressed={!muted}
            title={label}
        >
            {speaking ? (
                <span className={styles.equalizer} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                </span>
            ) : (
                <SpeakerIcon
                    className={styles.audioIcon}
                    muted={muted || blocked}
                />
            )}
        </button>
    );
}
