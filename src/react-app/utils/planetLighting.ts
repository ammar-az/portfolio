import { planetAppearance, projectXAppearance, spaceScene } from "../data/spaceScene";

const radii = [...Object.values(planetAppearance), projectXAppearance].map(body => body.orbitRadius);
const innerRadius = Math.min(...radii);
const outerRadius = Math.max(...radii);

/** Orbital distance sets stable fill and static-fallback lighting; moving phases are applied separately. */
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

/** Phase changes the direct light; existing distance-based fill keeps the artwork readable. */
export function getPlanetPhaseLighting(profile: ReturnType<typeof getPlanetLighting>, phase?: {
    solarAngularRadius: number; transit: number;
}) {
    if (!phase) return profile;
    return {
        fill: profile.fill + (Math.min(profile.fill, spaceScene.lighting.transitFill) - profile.fill) * phase.transit,
        // An extended sun illuminates beyond a point source's terminator.
        terminatorStart: -Math.max(0.08, Math.min(0.65, phase.solarAngularRadius)),
    };
}
