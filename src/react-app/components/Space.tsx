import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
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
import { PlanetProjectionProvider, PlanetProjectionCanvas, PlanetRotationControl } from "./space/PlanetProjection";
import { starPalettes } from "../data/starAppearance";
import type { StarAppearance } from "../data/starAppearance";
import "../styles/space-mode.css";

type SpaceProps = {
    textureRevision: number;
    onReroll: () => void;
    starfieldRevision: number;
    onStarfieldReroll: () => void;
    starAppearance: StarAppearance;
    onStarAppearanceChange: (value: StarAppearance) => void;
    rotationEnabled: boolean;
    onRotationChange: (enabled: boolean) => void;
    rotationClock: { current: number };
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
    const top = frame.top + 72;
    const bottom = frame.bottom - 16;
    if (bounds.top < top) viewport.scrollTop += bounds.top - top;
    else if (bottomEdge > bottom) viewport.scrollTop += bottomEdge - bottom;
}

export default function Space({ textureRevision, onReroll, starfieldRevision, onStarfieldReroll, starAppearance, onStarAppearanceChange, rotationEnabled, onRotationChange, rotationClock }: SpaceProps) {
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 60rem)").matches);
    const sceneRef = useRef<HTMLElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const navigationHelpId = useId();
    const [sceneSize, setSceneSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight, headerBottom: 0, textScale: 1 }));
    const portfolio = projects.find(project => project.subdomain === "portfolio");
    const planets = projects.filter(project => project.subdomain !== "portfolio")
        .sort((a, b) => planetAppearance[a.subdomain].orbitRadius - planetAppearance[b.subdomain].orbitRadius);
    const layout = getSpaceLayout(sceneSize, !desktop);
    const { width, height, center: orbitCenter, starHeight, starWidth } = layout;
    const starPalette = starPalettes.find(palette => palette.id === starAppearance.color) ?? starPalettes[0];
    const orbits = [
        ...planets.map(project => ({ id: project.subdomain, appearance: planetAppearance[project.subdomain] })),
        { id: "project-x", appearance: projectXAppearance },
    ];

    function lightRotationFor(position: Point) {
        // Account for the projected scene's aspect ratio, keeping light aimed at the star.
        return Math.atan2(
            (orbitCenter.y - position.y) * (desktop ? sceneSize.height : height) / height,
            (orbitCenter.x - position.x) * sceneSize.width / width,
        ) * 180 / Math.PI + 180;
    }

    const projectXLayout = layout.body(projectXAppearance, 5);

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
            const headerBottom = header ? header.getBoundingClientRect().bottom - bounds.top : 0;
            const textScale = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
            setSceneSize(previous => previous.width === width && previous.height === height && previous.headerBottom === headerBottom && previous.textScale === textScale
                ? previous : { width, height, headerBottom, textScale });
        };
        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(scene);
        if (header) observer.observe(header);
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
        if (!desktop && focus instanceof HTMLElement && focus.matches("[data-space-body]") && !activeProject) {
            revealBody(scrollRef.current, focus);
        }
    }, [desktop, width, height, sceneSize.height, sceneSize.headerBottom, activeProject]);

    return (
        <PlanetProjectionProvider enabled={rotationEnabled} clock={rotationClock}>
            <main ref={sceneRef} className={`space-scene${desktop ? "" : " space-scene-mobile"}`} aria-label="Space Mode project system" style={{
                "--space-header-bottom": sceneSize.headerBottom ? `${sceneSize.headerBottom}px` : undefined,
            } as CSSProperties}>
                <Starfield revision={starfieldRevision} />
                <div className="space-controls">
                    <StarPalettePicker value={starAppearance} onChange={onStarAppearanceChange} />
                    <button type="button" className="icon-button space-reroll" onClick={onReroll}
                        aria-label="Reroll planet textures" title="Reroll planet textures">
                        <RefreshIcon aria-hidden="true" focusable="false" />
                    </button>
                    <button type="button" className="icon-button space-starfield-reroll" onClick={onStarfieldReroll}
                        aria-label="Reroll starfield" title="Reroll starfield">
                        <StarsIcon aria-hidden="true" focusable="false" />
                    </button>
                    <PlanetRotationControl enabled={rotationEnabled} onChange={onRotationChange} />
                    <span className="space-status" role="status">
                        {textureRevision > 0 ? `Planet textures regenerated ${textureRevision} ${textureRevision === 1 ? "time" : "times"}.` : ""}
                    </span>
                    <span className="space-status" role="status">
                        {starfieldRevision > 0 ? `Starfield regenerated ${starfieldRevision} ${starfieldRevision === 1 ? "time" : "times"}.` : ""}
                    </span>
                </div>
                <div ref={scrollRef} className="space-viewport">
                    <div className="space-system" style={desktop ? undefined : { height: `${height}px` }}>
                        <svg className="space-orbits" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
                            {orbits.map(({ id, appearance }, index) => {
                                const orbit = layout.body(appearance, index);
                                return <ellipse key={id} cx={orbitCenter.x} cy={orbitCenter.y}
                                    rx={orbit.radiusX} ry={orbit.radiusY}
                                    transform={`rotate(${orbit.tilt} ${orbitCenter.x} ${orbitCenter.y})`} />;
                            })}
                        </svg>
                        <p id={navigationHelpId} className="space-status">
                            Use Right or Up to move forward, Left or Down to move back. Navigation wraps.
                            Press Enter to open project details. Project X has no details yet.
                        </p>
                        <ul className="space-bodies" aria-label="Portfolio planetary system" aria-describedby={navigationHelpId}
                            onFocusCapture={event => {
                                if (!desktop && event.target instanceof HTMLElement && event.target.matches("[data-space-body]")) {
                                    revealBody(scrollRef.current, event.target);
                                }
                            }}>
                            {portfolio && <CelestialBody project={portfolio} position={orbitCenter} sceneSize={layout}
                                diameter={starWidth} height={starHeight} color={starPalette.color} star
                                starPalette={starPalette} starFinish={starAppearance.finish} starSeed={starAppearance.seed}
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
                    </div>
                </div>
                <PlanetProjectionCanvas layoutKey={`${desktop}:${sceneSize.width}:${sceneSize.height}:${sceneSize.headerBottom}:${height}`} />
                {activeProject && <ProjectView key={activeProject.subdomain} project={activeProject} onClose={() => setActiveProject(null)} />}
            </main>
        </PlanetProjectionProvider>
    );
}
