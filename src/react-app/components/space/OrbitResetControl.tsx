import ResetIcon from "../../assets/icons/orbit-reset.svg?react";
import { usePlanetProjection } from "./PlanetProjection";

export default function OrbitResetControl() {
    const projection = usePlanetProjection();
    return <button type="button" className="icon-button space-orbit-reset" aria-label="Reset planet positions"
        title="Reset planet positions" disabled={projection?.available === false}
        onClick={() => projection?.renderer.orbits.reset()}>
        <ResetIcon aria-hidden="true" focusable="false" />
    </button>;
}
