import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { projects } from "../data/projects";
import type { Project } from "../types/project";
import { planetAppearance, projectXAppearance, spaceScene } from "../data/spaceScene";
import { getOrbitPoint } from "../utils/spaceGeometry";
import type { Point } from "../utils/spaceGeometry";
import CelestialBody from "./space/CelestialBody";
import ProjectView from "./ProjectView";
import RefreshIcon from "../assets/icons/refresh.svg?react";
import StarsIcon from "../assets/icons/stars.svg?react";
import planetIconUrl from "../assets/icons/planet.svg?url&no-inline";
import StarPalettePicker from "./space/StarPalettePicker";
import Starfield from "./space/Starfield";
import { starPalettes } from "../data/starAppearance";
import type { StarAppearance } from "../data/starAppearance";
import "../styles/space-mode.css";

type SpaceProps = {
    textureRevision: number;
    onReroll: () => void;
    onSimpleMode: () => void;
    starfieldRevision: number;
    onStarfieldReroll: () => void;
    starAppearance: StarAppearance;
    onStarAppearanceChange: (value: StarAppearance) => void;
};

export default function Space({ textureRevision, onReroll, onSimpleMode, starfieldRevision, onStarfieldReroll, starAppearance, onStarAppearanceChange }: SpaceProps) {
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 60rem)").matches);
    const sceneRef = useRef<HTMLElement>(null);
    const navigationHelpId = useId();
    const [sceneSize, setSceneSize] = useState(() => ({ width: window.innerWidth, height: window.innerHeight, headerBottom: 0 }));
    const portfolio = projects.find(project => project.subdomain === "portfolio");
    const planets = projects.filter(project => project.subdomain !== "portfolio")
        .sort((a, b) => planetAppearance[a.subdomain].orbitRadius - planetAppearance[b.subdomain].orbitRadius);
    const { width, height, star, orbitTilt, orbitFlattening } = spaceScene;
    const starHeight = sceneSize.height * star.heightRatio;
    const starWidth = starHeight * star.aspectRatio;
    const starOffsetX = starHeight * star.offsetRatio;
    const starCenterY = (sceneSize.headerBottom + sceneSize.height) / 2;
    // Project the height-scaled sun anchor into SVG units so paths and lighting share its center.
    const orbitCenter = { x: starOffsetX * width / sceneSize.width, y: starCenterY * height / sceneSize.height };
    const starPalette = starPalettes.find(palette => palette.id === starAppearance.color) ?? starPalettes[0];
    const orbits = [
        ...planets.map(project => ({ id: project.subdomain, appearance: planetAppearance[project.subdomain] })),
        { id: "project-x", appearance: projectXAppearance },
    ];

    function positionFor(appearance: { orbitRadius: number; phase: number }) {
        return getOrbitPoint({
            center: orbitCenter,
            radiusX: appearance.orbitRadius,
            radiusY: appearance.orbitRadius * orbitFlattening,
            tilt: orbitTilt,
        }, appearance.phase);
    }

    function lightRotationFor(position: Point) {
        // Account for the projected scene's aspect ratio, keeping light aimed at the star.
        return Math.atan2(
            (orbitCenter.y - position.y) * sceneSize.height / height,
            (orbitCenter.x - position.x) * sceneSize.width / width,
        ) * 180 / Math.PI + 180;
    }

    const projectXPosition = positionFor(projectXAppearance);

    useEffect(() => {
        const query = window.matchMedia("(min-width: 60rem)");
        const onChange = () => {
            setDesktop(query.matches);
            if (!query.matches) setActiveProject(null);
        };
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
            setSceneSize(previous => previous.width === width && previous.height === height && previous.headerBottom === headerBottom
                ? previous : { width, height, headerBottom });
        };
        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(scene);
        if (header) observer.observe(header);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!desktop) return;
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
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [desktop]);

    return (
        <main ref={sceneRef} className="space-scene" aria-label={desktop ? "Space Mode project system" : "Space Mode"} style={{
            "--star-offset-x": `${starOffsetX}px`,
            "--space-header-bottom": sceneSize.headerBottom ? `${sceneSize.headerBottom}px` : undefined,
        } as CSSProperties}>
            <Starfield revision={starfieldRevision} />
            <div className="space-controls">
                {desktop && <>
                    <StarPalettePicker value={starAppearance} onChange={onStarAppearanceChange} />
                    <button type="button" className="icon-button space-reroll" onClick={onReroll}
                        aria-label="Reroll planet textures" title="Reroll planet textures">
                        <RefreshIcon aria-hidden="true" focusable="false" />
                    </button>
                </>}
                <button type="button" className="icon-button space-starfield-reroll" onClick={onStarfieldReroll}
                    aria-label="Reroll starfield" title="Reroll starfield">
                    <StarsIcon aria-hidden="true" focusable="false" />
                </button>
                {desktop && <span className="space-status" role="status">
                    {textureRevision > 0 ? `Planet textures regenerated ${textureRevision} ${textureRevision === 1 ? "time" : "times"}.` : ""}
                </span>}
                <span className="space-status" role="status">
                    {starfieldRevision > 0 ? `Starfield regenerated ${starfieldRevision} ${starfieldRevision === 1 ? "time" : "times"}.` : ""}
                </span>
            </div>
            {desktop ? <>
                <svg className="space-orbits" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
                    {orbits.map(({ id, appearance }) =>
                        <ellipse key={id} cx={orbitCenter.x} cy={orbitCenter.y}
                            rx={appearance.orbitRadius} ry={appearance.orbitRadius * orbitFlattening}
                            transform={`rotate(${orbitTilt} ${orbitCenter.x} ${orbitCenter.y})`} />
                    )}
                </svg>
                <p id={navigationHelpId} className="space-status">
                    Use Right or Up to move forward, Left or Down to move back. Navigation wraps.
                    Press Enter to open project details. Project X has no details yet.
                </p>
                <ul className="space-bodies" aria-label="Portfolio planetary system" aria-describedby={navigationHelpId}>
                    {portfolio && <CelestialBody project={portfolio} position={orbitCenter}
                        diameter={starWidth} height={starHeight} color={starPalette.color} star
                        starPalette={starPalette} starFinish={starAppearance.finish} starSeed={starAppearance.seed}
                        selected={activeProject === portfolio} onSelect={setActiveProject} />}
                    {planets.map(project => {
                        const appearance = planetAppearance[project.subdomain];
                        const position = positionFor(appearance);

                        return <CelestialBody key={project.subdomain} project={project} position={position}
                            diameter={appearance.diameter} color={appearance.color}
                            surface={{ ...appearance, seed: textureRevision === 0 ? appearance.seed : `${appearance.seed}:${textureRevision}` }} lightRotation={lightRotationFor(position)}
                            selected={activeProject === project} onSelect={setActiveProject} />;
                    })}
                    <CelestialBody name={projectXAppearance.name} position={projectXPosition}
                        diameter={projectXAppearance.diameter} color={projectXAppearance.color}
                        surface={{ ...projectXAppearance, seed: textureRevision === 0 ? projectXAppearance.seed : `${projectXAppearance.seed}:${textureRevision}` }}
                        lightRotation={lightRotationFor(projectXPosition)} />
                </ul>
                {activeProject && <ProjectView key={activeProject.subdomain} project={activeProject} onClose={() => setActiveProject(null)} />}
            </> : <section className="space-mobile-notice" aria-labelledby={navigationHelpId}>
                <div className="space-mobile-message">
                    <img className="space-mobile-icon" src={planetIconUrl} alt="" aria-hidden="true" />
                    <h1 id={navigationHelpId}>Space Mode isn't currently supported on mobile.</h1>
                    <p>You can still explore all my projects in Simple Mode.</p>
                    <button type="button" className="button" onClick={onSimpleMode}>Switch to Simple Mode</button>
                </div>
            </section>}
        </main>
    );
}
