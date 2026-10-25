import { spaceScene } from "../data/spaceScene";
import { getOrbitPoint } from "./spaceGeometry";

type Viewport = { width: number; height: number; headerBottom: number; textScale: number };
type OrbitAppearance = { orbitRadius: number; phase: number; diameter: number };

// Layout and surface rendering are independent: both layouts use the same bodies and materials.
export function getSpaceLayout(viewport: Viewport, compact: boolean) {
    if (compact) {
        const width = viewport.width;
        const starWidth = Math.min(width * 1.7, 1000);
        // Leave room for the sun's identity even when the visitor enlarges text.
        const starHeight = Math.max(Math.min(width * 1.1, 650), 320 * viewport.textScale);
        const scale = Math.min(1.3, Math.max(0.88, width / 390));
        const outerY = 112 * viewport.textScale;
        const innerClearance = starHeight * 0.35 + 72 * viewport.textScale;
        const laneSpacing = 44 * viewport.textScale + 44 * scale;
        const height = Math.max(viewport.height - viewport.headerBottom, 750 * viewport.textScale,
            outerY + innerClearance + 5 * laneSpacing);
        const center = { x: width / 2, y: height + starHeight * 0.15 };
        const innerY = height - innerClearance;
        const horizontalPositions = [0.30, 0.73, 0.26, 0.71, 0.27, 0.58];
        const diameters = [48, 60, 104, 94, 70, 46];

        return {
            width, height, center, starWidth, starHeight,
            body(_appearance: OrbitAppearance, index: number) {
                const position = {
                    x: width * horizontalPositions[index],
                    y: innerY + (outerY - innerY) * index / 5,
                };
                // Solve the ellipse through this body rather than pulling outer orbits inward.
                const radiusY = Math.hypot(center.y - position.y, (position.x - center.x) / 0.72);
                return {
                    position, diameter: diameters[index] * scale,
                    radiusX: radiusY * 0.72, radiusY, tilt: 0,
                };
            },
        };
    }

    const { width, height, star, orbitTilt, orbitFlattening } = spaceScene;
    const starHeight = viewport.height * star.heightRatio;
    const center = {
        x: starHeight * star.offsetRatio * width / viewport.width,
        y: (viewport.headerBottom + viewport.height) / 2 * height / viewport.height,
    };
    return {
        width, height, center, starWidth: starHeight * star.aspectRatio, starHeight,
        body(appearance: OrbitAppearance) {
            const orbit = {
                center, radiusX: appearance.orbitRadius,
                radiusY: appearance.orbitRadius * orbitFlattening, tilt: orbitTilt,
            };
            return {
                ...orbit, position: getOrbitPoint(orbit, appearance.phase),
                diameter: appearance.diameter * viewport.width / width,
            };
        },
    };
}
