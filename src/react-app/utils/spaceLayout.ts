import { spaceScene } from "../data/spaceScene";
import { getOrbitPoint } from "./spaceGeometry";
import type { Orbit } from "./spaceGeometry";

type Viewport = { width: number; height: number; stableHeight?: number; headerBottom: number; textScale: number };
type OrbitAppearance = { orbitRadius: number; phase: number; diameter: number; orbitDegreesPerSecond: number };

// Fit a tilted ellipse whose rightmost point is (rightX, rightY) and lowest is (0, bottomY).
// The symmetric matrix encodes its projected extents; its eigenvectors give SVG's axes/tilt.
function cornerOrbit(rightX: number, rightY: number, bottomY: number, centerFraction: number): Orbit {
    const centerX = rightX * centerFraction;
    const extentX = rightX - centerX;
    const centerY = (rightY * extentX + bottomY * centerX) / rightX;
    const extentY = bottomY - centerY;
    const xx = extentX ** 2, yy = extentY ** 2, xy = -centerX * extentY;
    const separation = Math.hypot(xx - yy, 2 * xy);
    return {
        center: { x: centerX, y: centerY },
        radiusX: Math.sqrt((xx + yy + separation) / 2),
        radiusY: Math.sqrt(Math.max(1, (xx + yy - separation) / 2)),
        tilt: Math.atan2(2 * xy, xx - yy) * 90 / Math.PI,
    };
}

// Layout and surface rendering are independent: both layouts use the same bodies and materials.
export function getSpaceLayout(viewport: Viewport, compact: boolean) {
    if (compact) {
        const width = viewport.width;
        const starWidth = Math.min(width * 1.7, 1000);
        // Leave room for the sun's identity even when the visitor enlarges text.
        const starHeight = Math.max(Math.min(width * 1.1, 650), 320 * viewport.textScale);
        const scale = Math.min(1.3, Math.max(0.88, width / 390));
        const outerY = viewport.headerBottom + 112 * viewport.textScale;
        const innerClearance = starHeight * 0.35 + 72 * viewport.textScale;
        const laneSpacing = 36 * viewport.textScale + 40 * scale;
        const diameters = [48, 60, 104, 94, 70, 46];
        // Keep the compact starting composition; movement does not add rows or scene height.
        const stableHeight = viewport.stableHeight ?? viewport.height;
        const compositionHeight = Math.max(stableHeight, viewport.headerBottom + 690 * viewport.textScale,
            outerY + innerClearance + 5 * laneSpacing);
        // Browser chrome changes the drawing area without redistributing the planets.
        const height = compositionHeight + Math.max(0, viewport.height - stableHeight);
        const center = { x: width / 2, y: compositionHeight + starHeight * 0.15 };
        const innerY = compositionHeight - innerClearance;
        const horizontalPositions = [0.30, 0.73, 0.26, 0.71, 0.27, 0.58];

        return {
            width, height, center, starWidth, starHeight,
            compactMotion: { pixelsPerSecond: width * spaceScene.mobileOrbits.widthPerSecond,
                gutter: width * spaceScene.mobileOrbits.gutterRatio },
            body(_appearance: OrbitAppearance, index: number) {
                const position = {
                    x: width * horizontalPositions[index],
                    y: innerY + (outerY - innerY) * index / 5,
                };
                const lane = spaceScene.mobileOrbits.lanes[index];
                const tilt = lane.tilt * Math.PI / 180;
                const dx = position.x - center.x, dy = position.y - center.y;
                const localX = dx * Math.cos(tilt) + dy * Math.sin(tilt);
                const localY = -dx * Math.sin(tilt) + dy * Math.cos(tilt);
                // Stronger, varied inclinations remain wide enough to wrap completely offscreen.
                // Keep the starting point inside the ellipse even during very narrow intermediate resizes.
                const radiusX = Math.max(width * 0.78, Math.sqrt(-dy * width * lane.curvature), Math.abs(localX) * 1.05);
                const radiusY = -localY / Math.sqrt(1 - (localX / radiusX) ** 2);
                return {
                    center, position, diameter: diameters[index] * scale,
                    radiusX, radiusY, tilt: lane.tilt,
                    phase: Math.atan2(localY / radiusY, localX / radiusX) * 180 / Math.PI,
                    degreesPerSecond: 0, compactSpeed: lane.speed,
                };
            },
        };
    }

    const { width, height, star, desktopOrbits } = spaceScene;
    const starHeight = viewport.height * star.heightRatio;
    const center = {
        x: starHeight * star.offsetRatio * width / viewport.width,
        y: height / 2,
    };
    const solarLimb = center.x + starHeight * star.aspectRatio / 2 * width / viewport.width;
    // Reserve room for the body and its identity at the right-hand turn, including narrow desktops.
    const rightInset = Math.max(90, 80 * viewport.textScale * width / viewport.width);
    const rightEdge = width - rightInset;
    return {
        width, height, center, starWidth: starHeight * star.aspectRatio, starHeight,
        compactMotion: undefined,
        body(appearance: OrbitAppearance, index = 0) {
            const diameter = appearance.diameter * viewport.width / width;
            const lane = desktopOrbits.lanes[index];
            const outer = desktopOrbits.outer;
            let orbit: Orbit;
            // Main lanes fit their entire right-hand turn, rather than disappearing at its midpoint.
            // Bodies stay in frame; identities may briefly cross the header or bottom edge.
            const limbClearance = diameter / 2 + 12;
            if (lane) {
                const farY = Math.max(lane.farY * height,
                    limbClearance * height / viewport.height);
                const nearY = Math.min(lane.nearY * height,
                    (viewport.height - limbClearance) * height / viewport.height);
                const radiusY = Math.max(24, (nearY - farY) / 2);
                const rightTurn = solarLimb + (rightEdge - solarLimb) * lane.reach;
                const radians = lane.tilt * Math.PI / 180;
                // Solve the actual rotated ellipse's rightmost extent, not just its unrotated endpoint.
                const radiusX = Math.sqrt(Math.max(1, (rightTurn - center.x) ** 2
                    - (radiusY * Math.sin(radians)) ** 2)) / Math.cos(radians);
                orbit = { center: { x: center.x, y: (farY + nearY) / 2 }, radiusX, radiusY, tilt: lane.tilt };
            } else {
                const bottomY = height - (diameter / 2 + outer.bottomInset) * height / viewport.height;
                orbit = cornerOrbit(rightEdge, outer.rightY * height, bottomY, outer.centerFraction);
            }
            const radians = orbit.tilt * Math.PI / 180;
            const phase = lane?.phase ?? Math.atan2(-orbit.radiusY * Math.sin(radians),
                orbit.radiusX * Math.cos(radians)) * 180 / Math.PI;
            return {
                ...orbit, phase, degreesPerSecond: lane?.degreesPerSecond ?? outer.degreesPerSecond, compactSpeed: undefined,
                position: getOrbitPoint(orbit, phase),
                diameter,
            };
        },
    };
}
