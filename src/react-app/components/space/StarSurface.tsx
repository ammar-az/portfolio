import { useCallback, useMemo } from "react";
import useSvgTexture from "../../hooks/useSvgTexture";
import type { StarPalette } from "../../data/starAppearance";
import { generateStarTexture } from "../../utils/starTextures";
import { usePlanetProjection } from "./PlanetProjection";

export default function StarSurface({ palette, seed }: { palette: StarPalette; seed: number }) {
    const texture = useMemo(() => generateStarTexture(palette, seed), [palette, seed]);
    const textureRef = useSvgTexture(texture);
    const renderer = usePlanetProjection()?.renderer;
    const surfaceRef = useCallback((element: HTMLSpanElement | null) => {
        if (element && renderer) return renderer.registerSolar(element, palette, seed);
    }, [renderer, palette, seed]);

    return (
        <span className="star-disc" ref={surfaceRef}>
            <img className="star-texture" ref={textureRef} alt="" draggable={false} />
            <span className="star-luminosity" />
        </span>
    );
}
