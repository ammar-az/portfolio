import PlanetIcon from "../../assets/icons/planet.svg?react";
import { usePlanetProjection } from "./PlanetProjection";

export default function PlanetaryOrbitersControl() {
    const projection = usePlanetProjection();
    const enabled = projection?.systemsEnabled ?? true;
    return <button type="button" className="icon-button space-orbiters"
        aria-label="Toggle planetary orbiters" aria-pressed={enabled}
        title={`Toggle planetary orbiters (moons and rings ${enabled ? "on" : "off"})`}
        disabled={!projection?.available} onClick={() => projection?.setSystemsEnabled(!enabled)}>
        <PlanetIcon aria-hidden="true" focusable="false" />
    </button>;
}
