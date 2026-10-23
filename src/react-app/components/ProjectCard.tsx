import type { Project } from "../types/project";

type ProjectCardProps = { project: Project; onClick: () => void };

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
    const Logo = project.logo;
    const preview = project.images[0];

    return (
        <button type="button" className="card" onClick={onClick} aria-label={`View ${project.name} project details`}>
            <span className="card-preview">
                {preview ? <img className="card-img" src={preview.src} alt="" loading="lazy" /> : (
                    <span className="card-preview-empty"><Logo aria-hidden="true" /><span>{project.name}</span></span>
                )}
            </span>
            <span className="card-info">
                <span className={`card-logo-frame${project.logoBackground ? ` logo-background-${project.logoBackground}` : ""}`}><Logo className="card-logo" aria-hidden="true" /></span>
                <span className="card-copy">
                    <span className="card-name">{project.name}</span>
                    <span className="card-summary">{project.summary}</span>
                    <span className="card-technologies">
                        {project.featuredTechnologies.map(technology => <span className="technology-tag" key={technology.name}>{technology.name}</span>)}
                    </span>
                </span>
                <span className="card-arrow" aria-hidden="true">›</span>
            </span>
        </button>
    );
}
