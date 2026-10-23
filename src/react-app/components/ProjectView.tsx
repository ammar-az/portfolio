import { useEffect, useId, useRef, useState } from "react";
import type { Project } from "../types/project";
import { stackLabels } from "../types/project";
import "../styles/project-view.css";

type ProjectViewProps = { project: Project; onClose: () => void };

export default function ProjectView({ project, onClose }: ProjectViewProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const [imageIndex, setImageIndex] = useState(0);
    const Logo = project.logo;
    const selectedImage = project.images[imageIndex];
    const liveUrl = project.liveUrl;

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        dialog.showModal();
        document.body.style.overflow = "hidden";
        return () => {
            dialog.close();
            document.body.style.overflow = previousOverflow;
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
        };
    }, []);

    return (
        <dialog ref={dialogRef} className="project-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}>
            <header className="project-heading">
                <Logo className="project-logo" aria-hidden="true" />
                <div className="project-heading-copy">
                    <h2 id={titleId}>{liveUrl ? <a href={liveUrl} target="_blank" rel="noopener noreferrer">{project.name} <span className="external-mark" aria-label="opens in a new tab">↗</span></a> : project.name}</h2>
                    <p>{project.summary}</p>
                </div>
                <button type="button" className="icon-button project-close" aria-label="Close project details" onClick={onClose} autoFocus>×</button>
            </header>
            <div className="project-content">
                <div className="project-visual">
                    <section className="project-gallery" aria-label={`${project.name} screenshots`}>
                        <div className="project-image-frame">
                            {selectedImage ? <img src={selectedImage.src} alt={selectedImage.alt} /> : <div className="project-image-empty"><Logo aria-hidden="true" /><p>{project.name}</p></div>}
                        </div>
                        {selectedImage && <div className="project-image-caption"><span>{selectedImage.alt}</span>{project.images.length > 1 && <span>{imageIndex + 1} / {project.images.length}</span>}</div>}
                        {project.images.length > 1 && <div className="project-thumbnails" aria-label="Choose screenshot">
                            {project.images.map((image, index) => <button type="button" key={image.src} className="project-thumbnail" aria-label={`Show ${image.alt}`} aria-pressed={imageIndex === index} onClick={() => setImageIndex(index)}><img src={image.src} alt="" loading="lazy" /></button>)}
                        </div>}
                    </section>
                    {project.stack.length > 0 && <section className="project-stack" aria-labelledby={`${titleId}-stack`}>
                        <h3 id={`${titleId}-stack`}>Technology stack</h3>
                        <p className="project-stack-intro">The tools behind {project.name}.</p>
                        <div className="stack-groups">{project.stack.map(group => <section className="stack-group" key={group.category}>
                            <h4>{stackLabels[group.category]}</h4>
                            <ul className="stack-technologies">{group.technologies.map(technology => {
                                const TechnologyLogo = technology.logo;
                                return <li key={technology.name}><TechnologyLogo aria-hidden="true" /><span>{technology.name}</span></li>;
                            })}</ul>
                        </section>)}</div>
                    </section>}
                </div>
                <section className="project-about" aria-labelledby={`${titleId}-about`}>
                    <div className="project-description"><h3 id={`${titleId}-about`}>About the project</h3>{project.description.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph.trim()}</p>)}</div>
                    {(liveUrl || !!project.repositories?.length) && <div className="project-links">
                        <div className="project-link-buttons">
                            {liveUrl && <a className="button button-primary" href={liveUrl} target="_blank" rel="noopener noreferrer">Live project ↗</a>}
                            {project.repositories?.map(repository => <a className="button" key={repository.url} href={repository.url} target="_blank" rel="noopener noreferrer">{repository.label} ↗</a>)}
                        </div>
                        {liveUrl && <a className="project-domain" href={liveUrl} target="_blank" rel="noopener noreferrer">{new URL(liveUrl).hostname}</a>}
                    </div>}
                </section>
            </div>
        </dialog>
    );
}
