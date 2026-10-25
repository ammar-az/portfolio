import CpuIcon from "../../assets/icons/cpu.svg?react";
import { usePlanetProjection } from "./PlanetProjection";

export default function SolarPerformanceControl({ enabled, motionEnabled, onChange }: {
    enabled: boolean; motionEnabled: boolean; onChange: (enabled: boolean) => void;
}) {
    const projection = usePlanetProjection();
    const reduced = projection?.reduced;
    const unavailable = !projection?.available;
    const disabled = reduced || unavailable || !motionEnabled;
    const title = reduced ? "Solar convection is off for reduced motion"
        : unavailable ? "Solar convection is unavailable"
        : !motionEnabled ? "Resume scene motion to change solar convection"
        : enabled ? "Pause solar convection to reduce CPU use" : "Resume solar convection";
    return <>
        <button type="button" className="icon-button space-performance" aria-label="Performance mode"
            title={title} aria-pressed={!enabled || reduced} disabled={disabled} onClick={() => onChange(!enabled)}>
            <CpuIcon aria-hidden="true" focusable="false" />
        </button>
        <span className="space-status" role="status">{reduced ? "Solar convection off: reduced motion."
            : unavailable ? "Static solar surface."
            : !motionEnabled ? "Solar convection paused with scene motion."
            : enabled ? "Solar convection on." : "Performance mode on: static sun."}</span>
    </>;
}
