import { useMemo } from "react";
import useSvgTexture from "../../hooks/useSvgTexture";
import type { StarFinish, StarPalette } from "../../data/starAppearance";
import { generateStarTexture } from "../../utils/starTextures";

export default function StarSurface({ palette, finish, seed }: { palette: StarPalette; finish: StarFinish; seed: number }) {
    const texture = useMemo(() => generateStarTexture(palette, finish, seed), [palette, finish, seed]);
    const textureRef = useSvgTexture(texture);

    return (
        <span className={`star-disc star-disc-${finish}`}>
            <img className="star-texture" ref={textureRef} alt="" draggable={false} />
            <span className="star-luminosity" />
        </span>
    );
}
