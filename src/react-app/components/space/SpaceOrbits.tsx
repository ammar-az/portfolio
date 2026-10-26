import { useId, useMemo } from "react";
import type { CSSProperties } from "react";
import { getOrbitCrossings, getOrbitPoint } from "../../utils/spaceGeometry";
import type { Orbit, Point } from "../../utils/spaceGeometry";

type OrbitalPath = Orbit & { id: string; position: Point; diameter: number };
type Props = {
    bodies: OrbitalPath[]; width: number; height: number; desktop: boolean;
    viewport: { width: number; height: number };
    sun: { center: Point; width: number; height: number };
};

export default function SpaceOrbits({ bodies, width, height, desktop, viewport, sun }: Props) {
    const id = useId();
    const depthId = `${id}-depth`, fadeId = `${id}-crossing-fade`;
    const solarClipId = `${id}-sun`, transitMaskId = `${id}-planets`;
    const gaps = useMemo(() => {
        const result = new Map<string, { point: Point; radius: number; over: string }[]>();
        if (bodies.length < 2) return result;
        const outer = bodies[bodies.length - 1];
        const tangent = (orbit: Orbit, phase: number) => {
            const a = getOrbitPoint(orbit, phase - 0.01), b = getOrbitPoint(orbit, phase + 0.01);
            const x = (b.x - a.x) * viewport.width / width, y = (b.y - a.y) * viewport.height / height;
            const length = Math.hypot(x, y);
            return { x: x / length, y: y / length };
        };
        for (const inner of bodies.slice(0, -1)) {
            for (const crossing of getOrbitCrossings(outer, inner)) {
                // The outer inclined plane crosses above on its near half, below on its far half.
                const outerOver = Math.sin(crossing.firstPhase * Math.PI / 180) >= 0;
                const under = outerOver ? inner.id : outer.id, over = outerOver ? outer.id : inner.id;
                const a = tangent(outer, crossing.firstPhase), b = tangent(inner, crossing.secondPhase);
                const radius = Math.min(10, Math.max(4, 1.4 / Math.max(0.12, Math.abs(a.x * b.y - a.y * b.x))));
                result.set(under, [...(result.get(under) ?? []), { point: crossing.point, radius, over }]);
            }
        }
        return result;
    }, [bodies, width, height, viewport.width, viewport.height]);
    const line = (body: OrbitalPath, index: number, front: boolean) => {
        const start = getOrbitPoint(body, 0), end = getOrbitPoint(body, 180);
        const d = `M${start.x} ${start.y}A${body.radiusX} ${body.radiusY} ${body.tilt} 0 1 ${end.x} ${end.y}`;
        const shape = (className: string) => front ? <path className={className} d={d} />
            : <ellipse className={className} cx={body.center.x} cy={body.center.y} rx={body.radiusX} ry={body.radiusY}
                transform={`rotate(${body.tilt} ${body.center.x} ${body.center.y})`} />;
        return <g key={body.id} className="space-orbit" data-orbit-line={body.id}
            mask={gaps.has(body.id) ? `url(#${id}-gap-${index})` : undefined}>
            {shape("space-orbit-halo")}{shape("space-orbit-core")}
        </g>;
    };
    return <>
        <svg className="space-orbits" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true"
            style={{ "--orbit-core": `url(#${depthId})` } as CSSProperties}>
            <defs>
                <linearGradient id={depthId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={height}>
                    <stop offset="0" stopColor="var(--space-accent)" stopOpacity="0.19" />
                    <stop offset="0.55" stopColor="var(--space-accent)" stopOpacity="0.36" />
                    <stop offset="1" stopColor="var(--space-accent)" stopOpacity="0.48" />
                </linearGradient>
                <radialGradient id={fadeId}>
                    <stop offset="0.55" stopColor="black" /><stop offset="1" stopColor="white" />
                </radialGradient>
                {bodies.map((body, index) => gaps.has(body.id) && <mask key={body.id} id={`${id}-gap-${index}`}
                    maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
                    <rect width={width} height={height} fill="white" stroke="none" />
                    {gaps.get(body.id)!.map((gap, gapIndex) => <ellipse key={gapIndex} data-orbit-crossing={body.id}
                        data-over-orbit={gap.over} cx={gap.point.x} cy={gap.point.y}
                        rx={gap.radius * width / viewport.width} ry={gap.radius * height / viewport.height}
                        fill={`url(#${fadeId})`} stroke="none" />)}
                </mask>)}
            </defs>
            {bodies.map((body, index) => line(body, index, false))}
        </svg>
        {desktop && <svg className="space-orbits space-orbits-transit" viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none" aria-hidden="true">
            <defs>
                <clipPath id={solarClipId}>
                    <ellipse cx={sun.center.x} cy={sun.center.y}
                        rx={sun.width * width / viewport.width / 2} ry={sun.height * height / viewport.height / 2} />
                </clipPath>
                <mask id={transitMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width={width} height={height}>
                    <rect width={width} height={height} fill="white" stroke="none" />
                    {bodies.map(body => <ellipse key={body.id} data-orbit-mask={body.id} cx={body.position.x} cy={body.position.y}
                        rx={body.diameter * width / viewport.width / 2 + 1} ry={body.diameter * height / viewport.height / 2 + 1}
                        fill="black" stroke="none" />)}
                </mask>
            </defs>
            <g clipPath={`url(#${solarClipId})`} mask={`url(#${transitMaskId})`}>
                {bodies.map((body, index) => line(body, index, true))}
            </g>
        </svg>}
    </>;
}
