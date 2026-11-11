"use client";

import { useEffect } from "react";
import {
    useRive,
    useStateMachineInput,
} from "@rive-app/react-webgl2";
import type { RimyAnimation } from "./types";

type RiveRimyProps = {
    animation: RimyAnimation;
    onUnavailable: () => void;
};

const MACHINE = "RimyMachine";

/**
 * Backend opcional Rive.
 *
 * Por defecto RIMY usa el rig SVG (no requiere descargar binarios ni WebGL).
 * Si defines NEXT_PUBLIC_RIMY_RIVE_SRC, este componente toma el control y
 * alimenta la State Machine con los parámetros documentados en el README.
 */
export default function RiveRimy({
    animation,
    onUnavailable,
}: RiveRimyProps) {
    const src = process.env.NEXT_PUBLIC_RIMY_RIVE_SRC;

    const { rive, RiveComponent } = useRive({
        src: src ?? "",
        stateMachine: MACHINE,
        autoplay: true,
        onLoadError: () => onUnavailable(),
    });

    const isGreeting = useStateMachineInput(
        rive,
        MACHINE,
        "isGreeting"
    );
    const isRunning = useStateMachineInput(rive, MACHINE, "isRunning");
    const isFalling = useStateMachineInput(rive, MACHINE, "isFalling");
    const isAnnoyed = useStateMachineInput(rive, MACHINE, "isAnnoyed");
    const isHappy = useStateMachineInput(rive, MACHINE, "isHappy");
    const isThinking = useStateMachineInput(rive, MACHINE, "isThinking");
    const isTalking = useStateMachineInput(rive, MACHINE, "isTalking");
    const isError = useStateMachineInput(rive, MACHINE, "isError");
    const isIdle = useStateMachineInput(rive, MACHINE, "isIdle");

    const greetTrigger = useStateMachineInput(
        rive,
        MACHINE,
        "triggerGreet"
    );
    const fallTrigger = useStateMachineInput(
        rive,
        MACHINE,
        "triggerFall"
    );
    const celebrateTrigger = useStateMachineInput(
        rive,
        MACHINE,
        "triggerCelebrate"
    );

    useEffect(() => {
        if (!rive) return;

        const values: Array<[typeof isGreeting, boolean]> = [
            [isGreeting, animation === "greeting"],
            [isRunning, animation === "run"],
            [isFalling, animation === "fall"],
            [isAnnoyed, animation === "annoyed"],
            [isHappy, animation === "happy"],
            [isThinking, animation === "thinking"],
            [isTalking, animation === "talking"],
            [isError, animation === "error"],
            [isIdle, animation === "idle"],
        ];

        for (const [input, value] of values) {
            if (input) input.value = value;
        }
    }, [
        rive,
        animation,
        isGreeting,
        isRunning,
        isFalling,
        isAnnoyed,
        isHappy,
        isThinking,
        isTalking,
        isError,
        isIdle,
    ]);

    useEffect(() => {
        if (!rive) return;

        if (animation === "greeting") greetTrigger?.fire();
        if (animation === "fall") fallTrigger?.fire();
        if (animation === "happy") celebrateTrigger?.fire();
    }, [
        rive,
        animation,
        greetTrigger,
        fallTrigger,
        celebrateTrigger,
    ]);

    if (!src) return null;

    return (
        <RiveComponent
            className="h-full w-full"
            aria-label="RIMY, mascota interactiva de RimCode"
        />
    );
}
