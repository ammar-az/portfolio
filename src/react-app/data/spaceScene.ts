import type { PlanetTextureOptions } from "../utils/planetTextures";

// Orbits and planets use logical scene units; sun dimensions follow the available scene height.
export const spaceScene = {
    width: 1440,
    height: 800,
    // 1100px tall at a 1250px viewport; visible reach is 50% larger than the earlier crop.
    star: { heightRatio: 1100 / 1250, aspectRatio: 820 / 1100, offsetRatio: -160 / 1100 },
    orbitTilt: 8,
    orbitFlattening: 0.42,
    // Artistic falloff: outer worlds have deeper shade, while their lit faces stay bright.
    lighting: {
        inner: { fill: 0.55, depth: 1.7, terminatorStart: -0.6 },
        outer: { fill: 0.25, depth: 0.85, terminatorStart: -0.4 },
        falloff: 0.8,
    },
};

type PlanetAppearance = PlanetTextureOptions & {
    orbitRadius: number;
    phase: number;
    diameter: number;
};

// Presentation only; names, identities, and content stay in projects.ts.
// Angles are in degrees. Initial phases keep all five planets on the visible side.
export const planetAppearance: Record<string, PlanetAppearance> = {
    "word-wasp": {
        orbitRadius: 510, phase: 18, diameter: 72,
        color: "#dfaa2b", accentColor: "#453215", type: "terrestrial", intense: false, seed: "word-wasp",
    },
    potential: {
        orbitRadius: 650, phase: -24, diameter: 88,
        color: "#b75330", accentColor: "#743a2b", type: "terrestrial", intense: false, seed: "potential",
    },
    tasked: {
        orbitRadius: 850, phase: 18, diameter: 156,
        color: "#528bea", accentColor: "#d8e7f2", type: "giant", intense: true, seed: "tasked",
    },
    ltg: {
        orbitRadius: 1060, phase: -12, diameter: 140,
        color: "#a787d9", accentColor: "#e2c7e7", type: "giant", intense: true, seed: "ltg",
    },
    "potential-cpp": {
        orbitRadius: 1280, phase: 7, diameter: 112,
        color: "#73b7b7", accentColor: "#d2e7e2", type: "giant", intense: false, seed: "potential-cpp",
    },
};

// A scene-only outer world, deliberately independent of the portfolio's project entries.
export const projectXAppearance: PlanetAppearance & { name: string } = {
    name: "Project X", orbitRadius: 1480, phase: -18, diameter: 66,
    color: "#65b97b", accentColor: "#d2edcb", type: "giant", intense: false, seed: "planet-x",
};
