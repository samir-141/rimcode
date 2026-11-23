"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { CURRENCIES, setAppCurrency, useCurrency, type Currency } from "@/lib/currency";

const NAV_ITEMS = [
    { id: "hero", label: "Inicio" },
    { id: "tecnologias", label: "Tecnologías" },
    { id: "proyectos", label: "Proyectos" },
    { id: "simulador", label: "Simulador" },
    { id: "metodologia", label: "Metodología" },
    { id: "contactanos", label: "Contacto" },
];

// ==========================================
// STORE EXTERNO PARA TEMA (REACT 19 IDIOMATIC)
// ==========================================
let currentTheme: boolean | null = null;
const themeListeners = new Set<() => void>();

function getThemeSnapshot(): boolean {
    if (typeof window === "undefined") return true;
    if (currentTheme !== null) return currentTheme;

    let saved: string | null = null;
    try {
        saved = localStorage.getItem("rimcode-theme");
    } catch {
        // Se mantiene la preferencia del sistema si el navegador bloquea el almacenamiento.
    }
    if (saved !== null) {
        currentTheme = saved === "dark";
    } else {
        currentTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    document.documentElement.classList.toggle("dark", currentTheme);
    document.documentElement.classList.toggle("light", !currentTheme);
    return currentTheme;
}

function setAppTheme(dark: boolean) {
    currentTheme = dark;
    try {
        localStorage.setItem("rimcode-theme", dark ? "dark" : "light");
    } catch {
        // El cambio sigue activo durante la visita.
    }
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.classList.toggle("light", !dark);
    themeListeners.forEach((listener) => listener());
}

function subscribeTheme(listener: () => void) {
    themeListeners.add(listener);
    return () => themeListeners.delete(listener);
}

// ==========================================
// COMPONENTE HEADER
// ==========================================
export default function HeadLanding() {
    const pathname = usePathname();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState("hero");
    const [menuOpen, setMenuOpen] = useState(false);

    // Estados reactivos sincronizados
    const isDark = useSyncExternalStore<boolean>(subscribeTheme, getThemeSnapshot, () => true);
    const { currency, rates, lastUpdate, loading: loadingRates } = useCurrency();

    // 1. Alternar tema
    const toggleTheme = useCallback(() => {
        setAppTheme(!isDark);
    }, [isDark]);

    // 2. Cambiar moneda seleccionada
    const handleCurrencyChange = (newCurrency: Currency) => {
        setAppCurrency(newCurrency);
    };

    // 3. Navegación coordinada con la landing o redirección a /
    const navigateTo = (id: string) => {
        setMenuOpen(false);

        if (pathname !== "/") {
            router.push(`/#${id}`);
            return;
        }

        const target = document.getElementById(id);
        if (target) {
            target.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        } else if (id === "hero") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }

        setActiveSection(id);
        // Notificar a observadores si hay componentes escuchando
        window.dispatchEvent(new CustomEvent("rimcode:navigate-block", { detail: { id } }));
    };

    // 4. Escuchar evento de navegación global para mantener sincronizado el header
    useEffect(() => {
        const handleBlockChange = (e: Event) => {
            const detail = (e as CustomEvent<{ id: string }>).detail;
            if (detail?.id) {
                setActiveSection(detail.id);
            }
        };

        window.addEventListener("rimcode:block-change", handleBlockChange);
        return () => window.removeEventListener("rimcode:block-change", handleBlockChange);
    }, []);

    // 5. Observador de sección activa y seguimiento de scroll en la landing
    useEffect(() => {
        if (pathname !== "/") {
            return;
        }
        const handleScroll = () => {
            if (window.scrollY < 80) {
                setActiveSection("hero");
                return;
            }

            const isNearBottom =
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 60;
            if (isNearBottom) {
                setActiveSection(NAV_ITEMS[NAV_ITEMS.length - 1].id);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });

        const sections = NAV_ITEMS.map(({ id }) =>
            document.getElementById(id)
        ).filter((section): section is HTMLElement => section !== null);

        if (sections.length === 0) {
            return () => window.removeEventListener("scroll", handleScroll);
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (window.scrollY < 80) return;
                const isNearBottom =
                    window.innerHeight + window.scrollY >=
                    document.documentElement.scrollHeight - 60;
                if (isNearBottom) return;

                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                if (visible[0]) {
                    setActiveSection(visible[0].target.id);
                }
            },
            {
                rootMargin: "-15% 0px -50% 0px",
                threshold: [0.1, 0.25, 0.5, 0.75],
            }
        );

        sections.forEach((section) => observer.observe(section));

        return () => {
            window.removeEventListener("scroll", handleScroll);
            observer.disconnect();
        };
    }, [pathname]);

    // 5. Accesibilidad, teclas y bloqueo de scroll para menú móvil
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setMenuOpen(false);
            }
        };

        const onResize = () => {
            if (window.innerWidth >= 1024) {
                setMenuOpen(false);
            }
        };

        if (menuOpen) {
            window.addEventListener("keydown", onKeyDown);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        window.addEventListener("resize", onResize);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("resize", onResize);
            document.body.style.overflow = "";
        };
    }, [menuOpen]);

    const effectiveActiveSection = pathname === "/" ? activeSection : "";

    return (
        <>
            <header
                className={`rim-header ${isDark ? "theme-dark" : "theme-light"}${menuOpen ? " menu-open" : ""}`}
            >
                <div className="header-container">
                    {/* LOGOTIPO */}
                    <Link
                        href="/#hero"
                        className="rim-logo"
                        onClick={(e) => {
                            if (pathname === "/") {
                                e.preventDefault();
                                navigateTo("hero");
                            }
                        }}
                        aria-label="RimCode - Ir al inicio"
                    >
                        <span className="logo-symbol">&lt;/&gt;</span>

                        <span className="logo-word">
                            {"RimCode".split("").map((letter, index) => (
                                <span
                                    key={index}
                                    className="logo-letter"
                                    style={{ "--i": index } as React.CSSProperties}
                                >
                                    {letter}
                                </span>
                            ))}
                        </span>

                        <span className="logo-dot">.</span>
                    </Link>

                    {/* NAVEGACIÓN DESKTOP */}
                    <nav className="desktop-nav" aria-label="Navegación principal">
                        <div className="nav-track">
                            {NAV_ITEMS.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => navigateTo(item.id)}
                                    className={`nav-link ${effectiveActiveSection === item.id ? "active" : ""
                                        }`}
                                    aria-current={
                                        effectiveActiveSection === item.id ? "page" : undefined
                                    }
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </nav>

                    {/* CONTROLES */}
                    <div className="header-actions">
                        {/* SELECTOR DE MONEDA */}
                        <div className="currency-control">
                            <span className="currency-indicator" aria-hidden="true" />

                            <select
                                aria-label="Seleccionar moneda preferida"
                                value={currency}
                                onChange={(event) =>
                                    handleCurrencyChange(event.target.value as Currency)
                                }
                            >
                                {CURRENCIES.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>

                            <div className="currency-info" aria-live="polite">
                                <span>
                                    {loadingRates ? "Actualizando..." : "1 USD ="}
                                </span>
                                <strong>
                                    {(rates[currency] ?? 1).toFixed(3)} {currency}
                                </strong>
                                {lastUpdate && (
                                    <small>Actualizado {lastUpdate}</small>
                                )}
                            </div>
                        </div>

                        {/* INTERRUPTOR MODO CLARO / OSCURO */}
                        <button
                            type="button"
                            className={`theme-toggle ${isDark ? "dark" : "light"}`}
                            onClick={toggleTheme}
                            aria-label={
                                isDark
                                    ? "Cambiar a modo claro"
                                    : "Cambiar a modo oscuro"
                            }
                            title={isDark ? "Modo claro" : "Modo oscuro"}
                        >
                            <span className="theme-sky">
                                <span className="theme-sun" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="4" />
                                        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
                                    </svg>
                                </span>
                                <span className="theme-moon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24" fill="none">
                                        <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />
                                    </svg>
                                </span>
                            </span>
                        </button>

                        {/* BOTÓN MENÚ MÓVIL (HAMBURGUESA) */}
                        <button
                            type="button"
                            className={`mobile-menu-button ${menuOpen ? "open" : ""}`}
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
                            aria-expanded={menuOpen}
                            aria-controls="mobile-navigation"
                        >
                            {menuOpen ? (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            ) : (
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="h-5 w-5"
                                    aria-hidden="true"
                                >
                                    <line x1="4" y1="6" x2="20" y2="6" />
                                    <line x1="4" y1="12" x2="20" y2="12" />
                                    <line x1="4" y1="18" x2="20" y2="18" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* MENÚ MÓVIL DESPLEGABLE */}
                <div
                    id="mobile-navigation"
                    className={`mobile-nav ${menuOpen ? "visible" : ""}`}
                    aria-hidden={!menuOpen}
                >
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => navigateTo(item.id)}
                            className={effectiveActiveSection === item.id ? "active" : ""}
                        >
                            {item.label}
                            <span className="mobile-arrow" aria-hidden="true">↗</span>
                        </button>
                    ))}

                    {/* DETALLE DE TIPO DE CAMBIO EN MÓVIL */}
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-black/10 bg-black/5 px-3.5 py-2.5 text-xs dark:border-white/10 dark:bg-white/5">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--header-muted)]">
                            {loadingRates ? "Actualizando..." : "Tipo de cambio"}
                        </span>
                        <div className="text-right font-mono">
                            <strong className="text-[var(--header-text)]">
                                1 USD = {(rates[currency] ?? 1).toFixed(3)} {currency}
                            </strong>
                            {lastUpdate && (
                                <small className="block text-[9px] text-[var(--header-muted)]">
                                    Actualizado {lastUpdate}
                                </small>
                            )}
                        </div>
                    </div>

                </div>
            </header>

            {/* TELÓN DE FONDO (BACKDROP) PARA MENÚ MÓVIL */}
            {menuOpen && (
                <div
                    className="mobile-nav-backdrop"
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                />
            )}
        </>
    );
}
