import { usePlanetProjection } from "./PlanetProjection";

export default function SceneMotionControl({ enabled, onChange }: { enabled: boolean; onChange: (enabled: boolean) => void }) {
    const projection = usePlanetProjection();
    const unavailable = !projection?.available;
    const reduced = projection?.reduced;
    const active = enabled && !reduced && !unavailable;
    const title = reduced ? "Scene motion is off for reduced motion" : unavailable ? "Scene motion is unavailable" : enabled ? "Pause scene motion" : "Resume scene motion";
    return <>
        <button type="button" className="icon-button scene-motion" aria-label="Scene motion" title={title}
            aria-pressed={active} disabled={unavailable || reduced} onClick={() => onChange(!enabled)}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                {active ? <path d="M9 6v12M15 6v12" /> : <path d="m9 5 10 7-10 7Z" />}
            </svg>
        </button>
        <span className="space-status" role="status">{reduced ? "Scene motion off: reduced motion." : unavailable ? "Static celestial surfaces." : enabled ? "Scene motion on." : "Scene motion paused."}</span>
    </>;
}
