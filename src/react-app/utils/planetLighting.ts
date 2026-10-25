import { planetAppearance, projectXAppearance, spaceScene } from "../data/spaceScene";

const radii = [...Object.values(planetAppearance), projectXAppearance].map(body => body.orbitRadius);
const innerRadius = Math.min(...radii);
const outerRadius = Math.max(...radii);

/** Use orbital distance, so responsive layout, rotation and rerolling cannot change a world's shading. */
export function getPlanetLighting(orbitRadius = innerRadius) {
    const distance = Math.max(0, Math.min(1, (orbitRadius - innerRadius) / Math.max(1, outerRadius - innerRadius)));
    const { inner, outer, falloff } = spaceScene.lighting;
    const strength = distance ** falloff;
    const mix = (a: number, b: number) => a + (b - a) * strength;
    return {
        fill: mix(inner.fill, outer.fill),
        depth: mix(inner.depth, outer.depth),
        terminatorStart: mix(inner.terminatorStart, outer.terminatorStart),
    };
}
