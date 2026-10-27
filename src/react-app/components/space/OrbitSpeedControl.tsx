import { usePlanetProjection } from "./PlanetProjection";

export default function OrbitSpeedControl() {
    const projection = usePlanetProjection();
    const speed = projection?.orbitSpeed ?? 1;
    const next = speed === 1 ? 2 : speed === 2 ? 4 : 1;
    const disabled = !projection?.available || projection.reduced;
    const label = `Orbital speed: ${speed} times${disabled ? "" : `. Switch to ${next} times`}`;
    const title = projection?.reduced ? "Orbital speed is off for reduced motion"
        : !projection?.available ? "Orbital motion is unavailable"
        : `Orbital speed: ${speed}×. Click for ${next}×`;
    return <>
        <button type="button" className="icon-button scene-speed" data-speed={speed}
            aria-label={label} title={title}
            disabled={disabled} onClick={() => projection?.setOrbitSpeed(next)}>
            <span aria-hidden="true">{speed}×</span>
        </button>
        <span className="space-status" role="status">Orbital speed: {speed} times.</span>
    </>;
}
