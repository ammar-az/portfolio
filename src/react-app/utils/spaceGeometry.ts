export type Point = { x: number; y: number };

export type Orbit = {
    center: Point;
    radiusX: number;
    radiusY: number;
    tilt: number;
};

// Matches an SVG ellipse rotated around its center. Angles are in degrees.
export function getOrbitPoint(orbit: Orbit, phase: number): Point {
    const angle = phase * Math.PI / 180;
    const tilt = orbit.tilt * Math.PI / 180;
    const x = orbit.radiusX * Math.cos(angle);
    const y = orbit.radiusY * Math.sin(angle);

    return {
        x: orbit.center.x + x * Math.cos(tilt) - y * Math.sin(tilt),
        y: orbit.center.y + x * Math.sin(tilt) + y * Math.cos(tilt),
    };
}
