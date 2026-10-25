import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Phase = "idle" | "covering" | "revealing";
type Request = { simple: boolean; focus: HTMLElement | null };

export default function useModeTransition() {
    const [simple, setSimple] = useState(true);
    const [phase, setPhase] = useState<Phase>("idle");
    const overlayRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<Request | null>(null);
    const cancelRef = useRef<(() => void) | null>(null);
    const simpleScroll = useRef({ left: 0, top: 0 });

    const changeMode = useCallback((nextSimple: boolean) => {
        if (requestRef.current || nextSimple === simple) return;
        const focus = document.activeElement;
        requestRef.current = { simple: nextSimple, focus: focus instanceof HTMLElement ? focus : null };
        if (simple) simpleScroll.current = { left: window.scrollX, top: window.scrollY };
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setSimple(nextSimple);
        } else {
            setPhase("covering");
        }
    }, [simple]);

    useLayoutEffect(() => {
        const request = requestRef.current;
        if (!request || phase === "covering") return;
        // Restore scrolling behind the black overlay, before the new layout is revealed.
        window.scrollTo({ ...(simple ? simpleScroll.current : { left: 0, top: 0 }), behavior: "instant" });
        if (phase !== "idle") return;
        requestRef.current = null;
        const candidates = [request.focus,
            document.querySelector<HTMLElement>(".header-nav .mode-selector [aria-pressed='true']"),
            document.querySelector<HTMLElement>(".mobile-menu-toggle")];
        candidates.find(element => element && element !== document.body && element.isConnected && element.getClientRects().length)?.focus({ preventScroll: true });
    }, [simple, phase]);

    useEffect(() => {
        const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onChange = () => {
            const request = requestRef.current;
            if (!preference.matches || !request) return;
            cancelRef.current?.();
            setSimple(request.simple);
            setPhase("idle");
        };
        preference.addEventListener("change", onChange);
        return () => preference.removeEventListener("change", onChange);
    }, []);

    useEffect(() => {
        const overlay = overlayRef.current;
        if (phase === "idle" || !overlay) return;
        let cancelled = false;
        let animation: Animation | null = null;
        let frame = 0;
        const nextFrame = () => new Promise<void>(resolve => {
            frame = requestAnimationFrame(() => { frame = 0; resolve(); });
        });
        const cancel = () => {
            cancelled = true;
            cancelAnimationFrame(frame);
            animation?.cancel();
        };
        cancelRef.current = cancel;

        if (phase === "covering") {
            animation = overlay.animate([{ opacity: 0 }, { opacity: 1 }], {
                duration: 120, easing: "ease-in", fill: "forwards",
            });
            void animation.finished.then(() => {
                if (cancelled || !requestRef.current) return;
                // React commits both changes together while the overlay remains opaque.
                setSimple(requestRef.current.simple);
                setPhase("revealing");
            }, () => {});
        } else {
            void (async () => {
                await nextFrame();
                if (cancelled) return;
                // Only local procedural images matter here; never wait on remote fonts or lazy galleries.
                const images = document.querySelectorAll<HTMLImageElement>(".space-scene .star-texture, .space-scene .planet-texture");
                await Promise.allSettled(Array.from(images, image => image.decode()));
                if (cancelled) return;
                await nextFrame();
                if (cancelled) return;
                animation = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
                    duration: 220, easing: "ease-out", fill: "forwards",
                });
                await animation.finished.catch(() => {});
                if (!cancelled) setPhase("idle");
            })();
        }

        return () => {
            cancel();
            if (cancelRef.current === cancel) cancelRef.current = null;
        };
    }, [phase]);

    useEffect(() => {
        if (phase === "idle") return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (!requestRef.current || event.altKey || event.ctrlKey || event.metaKey) return;
            if (!["Tab", "Enter", " ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) return;
            event.preventDefault();
            event.stopPropagation();
        };
        const onWheel = (event: WheelEvent) => {
            if (requestRef.current && !event.ctrlKey) event.preventDefault();
        };
        document.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("wheel", onWheel, { passive: false });
        return () => {
            document.removeEventListener("keydown", onKeyDown, true);
            document.removeEventListener("wheel", onWheel);
        };
    }, [phase]);

    return { simple, changeMode, phase, overlayRef };
}
