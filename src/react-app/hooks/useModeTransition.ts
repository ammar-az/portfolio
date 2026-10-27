import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

type Phase = "idle" | "covering" | "revealing";
type Request = { simple: boolean; focus: HTMLElement | null; anchor: boolean };

export default function useModeTransition(defaultMode: "simple" | "space" = "simple") {
    const [initialSimple] = useState(() => window.location.hash ? window.location.hash !== "#space" : defaultMode !== "space");
    const [simple, setSimple] = useState(initialSimple);
    const [phase, setPhase] = useState<Phase>(() => initialSimple ? "idle" : "revealing");
    const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
    const overlayRef = useRef<HTMLDivElement>(null);
    const headerOverlayRef = useRef<HTMLDivElement>(null);
    const requestRef = useRef<Request | null>(null);
    const spaceReady = useRef(false);
    const readyResolver = useRef<(() => void) | null>(null);
    const simpleScroll = useRef({ left: 0, top: 0 });
    const simpleHash = useRef(window.location.hash === "#space" ? "" : window.location.hash);
    useLayoutEffect(() => {
        // Normalize a remembered Space entry before URL synchronization runs.
        if (!initialSimple && !window.location.hash) {
            window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search + "#space");
        }
    }, [initialSimple]);
    const onSpaceReady = useCallback(() => {
        spaceReady.current = true;
        readyResolver.current?.();
        readyResolver.current = null;
    }, []);

    const changeMode = useCallback((nextSimple: boolean, updateHistory = true) => {
        if (requestRef.current || nextSimple === simple) return;
        if (!nextSimple) spaceReady.current = false;
        if (simple && window.location.hash !== "#space") simpleHash.current = window.location.hash;
        if (updateHistory) {
            const hash = nextSimple ? simpleHash.current : "#space";
            window.history.pushState(window.history.state, "", window.location.pathname + window.location.search + hash);
        }
        const focus = document.activeElement;
        requestRef.current = { simple: nextSimple, focus: focus instanceof HTMLElement ? focus : null, anchor: !updateHistory && nextSimple };
        if (simple) simpleScroll.current = { left: window.scrollX, top: window.scrollY };
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setSimple(nextSimple);
            setPhase(nextSimple ? "idle" : "revealing");
        } else {
            setPhase("covering");
        }
    }, [simple]);

    useEffect(() => {
        const syncMode = () => {
            if (simple && window.location.hash !== "#space") simpleHash.current = window.location.hash;
            if (phase === "idle") changeMode(window.location.hash !== "#space", false);
        };
        window.addEventListener("popstate", syncMode);
        window.addEventListener("hashchange", syncMode);
        // Also reconcile navigation that happened while the fade was running.
        syncMode();
        return () => {
            window.removeEventListener("popstate", syncMode);
            window.removeEventListener("hashchange", syncMode);
        };
    }, [changeMode, phase, simple]);

    useLayoutEffect(() => {
        const request = requestRef.current;
        if (!request || phase === "covering") return;
        // Restore scrolling behind the black overlay, before the new layout is revealed.
        window.scrollTo({ ...(simple ? simpleScroll.current : { left: 0, top: 0 }), behavior: "instant" });
        if (simple && request.anchor && window.location.hash) {
            let id = window.location.hash.slice(1);
            try { id = decodeURIComponent(id); } catch { /* Keep malformed fragments literal. */ }
            document.getElementById(id)?.scrollIntoView({ behavior: "instant" });
        }
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
            setReduced(preference.matches);
            const request = requestRef.current;
            if (!preference.matches || !request) return;
            setSimple(request.simple);
            setPhase(request.simple ? "idle" : "revealing");
        };
        preference.addEventListener("change", onChange);
        return () => preference.removeEventListener("change", onChange);
    }, []);

    useEffect(() => {
        const overlay = overlayRef.current;
        if (phase === "idle" || !overlay) return;
        let cancelled = false;
        let animation: Animation | null = null;
        let headerAnimation: Animation | null = null;
        const animate = (frames: Keyframe[], options: KeyframeAnimationOptions) => {
            headerAnimation = headerOverlayRef.current?.animate(frames, options) ?? null;
            return overlay.animate(frames, options);
        };
        let frame = 0;
        const nextFrame = () => new Promise<void>(resolve => {
            frame = requestAnimationFrame(() => { frame = 0; resolve(); });
        });
        const cancel = () => {
            cancelled = true;
            cancelAnimationFrame(frame);
            animation?.cancel();
            headerAnimation?.cancel();
            readyResolver.current?.();
            readyResolver.current = null;
        };

        if (phase === "covering") {
            animation = animate([{ opacity: 0 }, { opacity: 1 }], {
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
                if (!simple && !spaceReady.current) {
                    await new Promise<void>(resolve => { readyResolver.current = resolve; });
                }
                if (cancelled) return;
                await nextFrame();
                if (cancelled) return;
                if (reduced) { setPhase("idle"); return; }
                animation = animate([{ opacity: 1 }, { opacity: 0 }], {
                    duration: 220, easing: "ease-out", fill: "forwards",
                });
                await animation.finished.catch(() => {});
                if (!cancelled) setPhase("idle");
            })();
        }

        return cancel;
    }, [phase, simple, reduced]);

    useEffect(() => {
        if (phase === "idle") return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (!["Tab", "Enter", " ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) return;
            event.preventDefault();
            event.stopPropagation();
        };
        const onWheel = (event: WheelEvent) => {
            if (!event.ctrlKey) event.preventDefault();
        };
        document.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("wheel", onWheel, { passive: false });
        return () => {
            document.removeEventListener("keydown", onKeyDown, true);
            document.removeEventListener("wheel", onWheel);
        };
    }, [phase]);

    return { simple, changeMode, phase, overlayRef, headerOverlayRef, onSpaceReady };
}
