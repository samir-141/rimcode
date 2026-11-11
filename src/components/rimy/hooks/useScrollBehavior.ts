"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { RIMY_SECTIONS } from "../rimy-config";
import type { RimySectionId } from "../types";

type ScrollBehaviorCallbacks = {
    onSectionChange?: (
        section: RimySectionId,
        previous: RimySectionId
    ) => void;
    onFastScroll?: () => void;
    onRepetitiveScroll?: () => void;
    onDwell?: (section: RimySectionId) => void;
    onDockChange?: (docked: boolean) => void;
};

const DWELL_TIME = 15000;
const FAST_SECTION_CHANGES = 3;
const REPETITIVE_SECTION_CHANGES = 5;

/**
 * Lee el scroll de la landing (que además está "secuestrado" bloque a bloque)
 * y lo convierte en señales de comportamiento para RIMY.
 */
export function useScrollBehavior(callbacks: ScrollBehaviorCallbacks) {
    const callbacksRef = useRef(callbacks);
    const pathname = usePathname();

    useEffect(() => {
        callbacksRef.current = callbacks;
    }, [callbacks]);

    useEffect(() => {
        let activeSection: RimySectionId = "hero";
        let docked = false;
        let dwellTimer: ReturnType<typeof setTimeout> | null = null;
        let frame = 0;
        let lastY = window.scrollY;
        let lastTime = performance.now();
        let lastDirection = 0;
        let lastFastAt = 0;
        let lastRepetitiveAt = 0;

        const ratios = new Map<RimySectionId, number>();
        const sectionChangeTimes: number[] = [];
        const directionChanges: number[] = [];

        const resetDwell = () => {
            if (dwellTimer) clearTimeout(dwellTimer);
            dwellTimer = setTimeout(() => {
                callbacksRef.current.onDwell?.(activeSection);
            }, DWELL_TIME);
        };

        const notifyFast = (now: number) => {
            if (now - lastFastAt < 4200) return;
            lastFastAt = now;
            callbacksRef.current.onFastScroll?.();
        };

        const notifyRepetitive = (now: number) => {
            if (now - lastRepetitiveAt < 7000) return;
            lastRepetitiveAt = now;
            callbacksRef.current.onRepetitiveScroll?.();
        };

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    ratios.set(
                        entry.target.id as RimySectionId,
                        entry.intersectionRatio
                    );
                }

                let bestSection: RimySectionId = "hero";
                let bestRatio = 0;

                for (const [section, ratio] of ratios) {
                    if (ratio > bestRatio) {
                        bestRatio = ratio;
                        bestSection = section;
                    }
                }

                if (bestRatio <= 0 || bestSection === activeSection) return;

                const previous = activeSection;
                activeSection = bestSection;

                const now = performance.now();
                sectionChangeTimes.push(now);

                while (
                    sectionChangeTimes.length &&
                    now - sectionChangeTimes[0] > 6000
                ) {
                    sectionChangeTimes.shift();
                }

                resetDwell();

                callbacksRef.current.onSectionChange?.(activeSection, previous);

                const recent = sectionChangeTimes.filter(
                    (time) => now - time < 3500
                );

                if (recent.length >= REPETITIVE_SECTION_CHANGES) {
                    notifyRepetitive(now);
                } else if (recent.length >= FAST_SECTION_CHANGES) {
                    notifyFast(now);
                }
            },
            {
                threshold: [0.25, 0.5, 0.75],
            }
        );

        for (const section of RIMY_SECTIONS) {
            const element = document.getElementById(section);
            if (element) observer.observe(element);
        }

        // En rutas sin Hero (por ejemplo /projects/[slug]) RIMY debe nacer
        // acoplada a la esquina y no intentar buscar un hueco inexistente.
        let hasHero = Boolean(document.getElementById("hero"));

        const updateDock = (y: number) => {
            hasHero = Boolean(document.getElementById("hero"));
            const viewportHeight = window.innerHeight || 1;
            const shouldDock = !hasHero
                ? true
                : docked
                  ? y > viewportHeight * 0.14
                  : y > viewportHeight * 0.3;

            if (shouldDock !== docked) {
                docked = shouldDock;
                callbacksRef.current.onDockChange?.(docked);
            }
        };

        let domObserver: MutationObserver | null = null;
        if (!hasHero && pathname === "/") {
            domObserver = new MutationObserver(() => {
                const hero = document.getElementById("hero");
                if (!hero) return;
                observer.observe(hero);
                domObserver?.disconnect();
                domObserver = null;
                updateDock(window.scrollY);
            });
            domObserver.observe(document.body, {
                childList: true,
                subtree: true,
            });
        }

        const onScroll = () => {
            if (frame) return;

            frame = requestAnimationFrame(() => {
                frame = 0;

                const now = performance.now();
                const y = window.scrollY;
                const delta = y - lastY;
                const elapsed = Math.max(16, now - lastTime);

                if (Math.abs(delta) > 6) {
                    const velocity = (Math.abs(delta) / elapsed) * 1000;

                    // El scroll libre (táctil/trackpad) puede ser muy veloz.
                    if (velocity > 3200 && Math.abs(delta) > 220) {
                        notifyFast(now);
                    }

                    resetDwell();
                }

                lastY = y;
                lastTime = now;
                updateDock(y);
            });
        };

        const onWheel = (event: WheelEvent) => {
            if (event.deltaY === 0) return;

            const now = performance.now();
            const direction = Math.sign(event.deltaY);

            if (
                lastDirection !== 0 &&
                direction !== lastDirection &&
                Math.abs(event.deltaY) > 18
            ) {
                directionChanges.push(now);
            }

            lastDirection = direction;

            while (
                directionChanges.length &&
                now - directionChanges[0] > 3000
            ) {
                directionChanges.shift();
            }

            if (directionChanges.length >= 4) {
                directionChanges.length = 0;
                notifyRepetitive(now);
            }
        };

        const onResize = () => {
            updateDock(window.scrollY);
        };

        // Estado inicial (por si se recarga o se navega a mitad de scroll).
        // Se notifica siempre para que RIMY se sincronice al cambiar de ruta:
        // por ejemplo, al volver de una ficha al Hero de la landing.
        const initialY = window.scrollY;
        docked =
            !hasHero || initialY > (window.innerHeight || 1) * 0.3;
        callbacksRef.current.onDockChange?.(docked);
        resetDwell();

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("wheel", onWheel, { passive: true });
        window.addEventListener("resize", onResize);

        return () => {
            observer.disconnect();
            domObserver?.disconnect();
            if (frame) cancelAnimationFrame(frame);
            if (dwellTimer) clearTimeout(dwellTimer);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("wheel", onWheel);
            window.removeEventListener("resize", onResize);
        };
    }, [pathname]);
}
