import { useMemo } from "react";
import useSvgTexture from "../../hooks/useSvgTexture";
import { generatePlanet } from "../../utils/planetTextures";
import type { PlanetTextureOptions } from "../../utils/planetTextures";

export default function PlanetSurface({ color, accentColor, type, intense, seed, lightRotation = 0 }: PlanetTextureOptions & { lightRotation?: number }) {
    const texture = useMemo(() => generatePlanet({ color, accentColor, type, intense, seed }, lightRotation), [color, accentColor, type, intense, seed, lightRotation]);
    const textureRef = useSvgTexture(texture);

    return (
        <span className="planet-disc">
            <img className="planet-texture" ref={textureRef} alt="" draggable={false} />
            <span className="planet-lighting" />
            <span className="planet-limb" />
        </span>
    );
}
