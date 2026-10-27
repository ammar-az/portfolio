import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { PlanetRenderer } from "../../utils/planetRenderer";

const ProjectionContext = createContext<{
    renderer: PlanetRenderer;
    available: boolean | null;
    reduced: boolean;
    orbitSpeed: 1 | 2 | 4;
    setOrbitSpeed: (speed: 1 | 2 | 4) => void;
    systemsEnabled: boolean;
    setSystemsEnabled: (enabled: boolean) => void;
    setAvailable: (available: boolean) => void;
} | null>(null);

export const usePlanetProjection = () => useContext(ProjectionContext);

export function PlanetProjectionProvider({ children, enabled, convectionEnabled, clock, systemsEnabled, setSystemsEnabled }: {
    children: ReactNode; enabled: boolean; convectionEnabled: boolean; clock: { current: number };
    systemsEnabled: boolean; setSystemsEnabled: (enabled: boolean) => void;
}) {
    const renderer = useMemo(() => new PlanetRenderer(clock), [clock]);
    const [available, setAvailable] = useState<boolean | null>(null);
    const [orbitSpeed, setOrbitSpeed] = useState<1 | 2 | 4>(1);
    const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
    useEffect(() => {
        const preference = matchMedia("(prefers-reduced-motion: reduce)");
        const change = () => setReduced(preference.matches);
        preference.addEventListener("change", change);
        return () => preference.removeEventListener("change", change);
    }, []);
    useEffect(() => renderer.setEnabled(enabled && !reduced), [renderer, enabled, reduced]);
    useLayoutEffect(() => renderer.setConvectionEnabled(convectionEnabled && !reduced), [renderer, convectionEnabled, reduced]);
    useLayoutEffect(() => renderer.orbits.setSpeed(orbitSpeed), [renderer, orbitSpeed]);
    useLayoutEffect(() => renderer.setSystemsEnabled(systemsEnabled), [renderer, systemsEnabled]);
    const value = useMemo(() => ({ renderer, available, reduced, orbitSpeed, setOrbitSpeed, setAvailable, systemsEnabled, setSystemsEnabled }),
        [renderer, available, reduced, orbitSpeed, systemsEnabled, setSystemsEnabled]);
    return <ProjectionContext.Provider value={value}>{children}</ProjectionContext.Provider>;
}

export function PlanetProjectionCanvas({ layoutKey, onReady }: { layoutKey: string; onReady: () => void }) {
    const projection = usePlanetProjection();
    const renderer = projection?.renderer;
    const setAvailable = projection?.setAvailable;
    useLayoutEffect(() => renderer?.refreshLayout(), [renderer, layoutKey]);
    useEffect(() => {
        if (!renderer) return;
        const controller = new AbortController();
        void renderer.whenReady(controller.signal).then(() => { if (!controller.signal.aborted) onReady(); });
        return () => controller.abort();
    }, [renderer, onReady]);
    const ref = useCallback((canvas: HTMLCanvasElement | null) => {
        if (canvas && renderer && setAvailable) return renderer.attach(canvas, setAvailable);
    }, [renderer, setAvailable]);
    return <canvas className="space-planet-projection" ref={ref} aria-hidden="true" />;
}
