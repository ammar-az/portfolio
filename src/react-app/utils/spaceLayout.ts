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
        const diameters = [48, 60, 104, 94, 70, 46];
        // Both identities need clearance when adjacent planets line up horizontally.
        const rowOffsets = [0];
        for (let index = 1; index < diameters.length; index++) {
            rowOffsets.push(rowOffsets[index - 1] + 96 * viewport.textScale + (diameters[index - 1] + diameters[index]) / 2 * scale);
        }
        const rowSpan = rowOffsets[rowOffsets.length - 1];
        const height = Math.max(viewport.height - viewport.headerBottom, 750 * viewport.textScale,
            outerY + innerClearance + rowSpan);
        const center = { x: width / 2, y: height + starHeight * 0.15 };
        const innerY = height - innerClearance;
        const horizontalPositions = [0.30, 0.73, 0.26, 0.71, 0.27, 0.58];

        return {
            width, height, center, starWidth, starHeight,
            body(_appearance: OrbitAppearance, index: number) {
                const position = {
                    x: width * horizontalPositions[index],
                    y: innerY - rowOffsets[index] - (innerY - outerY - rowSpan) * index / 5,
                };
                // Solve the ellipse through this body rather than pulling outer orbits inward.
                const radiusY = Math.hypot(center.y - position.y, (position.x - center.x) / 0.72);
                return {
                    position, diameter: diameters[index] * scale,
                    radiusX: radiusY * 0.72, radiusY, tilt: 0,
                    phase: Math.atan2((position.y - center.y) / radiusY, (position.x - center.x) / (radiusY * 0.72)) * 180 / Math.PI,
                    speedScale: 1,
                };
            },
        };
    }

    const { width, height, star, desktopOrbits } = spaceScene;
    const starHeight = viewport.height * star.heightRatio;
    const center = {
        x: starHeight * star.offsetRatio * width / viewport.width,
        y: (viewport.headerBottom + viewport.height) / 2 * height / viewport.height,
    };
    return {
        width, height, center, starWidth: starHeight * star.aspectRatio, starHeight,
        body(appearance: OrbitAppearance, index = 0) {
            // Open the outer lanes vertically so the complete visible paths have room for identities.
            // The inner orbit and its solar transit retain their original geometry.
            const radiusX = desktopOrbits.rightEdges[index] - center.x;
            const originalRadiusY = radiusX * desktopOrbits.flattening;
            const orbit = {
                center, radiusX,
                radiusY: originalRadiusY + desktopOrbits.verticalOffsets[index],
                tilt: desktopOrbits.innerTilt + index * desktopOrbits.tiltStep,
            };
            // Retain the starting composition's vertical stagger on the roomier ellipses.
            const initialY = getOrbitPoint({ ...orbit, radiusY: originalRadiusY }, appearance.phase).y - center.y;
            const tilt = orbit.tilt * Math.PI / 180;
            const a = radiusX * Math.sin(tilt), b = orbit.radiusY * Math.cos(tilt);
            const phase = (Math.asin(initialY / Math.hypot(a, b)) - Math.atan2(a, b)) * 180 / Math.PI;
            return {
                ...orbit, phase, speedScale: originalRadiusY / orbit.radiusY,
                position: getOrbitPoint(orbit, phase),
                diameter: appearance.diameter * viewport.width / width,
            };
        },
    };
}
