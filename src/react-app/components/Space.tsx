import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { projects } from "../data/projects";
import type { Project } from "../types/project";
import { planetAppearance, projectXAppearance } from "../data/spaceScene";
import { getSpaceLayout } from "../utils/spaceLayout";
import type { Point } from "../utils/spaceGeometry";
import CelestialBody from "./space/CelestialBody";
import ProjectView from "./ProjectView";
import RefreshIcon from "../assets/icons/refresh.svg?react";
import StarsIcon from "../assets/icons/stars.svg?react";
import StarPalettePicker from "./space/StarPalettePicker";
import Starfield from "./space/Starfield";
import { PlanetProjectionCanvas, usePlanetProjection } from "./space/PlanetProjection";
import OrbitResetControl from "./space/OrbitResetControl";
import SceneMotionControl from "./space/SceneMotionControl";
import SolarPerformanceControl from "./space/SolarPerformanceControl";
import SpaceOrbits from "./space/SpaceOrbits";
import { starPalettes } from "../data/starAppearance";
import type { StarAppearance } from "../data/starAppearance";
import "../styles/space-mode.css";

const portfolio = projects.find(project => project.subdomain === "portfolio");
const planets = projects.filter(project => project.subdomain !== "portfolio")
    .sort((a, b) => planetAppearance[a.subdomain].orbitRadius - planetAppearance[b.subdomain].orbitRadius);
const orbits = [
    ...planets.map(project => ({ id: project.subdomain, appearance: planetAppearance[project.subdomain] })),
    { id: "project-x", appearance: projectXAppearance },
];

type SpaceProps = {
    motionEnabled: boolean;
    onMotionChange: (enabled: boolean) => void;
    convectionEnabled: boolean;
    onConvectionChange: (enabled: boolean) => void;
    onReady: () => void;
    textureRevision: number;
    onReroll: () => void;
    starfieldRevision: number;
    onStarfieldReroll: () => void;
    starAppearance: StarAppearance;
    onStarAppearanceChange: (value: StarAppearance) => void;
};

function revealBody(viewport: HTMLElement | null, body: HTMLElement) {
    if (!viewport) return;
    const star = body.closest(".space-body-star");
    const target = star ? body.querySelector(".space-body-logo") : body;
    if (!target) return;
    const bounds = target.getBoundingClientRect();
    const bottomEdge = star ? body.querySelector(".space-body-label")?.getBoundingClientRect().bottom ?? bounds.bottom : bounds.bottom;
    const frame = viewport.getBoundingClientRect();
    // Scroll only this viewport; scrollIntoView can also pan the sun's clipped, oversized box.
    const controls = viewport.closest(".space-scene")?.querySelector(".space-controls")?.getBoundingClientRect();
    const top = Math.max(frame.top, controls?.bottom ?? frame.top + 60) + 12;
    const bottom = frame.bottom - 16;
    if (bounds.top < top) viewport.scrollTop += bounds.top - top;
    else if (bottomEdge > bottom) viewport.scrollTop += bottomEdge - bottom;
}

export default function Space({ textureRevision, onReroll, starfieldRevision, onStarfieldReroll, starAppearance, onStarAppearanceChange,
    motionEnabled, onMotionChange, convectionEnabled, onConvectionChange, onReady }: SpaceProps) {
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const projection = usePlanetProjection();
    const renderer = projection?.renderer;
    const reduced = projection?.reduced;
    const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 60rem)").matches);
    const sceneRef = useRef<HTMLElement>(null);
    const stableHeightRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const mobileStartSet = useRef(false);
    const navigationHelpId = useId();
    const [sceneSize, setSceneSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight,
        stableHeight: window.innerHeight, headerBottom: 0, textScale: 1 }));
    const layout = useMemo(() => getSpaceLayout(sceneSize, !desktop), [sceneSize, desktop]);
    const { width, height, center: orbitCenter, starHeight, starWidth } = layout;
    const orbitalPaths = useMemo(() => orbits.map(({ id, appearance }, index) => ({ id, ...layout.body(appearance, index) })), [layout]);
    const starPalette = starPalettes.find(palette => palette.id === starAppearance.color) ?? starPalettes[0];

    function lightRotationFor(position: Point) {
        // Account for the projected scene's aspect ratio, keeping light aimed at the star.
        return Math.atan2(
            (orbitCenter.y - position.y) * (desktop ? sceneSize.height / height : 1),
            (orbitCenter.x - position.x) * sceneSize.width / width,
        ) * 180 / Math.PI + 180;
    }

    const projectXLayout = layout.body(projectXAppearance, 5);

    useLayoutEffect(() => {
        if (desktop) { mobileStartSet.current = false; return; }
        const viewport = scrollRef.current;
        if (!viewport || !sceneSize.headerBottom || mobileStartSet.current) return;
        viewport.scrollTop = viewport.scrollHeight;
        mobileStartSet.current = true;
        renderer?.refreshLayout();
    }, [desktop, sceneSize.headerBottom, renderer]);

    useLayoutEffect(() => () => {
        renderer?.orbits.detach();
        renderer?.refreshLayout();
    }, [renderer]);

    useLayoutEffect(() => {
        const root = sceneRef.current;
        const system = root?.querySelector<HTMLElement>(".space-system"), viewport = scrollRef.current;
        if (!root || !renderer || !system || !viewport) return;
        const bounds = root.getBoundingClientRect();
        // Media-query state and ResizeObserver measurements can arrive in separate commits.
        // Never cache a new layout's starting phases using the previous viewport's dimensions.
        if (desktop !== window.matchMedia("(min-width: 60rem)").matches
            || Math.abs(bounds.width - sceneSize.width) > 0.5 || Math.abs(bounds.height - sceneSize.height) > 0.5) return;
        const bodies = orbits.flatMap(({ id, appearance }, index) => {
            const element = root.querySelector<HTMLElement>(`[data-orbit-id="${id}"]`);
            const body = layout.body(appearance, index);
            return element ? [{ id, element, orbit: { center: body.center, radiusX: body.radiusX,
                radiusY: body.radiusY, tilt: body.tilt }, initialPosition: body.position,
                phase: body.phase, degreesPerSecond: body.degreesPerSecond, compactSpeed: body.compactSpeed }] : [];
        });
        renderer.orbits.configure({ width, height, headerBottom: sceneSize.headerBottom, focusTop: desktop ? sceneSize.headerBottom + 8 : 0,
            compact: !desktop, compactMotion: layout.compactMotion, system, viewport,
            center: layout.center, starWidth, starHeight, bodies }, root);
        renderer.refreshLayout();
        // Geometry changes only; texture/palette/dialog updates must not reset orbital phases.
    }, [renderer, desktop, layout, width, height, starWidth, starHeight, sceneSize.width, sceneSize.height, sceneSize.headerBottom]);

    useLayoutEffect(() => {
        if (reduced) renderer?.orbits.reset();
    }, [renderer, desktop, reduced]);

    useEffect(() => {
        const query = window.matchMedia("(min-width: 60rem)");
        const onChange = () => setDesktop(query.matches);
        query.addEventListener("change", onChange);
        return () => query.removeEventListener("change", onChange);
    }, []);

    useLayoutEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;
        const header = scene.parentElement?.querySelector<HTMLElement>(":scope > .header");
        const updateSize = () => {
            const bounds = scene.getBoundingClientRect();
            const { width, height } = bounds;
            const stableHeight = stableHeightRef.current?.getBoundingClientRect().height || height;
            const headerBottom = header ? header.getBoundingClientRect().bottom - bounds.top : 0;
            const textScale = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
            setSceneSize(previous => previous.width === width && previous.height === height && previous.stableHeight === stableHeight
                && previous.headerBottom === headerBottom && previous.textScale === textScale
                ? previous : { width, height, stableHeight, headerBottom, textScale });
        };
        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(scene);
        if (header) observer.observe(header);
        if (stableHeightRef.current) observer.observe(stableHeightRef.current);
        observer.observe(document.documentElement);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
            if (document.querySelector("dialog[open]")) return;
            const target = event.target instanceof HTMLElement ? event.target : null;
            if (target?.isContentEditable || target?.closest("input, textarea, select, [role='textbox'], .space-controls")) return;
            const bodies = Array.from(sceneRef.current?.querySelectorAll<HTMLElement>("[data-space-body]") ?? []);
            if (!bodies.length) return;
            const index = bodies.findIndex(body => body === document.activeElement);
            const direction = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : -1;
            const next = index < 0 ? 0 : (index + direction + bodies.length) % bodies.length;
            event.preventDefault();
            bodies[next].focus({ preventScroll: true });
            if (!desktop) revealBody(scrollRef.current, bodies[next]);
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [desktop]);

    useLayoutEffect(() => {
        // Keep a focused body visible after orientation/breakpoint changes, without disturbing dialogs.
        const focus = document.activeElement;
        if (!desktop && focus instanceof HTMLElement && focus.matches("[data-space-body]:focus-visible") && !activeProject) {
            revealBody(scrollRef.current, focus);
        }
    }, [desktop, width, height, sceneSize.height, sceneSize.headerBottom, activeProject]);

    return (
        <main ref={sceneRef} className={`space-scene${desktop ? "" : " space-scene-mobile"}`} aria-label="Space Mode project system" style={{
            "--space-header-bottom": sceneSize.headerBottom ? `${sceneSize.headerBottom}px` : undefined,
        } as CSSProperties}>
            <div ref={stableHeightRef} className="space-stable-height" aria-hidden="true" />
            {desktop && <Starfield revision={starfieldRevision}
                maxClusterDiameter={Math.min(36, layout.body(planetAppearance["word-wasp"], 0).diameter / 2)} />}
            <div className="space-controls">
                <SolarPerformanceControl enabled={convectionEnabled} motionEnabled={motionEnabled} onChange={onConvectionChange} />
                <StarPalettePicker value={starAppearance} onChange={onStarAppearanceChange} />
                <span className="space-mobile-motion"><SceneMotionControl enabled={motionEnabled} onChange={onMotionChange} /></span>
                <OrbitResetControl />
                <button type="button" className="icon-button space-reroll" onClick={onReroll}
                    aria-label="Reroll planet textures" title="Reroll planet textures">
                    <RefreshIcon aria-hidden="true" focusable="false" />
                </button>
                <button type="button" className="icon-button space-starfield-reroll" onClick={onStarfieldReroll}
                    aria-label="Reroll starfield" title="Reroll starfield">
                    <StarsIcon aria-hidden="true" focusable="false" />
                </button>
                <span className="space-status" role="status">
                    {textureRevision > 0 ? `Planet textures regenerated ${textureRevision} ${textureRevision === 1 ? "time" : "times"}.` : ""}
                </span>
                <span className="space-status" role="status">
                    {starfieldRevision > 0 ? `Starfield regenerated ${starfieldRevision} ${starfieldRevision === 1 ? "time" : "times"}.` : ""}
                </span>
            </div>
            <div ref={scrollRef} className="space-viewport">
                <div className="space-system" style={desktop ? undefined : { height: `${height}px` }}>
                    {!desktop && <Starfield revision={starfieldRevision}
                        maxClusterDiameter={Math.min(36, layout.body(planetAppearance["word-wasp"], 0).diameter / 2)} />}
                    <SpaceOrbits bodies={orbitalPaths} width={width} height={height} desktop={desktop}
                        viewport={sceneSize} sun={{ center: orbitCenter, width: starWidth, height: starHeight }} />
                    <p id={navigationHelpId} className="space-status">
                        Use Right or Up to move forward, Left or Down to move back. Navigation wraps.
                        Press Enter to open project details. Project X has no details yet.
                    </p>
                    <ul className="space-bodies" aria-label="Portfolio planetary system" aria-describedby={navigationHelpId}
                        onFocus={event => {
                            if (!desktop && event.target instanceof HTMLElement && event.target.matches("[data-space-body]:focus-visible")) {
                                revealBody(scrollRef.current, event.target);
                            }
                        }}>
                        {portfolio && <CelestialBody project={portfolio} position={orbitCenter} sceneSize={layout}
                            diameter={starWidth} height={starHeight} color={starPalette.color} star
                            starPalette={starPalette} starSeed={starAppearance.seed}
                            selected={activeProject === portfolio} onSelect={setActiveProject} />}
                        {planets.map((project, index) => {
                            const appearance = planetAppearance[project.subdomain];
                            const { position, diameter } = layout.body(appearance, index);

                            return <CelestialBody key={project.subdomain} project={project} position={position}
                                orbitRadius={appearance.orbitRadius}
                                sceneSize={layout} diameter={diameter} color={appearance.color}
                                surface={{ ...appearance, seed: textureRevision === 0 ? appearance.seed : `${appearance.seed}:${textureRevision}` }} lightRotation={lightRotationFor(position)}
                                selected={activeProject === project} onSelect={setActiveProject} />;
                        })}
                        <CelestialBody name={projectXAppearance.name} position={projectXLayout.position} sceneSize={layout}
                            orbitRadius={projectXAppearance.orbitRadius}
                            diameter={projectXLayout.diameter} color={projectXAppearance.color}
                            surface={{ ...projectXAppearance, seed: textureRevision === 0 ? projectXAppearance.seed : `${projectXAppearance.seed}:${textureRevision}` }}
                            lightRotation={lightRotationFor(projectXLayout.position)} />
                    </ul>
                    {!desktop && <PlanetProjectionCanvas layoutKey={`${sceneSize.width}:${sceneSize.height}:${sceneSize.headerBottom}:${height}`} onReady={onReady} />}
                </div>
            </div>
            {desktop && <PlanetProjectionCanvas layoutKey={`${sceneSize.width}:${sceneSize.height}:${sceneSize.headerBottom}:${height}`} onReady={onReady} />}
            {activeProject && <ProjectView key={activeProject.subdomain} project={activeProject} onClose={() => setActiveProject(null)} />}
        </main>
    );
}
