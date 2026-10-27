import type { PlanetTextureOptions } from "../utils/planetTextures";

// Orbits and planets use logical scene units; sun dimensions follow the available scene height.
export const spaceScene = {
    width: 1440,
    height: 800,
    // Sidetrack composition: a full-height foreground sun, extending behind the header.
    star: { heightRatio: 1.12, aspectRatio: 0.86, offsetRatio: -0.11 },
    mobileOrbits: {
        widthPerSecond: 1 / 72, gutterRatio: 0.20,
        lanes: [
            { curvature: 1.15, tilt: -7, speed: 1.25 },
            { curvature: 1.55, tilt: 8, speed: 0.95 },
            { curvature: 1.45, tilt: -5, speed: 0.78 },
            { curvature: 1.15, tilt: 7, speed: 0.64 },
            { curvature: 1.65, tilt: -8, speed: 0.50 },
            { curvature: 1.05, tilt: 15, speed: -0.85 },
        ],
    },
    desktopOrbits: {
        // Reach is a fraction of the space between the solar limb and the right inset.
        // Evenly spaced turns from the smaller inner orbit to the last main lane.
        // Desktop rates account for these projected paths; mobile has separate lane timing.
        lanes: [
            { reach: 0.32, farY: 0.29, nearY: 0.70, tilt: 1, phase: 55, degreesPerSecond: 1.2 },
            { reach: 0.49, farY: 0.22, nearY: 0.80, tilt: 1.2, phase: 310, degreesPerSecond: 0.82 },
            { reach: 0.66, farY: 0.145, nearY: 0.90, tilt: 1.4, phase: 45, degreesPerSecond: 0.56 },
            { reach: 0.83, farY: 0.085, nearY: 0.98, tilt: 1.6, phase: 320, degreesPerSecond: 0.38 },
            { reach: 1.00, farY: 0.04, nearY: 1.03, tilt: 1.8, phase: 30, degreesPerSecond: 0.27 },
        ],
        // Fit Project X between its upper-right turn and a lower turn at the left edge.
        // Center fraction is relative to the right turn; below 0.5 keeps an open left-side arc.
        outer: { centerFraction: 0.44, rightY: 0.225, bottomInset: 14, degreesPerSecond: -0.22 },
    },
    // Artistic falloff: outer worlds have deeper shade, while their lit faces stay bright.
    lighting: {
        inner: { fill: 0.55, depth: 1.7, terminatorStart: -0.6 },
        outer: { fill: 0.25, depth: 0.85, terminatorStart: -0.4 },
        falloff: 0.8,
        // Virtual orbital depth preserves the projected paths; the mobile view is less edge-on.
        phaseDepth: { desktop: 0.9, mobile: 0.75 },
        transitFill: 0.18,
    },
};

type PlanetAppearance = PlanetTextureOptions & {
    orbitRadius: number;
    phase: number;
    diameter: number;
    orbitDegreesPerSecond: number;
};

// Presentation only; names, identities, and content stay in projects.ts.
// Angles are in degrees. Initial phases keep all five planets on the visible side.
export const planetAppearance: Record<string, PlanetAppearance> = {
    "word-wasp": {
        orbitRadius: 510, phase: 18, diameter: 72, orbitDegreesPerSecond: 1.2,
        color: "#dfaa2b", accentColor: "#453215", type: "terrestrial", intense: false, seed: "word-wasp",
    },
    potential: {
        orbitRadius: 650, phase: -24, diameter: 88, orbitDegreesPerSecond: 0.63,
        color: "#b75330", accentColor: "#743a2b", type: "terrestrial", intense: false, seed: "potential",
    },
    tasked: {
        orbitRadius: 850, phase: 18, diameter: 156, orbitDegreesPerSecond: 0.33,
        color: "#528bea", accentColor: "#d8e7f2", type: "giant", intense: true, seed: "tasked",
    },
    ltg: {
        orbitRadius: 1060, phase: -12, diameter: 140, orbitDegreesPerSecond: 0.23,
        color: "#a787d9", accentColor: "#e2c7e7", type: "giant", intense: true, seed: "ltg",
    },
    "potential-cpp": {
        orbitRadius: 1280, phase: 7, diameter: 112, orbitDegreesPerSecond: 0.18,
        color: "#73b7b7", accentColor: "#d2e7e2", type: "giant", intense: false, seed: "potential-cpp",
    },
};

// A scene-only outer world, deliberately independent of the portfolio's project entries.
export const projectXAppearance: PlanetAppearance & { name: string } = {
    name: "Project X", orbitRadius: 1480, phase: -18, diameter: 66, orbitDegreesPerSecond: 0.145,
    color: "#65b97b", accentColor: "#d2edcb", type: "giant", intense: false, seed: "planet-x",
};
