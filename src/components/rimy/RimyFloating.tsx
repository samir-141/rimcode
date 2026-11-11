"use client";

import RimyAudio from "./RimyAudio";
import { WaveIcon } from "./RimyIcons";
import styles from "./RimyUI.module.css";

type RimyFloatingProps = {
    muted: boolean;
    blocked: boolean;
    speaking: boolean;
    onToggleAudio: () => void;
    onWave: () => void;
};

export default function RimyFloating({
    muted,
    blocked,
    speaking,
    onToggleAudio,
    onWave,
}: RimyFloatingProps) {
    return (
        <div className={styles.rail} role="group" aria-label="Controles de RIMY">
            <button
                type="button"
                className={styles.railButton}
                onClick={onWave}
                aria-label="Saludar a RIMY"
                title="Saludar a RIMY"
            >
                <WaveIcon className={styles.railButtonIcon} />
            </button>

            <RimyAudio
                muted={muted}
                blocked={blocked}
                speaking={speaking}
                onToggle={onToggleAudio}
            />
        </div>
    );
}
