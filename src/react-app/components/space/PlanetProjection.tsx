import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { PlanetRenderer } from "../../utils/planetRenderer";

const ProjectionContext = createContext<{
    renderer: PlanetRenderer;
    available: boolean | null;
    reduced: boolean;
    setAvailable: (available: boolean) => void;
} | null>(null);

export const usePlanetProjection = () => useContext(ProjectionContext);

export function PlanetProjectionProvider({ children, enabled, clock }: {
    children: ReactNode; enabled: boolean; clock: { current: number };
}) {
    const renderer = useMemo(() => new PlanetRenderer(clock), [clock]);
    const [available, setAvailable] = useState<boolean | null>(null);
    const [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
    useEffect(() => {
        const preference = matchMedia("(prefers-reduced-motion: reduce)");
        const change = () => setReduced(preference.matches);
        preference.addEventListener("change", change);
        return () => preference.removeEventListener("change", change);
    }, []);
    useEffect(() => renderer.setEnabled(enabled && !reduced), [renderer, enabled, reduced]);
    const value = useMemo(() => ({ renderer, available, reduced, setAvailable }), [renderer, available, reduced]);
    return <ProjectionContext.Provider value={value}>{children}</ProjectionContext.Provider>;
}

export function PlanetProjectionCanvas({ layoutKey }: { layoutKey: string }) {
    const projection = usePlanetProjection();
    const renderer = projection?.renderer;
    const setAvailable = projection?.setAvailable;
    useLayoutEffect(() => renderer?.refreshLayout(), [renderer, layoutKey]);
    const ref = useCallback((canvas: HTMLCanvasElement | null) => {
        if (canvas && renderer && setAvailable) return renderer.attach(canvas, setAvailable);
    }, [renderer, setAvailable]);
    return <canvas className="space-planet-projection" ref={ref} aria-hidden="true" />;
}

export function PlanetRotationControl({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
    const projection = usePlanetProjection();
    const unavailable = !projection?.available;
    const reduced = projection?.reduced;
    const active = enabled && !reduced && !unavailable;
    const title = reduced ? "Planet rotation is off for reduced motion" : unavailable ? "Planet rotation is unavailable" : enabled ? "Pause planet rotation" : "Resume planet rotation";
    return <>
        <button type="button" className="icon-button space-rotation" aria-label="Planet rotation" title={title}
            aria-pressed={active} disabled={unavailable || reduced} onClick={() => onChange(!enabled)}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                {active ? <path d="M9 6v12M15 6v12" /> : <path d="m9 5 10 7-10 7Z" />}
            </svg>
        </button>
        <span className="space-status" role="status">{reduced ? "Planet rotation off: reduced motion." : unavailable ? "Static planet surfaces." : enabled ? "Planet rotation on." : "Planet rotation paused."}</span>
    </>;
}
