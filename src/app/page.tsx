"use client";

import { useEffect, useRef, useState } from "react";
import WelcomeSection from "@/components/landing/welcome/WelcomeSection";
import TechSection from "@/components/landing/sections/TechSection";
import ProjectsSection from "@/components/landing/sections/ProjectsSection";
import SimulatorSection from "@/components/landing/sections/SimulatorSection";
import MethodologySection from "@/components/landing/sections/MethodologySection";
import ContactSection from "@/components/landing/sections/ContactSection";
import BlockNavigator from "@/components/landing/navigation/BlockNavigator";

const BLOCKS = [
    { id: "hero", label: "Inicio" },
    { id: "tecnologias", label: "Tecnologías" },
    { id: "proyectos", label: "Proyectos" },
    { id: "simulador", label: "Simulador" },
    { id: "metodologia", label: "Metodología" },
    { id: "contactanos", label: "Contacto" },
];

export default function Home() {
    const [activeBlock, setActiveBlock] = useState("hero");
    const isScrollingRef = useRef(false);

    // Navegar a un bloque específico con desplazamiento suave
    const navigateToBlock = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            isScrollingRef.current = true;
            el.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
            setActiveBlock(id);
            window.dispatchEvent(new CustomEvent("rimcode:block-change", { detail: { id } }));

            // Cooldown para evitar saltos dobles mientras dura la animación
            setTimeout(() => {
                isScrollingRef.current = false;
            }, 700);
        }
    };

    // 1. Detección automática del bloque activo mediante Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                if (visible[0] && !isScrollingRef.current) {
                    const blockId = visible[0].target.id;
                    setActiveBlock(blockId);
                    window.dispatchEvent(new CustomEvent("rimcode:block-change", { detail: { id: blockId } }));
                }
            },
            {
                threshold: [0.2, 0.4, 0.6, 0.8],
                rootMargin: "-10% 0px -20% 0px",
            }
        );

        BLOCKS.forEach(({ id }) => {
            const section = document.getElementById(id);
            if (section) observer.observe(section);
        });

        // Escuchar solicitudes de navegación externas (ej. desde el header)
        const handleExternalNavigate = (e: Event) => {
            const detail = (e as CustomEvent<{ id: string }>).detail;
            if (detail?.id) {
                navigateToBlock(detail.id);
            }
        };

        window.addEventListener("rimcode:navigate-block", handleExternalNavigate);

        return () => {
            observer.disconnect();
            window.removeEventListener("rimcode:navigate-block", handleExternalNavigate);
        };
    }, []);

    // 2. Control de rueda del ratón inteligente:
    // Solo intercepta en monitores de escritorio con altura holgada (>=1024px ancho y >=750px alto).
    // En móviles, laptops compactas o si el bloque tiene overflow interno, permite scroll nativo continuo.
    useEffect(() => {
        const handleWheel = (e: WheelEvent) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest("input, textarea, select, #rimy-assistant, dialog, #mobile-navigation") ||
                e.ctrlKey || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                return;
            }

            // En dispositivos móviles, tablets o pantallas con baja altura, NUNCA interceptar la rueda
            if (window.innerWidth < 1024 || window.innerHeight < 750) {
                return;
            }

            if (isScrollingRef.current) {
                e.preventDefault();
                return;
            }

            // Si el bloque actual excede la altura de la ventana, permitir desplazarse por su contenido
            const currentElement = document.getElementById(activeBlock);
            if (currentElement) {
                const hasOverflow = currentElement.scrollHeight > window.innerHeight + 25;
                if (hasOverflow) {
                    const rect = currentElement.getBoundingClientRect();
                    // Si el usuario hace scroll hacia abajo pero aún no ha llegado al fondo del bloque
                    if (e.deltaY > 0 && rect.bottom > window.innerHeight + 15) {
                        return; // Permite el scroll nativo dentro del bloque
                    }
                    // Si el usuario hace scroll hacia arriba pero aún no ha llegado a la cima del bloque
                    if (e.deltaY < 0 && rect.top < -15) {
                        return; // Permite el scroll nativo dentro del bloque
                    }
                }
            }

            const threshold = 35;
            if (Math.abs(e.deltaY) < threshold) return;

            const currentIndex = BLOCKS.findIndex((b) => b.id === activeBlock);
            if (currentIndex === -1) return;

            if (e.deltaY > threshold && currentIndex < BLOCKS.length - 1) {
                e.preventDefault();
                navigateToBlock(BLOCKS[currentIndex + 1].id);
            } else if (e.deltaY < -threshold && currentIndex > 0) {
                e.preventDefault();
                navigateToBlock(BLOCKS[currentIndex - 1].id);
            }
        };

        window.addEventListener("wheel", handleWheel, { passive: false });
        return () => window.removeEventListener("wheel", handleWheel);
    }, [activeBlock]);

    // 3. Control de teclado accesible (solo cuando no se esté escribiendo en campos de formulario)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            if (target?.closest("a, button, input, textarea, select, [contenteditable], #rimy-assistant, dialog, #mobile-navigation") ||
                window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                return;
            }

            // Solo aplicar atajos de bloque en pantallas desktop
            if (window.innerWidth < 1024) return;

            const currentIndex = BLOCKS.findIndex((b) => b.id === activeBlock);
            if (currentIndex === -1) return;

            if (e.key === "PageDown") {
                if (currentIndex < BLOCKS.length - 1) {
                    e.preventDefault();
                    navigateToBlock(BLOCKS[currentIndex + 1].id);
                }
            } else if (e.key === "PageUp") {
                if (currentIndex > 0) {
                    e.preventDefault();
                    navigateToBlock(BLOCKS[currentIndex - 1].id);
                }
            } else if (e.key === "Home") {
                e.preventDefault();
                navigateToBlock(BLOCKS[0].id);
            } else if (e.key === "End") {
                e.preventDefault();
                navigateToBlock(BLOCKS[BLOCKS.length - 1].id);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeBlock]);

    return (
        <div data-rimcode-landing className="relative w-full overflow-x-hidden bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
            {/* NAVEGADOR FLOTANTE LATERAL (INDICADOR DE BLOQUES, VISIBLE EN PANTALLAS XL) */}
            <BlockNavigator
                activeBlock={activeBlock}
                onNavigate={navigateToBlock}
                blocks={BLOCKS}
            />

            {/* CONTENEDOR DE BLOQUES RESPONSIVOS (SIN OVERFLOW TRAPS) */}
            <main className="w-full overflow-x-hidden">
                {/* BLOQUE 1: INICIO / HERO CON RIMBOT */}
                <section
                    id="hero"
                    className="block-section w-full min-h-[100dvh] relative flex flex-col justify-center pt-[68px] sm:pt-[76px] lg:pt-[82px]"
                >
                    <WelcomeSection />
                </section>

                {/* BLOQUE 2: STACK TECNOLÓGICO */}
                <section
                    id="tecnologias"
                    className="block-section w-full min-h-[100dvh] relative flex flex-col justify-center pt-[68px] sm:pt-[76px] lg:pt-[82px] border-t border-[var(--header-border)]"
                >
                    <TechSection />
                </section>

                {/* BLOQUE 3: PROYECTOS & CASOS DE ÉXITO */}
                <section
                    id="proyectos"
                    className="block-section w-full min-h-[100dvh] relative flex flex-col justify-center pt-[68px] sm:pt-[76px] lg:pt-[82px] border-t border-[var(--header-border)]"
                >
                    <ProjectsSection />
                </section>

                {/* BLOQUE 4: SIMULADOR DE PRESUPUESTO */}
                <section
                    id="simulador"
                    className="block-section w-full min-h-[100dvh] relative flex flex-col justify-center pt-[68px] sm:pt-[76px] lg:pt-[82px] border-t border-[var(--header-border)]"
                >
                    <SimulatorSection />
                </section>

                {/* BLOQUE 5: METODOLOGÍA CLEAN CODE */}
                <section
                    id="metodologia"
                    className="block-section w-full min-h-[100dvh] relative flex flex-col justify-center pt-[68px] sm:pt-[76px] lg:pt-[82px] border-t border-[var(--header-border)]"
                >
                    <MethodologySection />
                </section>

                {/* BLOQUE 6: CONTACTO & PIE DE PÁGINA */}
                <section
                    id="contactanos"
                    className="block-section w-full min-h-[100dvh] relative flex flex-col justify-between pt-[68px] sm:pt-[76px] lg:pt-[82px] border-t border-[var(--header-border)]"
                >
                    <ContactSection />
                </section>
            </main>
        </div>
    );
}
