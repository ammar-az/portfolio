import { useCallback, useMemo } from "react";
import type { CSSProperties } from "react";
import useSvgTexture from "../../hooks/useSvgTexture";
import { generatePlanet } from "../../utils/planetTextures";
import type { PlanetTextureOptions } from "../../utils/planetTextures";
import { usePlanetProjection } from "./PlanetProjection";
import { getPlanetLighting } from "../../utils/planetLighting";

export default function PlanetSurface({ color, accentColor, type, intense, seed, lightRotation = 0, orbitRadius }: PlanetTextureOptions & { lightRotation?: number; orbitRadius?: number }) {
    const texture = useMemo(() => generatePlanet({ color, accentColor, type, intense, seed }, lightRotation), [color, accentColor, type, intense, seed, lightRotation]);
    const textureRef = useSvgTexture(texture);
    const renderer = usePlanetProjection()?.renderer;
    const surfaceRef = useCallback((element: HTMLSpanElement | null) => {
        if (element && renderer) {
            return renderer.register(element, { color, accentColor, type, intense, seed }, orbitRadius);
        }
    }, [renderer, color, accentColor, type, intense, seed, orbitRadius]);

    return (
        <span className="planet-disc" ref={surfaceRef} style={{ "--planet-shadow-opacity": 1 - getPlanetLighting(orbitRadius).fill } as CSSProperties}>
            <img className="planet-texture" ref={textureRef} alt="" draggable={false} />
            <span className="planet-lighting" />
            <span className="planet-limb" />
        </span>
    );
}
