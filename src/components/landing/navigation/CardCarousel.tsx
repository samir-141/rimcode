"use client";

import { Children, useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

type Drag = { id: number; x: number; left: number; engaged: boolean };

export default function CardCarousel({ label, id, children }: { label: string; id: string; children: ReactNode }) {
    const rail = useRef<HTMLUListElement>(null);
    const gesture = useRef<Drag | null>(null);
    const suppressClick = useRef(false);
    const [position, setPosition] = useState({ first: 1, last: 1, previous: false, next: false });
    const cards = Children.toArray(children);

    useEffect(() => {
        const element = rail.current;
        if (!element) return;

        function update() {
            if (!element) return;
            const children = [...element.children];
            const bounds = element.getBoundingClientRect();
            const visible = children.flatMap((child, index) => {
                const { left, right } = child.getBoundingClientRect();
                const overlap = Math.min(right, bounds.right) - Math.max(left, bounds.left);
                return overlap > (right - left) / 2 ? [index + 1] : [];
            });
            const previous = element.scrollLeft > 2;
            const next = element.scrollLeft + element.clientWidth < element.scrollWidth - 2;
            const first = visible[0] ?? 1;
            const last = visible.at(-1) ?? first;
            setPosition((old) => old.first === first && old.last === last && old.previous === previous && old.next === next ?
                old : { first, last, previous, next });
        }

        const observer = new ResizeObserver(update);
        observer.observe(element);
        element.addEventListener("scroll", update, { passive: true });
        update();

        return () => {
            observer.disconnect();
            element.removeEventListener("scroll", update);
        };
    }, []);

    function step(direction: -1 | 1) {
        const element = rail.current;
        if (!element) return;
        const [first, second] = [...element.children];
        if (!first || !second) return;
        const distance = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
        element.scrollBy({
            left: distance * direction,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        });
    }

    function move(event: PointerEvent<HTMLUListElement>) {
        const drag = gesture.current;
        if (!drag || drag.id !== event.pointerId) return;
        const difference = event.clientX - drag.x;
        if (!drag.engaged) {
            if (Math.abs(difference) < 6) return;
            drag.engaged = true;
            suppressClick.current = true;
            event.currentTarget.dataset.dragging = "true";
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        event.preventDefault();
        event.currentTarget.scrollLeft = drag.left - difference;
    }

    function finish(event: PointerEvent<HTMLUListElement>) {
        if (gesture.current?.id !== event.pointerId) return;
        gesture.current = null;
        delete event.currentTarget.dataset.dragging;
    }

    if (!cards.length) return null;

    const controlStyle = "grid size-10 place-items-center rounded-lg border border-[var(--header-border)] text-lg text-[var(--header-text)] hover:border-[var(--accent)] disabled:opacity-30";

    return (
        <div role="region" aria-label={label} className="min-w-0">
            <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs text-[var(--header-muted)]">
                    {cards.length > 1 && <span className="hidden sm:inline">Arrastra o usa las flechas · </span>}
                    <span aria-live="polite">{position.first === position.last ? position.first : `${position.first}–${position.last}`} de {cards.length}</span>
                </p>
                <div className="flex gap-1.5">
                    <button type="button" className={controlStyle} aria-controls={id} aria-label={`Anterior en ${label}`}
                        disabled={!position.previous} onClick={() => step(-1)}>‹</button>
                    <button type="button" className={controlStyle} aria-controls={id} aria-label={`Siguiente en ${label}`}
                        disabled={!position.next} onClick={() => step(1)}>›</button>
                </div>
            </div>
            <ul id={id} ref={rail} tabIndex={0} aria-label={`Tarjetas de ${label}`}
                className="card-carousel"
                onPointerDown={(event) => {
                    suppressClick.current = false;
                    if (event.pointerType !== "mouse" || event.button !== 0 ||
                        event.currentTarget.scrollWidth <= event.currentTarget.clientWidth + 2) return;
                    if ((event.target as HTMLElement).closest("input[type=range], input[type=number], select, textarea")) return;
                    gesture.current = { id: event.pointerId, x: event.clientX, left: event.currentTarget.scrollLeft, engaged: false };
                }}
                onPointerMove={move}
                onPointerUp={finish}
                onPointerCancel={finish}
                onLostPointerCapture={finish}
                onPointerLeave={(event) => { if (!gesture.current?.engaged) finish(event); }}
                onDragStart={(event) => event.preventDefault()}
                onClickCapture={(event) => {
                    if (!suppressClick.current || event.detail === 0) return;
                    suppressClick.current = false;
                    event.preventDefault();
                    event.stopPropagation();
                }}
                onKeyDown={(event) => {
                    if (event.target !== event.currentTarget || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
                    event.preventDefault();
                    step(event.key === "ArrowLeft" ? -1 : 1);
                }}>
                {Children.map(children, (card) => <li className="card-carousel-item">{card}</li>)}
            </ul>
        </div>
    );
}
