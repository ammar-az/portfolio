import type { CSSProperties } from "react";
import type { Project } from "../../types/project";
import type { Point } from "../../utils/spaceGeometry";
import type { PlanetTextureOptions } from "../../utils/planetTextures";
import PlanetSurface from "./PlanetSurface";
import StarSurface from "./StarSurface";
import type { StarPalette } from "../../data/starAppearance";

type BodyIdentity = {
    project: Project;
    name?: never;
    selected: boolean;
    onSelect: (project: Project) => void;
} | {
    project?: never;
    name: string;
    selected?: never;
    onSelect?: never;
};

type CelestialBodyProps = BodyIdentity & {
    position: Point;
    sceneSize: { width: number; height: number };
    diameter: number;
    height?: number;
    color: string;
    star?: boolean;
    starPalette?: StarPalette;
    starSeed?: number;
    surface?: PlanetTextureOptions;
    lightRotation?: number;
    orbitRadius?: number;
};

export default function CelestialBody({ project, name, position, sceneSize, diameter, height = diameter, color, star = false, starPalette, starSeed = 1871, surface, lightRotation = 0, orbitRadius, selected = false, onSelect }: CelestialBodyProps) {
    const Logo = project?.logo;
    const label = project ? project.name : name;
    const style = {
        left: `${position.x / sceneSize.width * 100}%`,
        top: `${position.y / sceneSize.height * 100}%`,
        "--body-diameter": `${diameter}px`,
        "--body-height": `${height}px`,
        "--body-color": color,
        "--light-rotation": `${lightRotation}deg`,
        "--star-highlight": starPalette?.highlight,
    } as CSSProperties;
    // Keep teaser names visually minimal while distinguishing them for assistive technology.
    const accessibleName = project?.name === "Future Project"
        ? `${project.name} (${project.featuredTechnologies[0]?.name})`
        : label;

    const contents = <>
        <span className={`space-body-logo${project?.logoBackground === "light" ? " space-body-logo-light" : ""}`} aria-hidden="true">
            {Logo && <Logo focusable="false" />}
        </span>
        <span className={`space-body-sphere${surface ? ` space-body-sphere-${surface.type}` : ""}`} aria-hidden="true">
            {star && starPalette ? <StarSurface palette={starPalette} seed={starSeed} /> : surface && <PlanetSurface {...surface} lightRotation={lightRotation} orbitRadius={orbitRadius} />}
        </span>
        <span className="space-body-label">{label}</span>
    </>;

    return (
        <li className={`space-body${star ? " space-body-star" : ""}${project ? "" : " space-body-ambient"}`} style={style}>
            {project && onSelect ? <button type="button" className="space-body-content space-body-button" data-project={project.subdomain} data-space-body={project.subdomain}
                data-selected={selected || undefined} aria-haspopup="dialog"
                aria-label={`Open ${accessibleName} project details`} onClick={() => onSelect(project)}>
                {contents}
            </button> : <div className="space-body-content" data-space-body="project-x" tabIndex={0} role="group" aria-label={`${label}, no details yet`}>{contents}</div>}
        </li>
    );
}
