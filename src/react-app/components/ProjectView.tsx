import { useEffect, useId, useRef, useState } from "react";
import type { Project } from "../types/project";
import { stackLabels } from "../types/project";
import "../styles/project-view.css";
import useModalDialog from "../hooks/useModalDialog";
import CloseIcon from "../assets/icons/close.svg?react";

type ProjectViewProps = { project: Project; onClose: () => void };

export default function ProjectView({ project, onClose }: ProjectViewProps) {
    const { dialogRef, open, close, restore } = useModalDialog();
    const contentRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const [imageIndex, setImageIndex] = useState(0);
    const Logo = project.logo;
    const selectedImage = project.images[imageIndex];
    const liveUrl = project.liveUrl;
    const hasLinks = !!(liveUrl || project.repositories?.length);
    const navigateImage = (direction: number) => {
        setImageIndex(index => (index + direction + project.images.length) % project.images.length);
    };

    useEffect(() => {
        open();
        dialogRef.current?.querySelector<HTMLButtonElement>(".project-close")?.focus({ preventScroll: true });
        return close;
    }, [open, close, dialogRef]);

    useEffect(() => {
        const thumbnail = contentRef.current?.querySelector<HTMLButtonElement>('.project-thumbnail[aria-pressed="true"]');
        const strip = thumbnail?.parentElement;
        if (!thumbnail || !strip) return;
        // Move only the horizontal strip; scrollIntoView would also move the dialog body.
        const item = thumbnail.getBoundingClientRect();
        const frame = strip.getBoundingClientRect();
        if (item.left < frame.left) strip.scrollLeft -= frame.left - item.left + 4;
        else if (item.right > frame.right) strip.scrollLeft += item.right - frame.right + 4;
    }, [imageIndex]);

    return (
        <dialog ref={dialogRef} className="project-dialog" aria-labelledby={titleId} onClose={restore} onCancel={event => { event.preventDefault(); onClose(); }} onKeyDown={event => {
            if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            if (event.target instanceof HTMLElement && (event.target.isContentEditable || event.target.closest("input, textarea, select"))) return;
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault();
                event.stopPropagation();
                contentRef.current?.focus({ preventScroll: true });
                if (project.images.length > 1) navigateImage(event.key === "ArrowLeft" ? -1 : 1);
            } else if (event.key === "ArrowUp" || event.key === "ArrowDown") {
                event.preventDefault();
                event.stopPropagation();
                contentRef.current?.scrollBy({ top: event.key === "ArrowUp" ? -60 : 60, behavior: "instant" });
            }
        }}>
            <header className="project-heading">
                <Logo className={`project-logo${project.logoBackground ? ` logo-background-${project.logoBackground}` : ""}`} aria-hidden="true" />
                <div className="project-heading-copy">
                    <h2 id={titleId}>{liveUrl ? <a href={liveUrl} target="_blank" rel="noopener noreferrer">{project.name} <span className="external-mark" aria-label="opens in a new tab">↗</span></a> : project.name}</h2>
                    <p>{project.summary}</p>
                </div>
                <button type="button" className="icon-button project-close" aria-label="Close project details" onClick={onClose} autoFocus><CloseIcon aria-hidden="true" focusable="false" /></button>
            </header>
            <div ref={contentRef} className="project-content" tabIndex={-1}>
                <div className="project-sections">
                    <div className="project-main">
                        {selectedImage && <section className="project-gallery" aria-label={`${project.name} screenshots`}>
                            <div className="project-image-frame">
                                <img src={selectedImage.src} alt={selectedImage.alt} draggable={false} />
                                {project.images.length > 1 && <>
                                    <button type="button" className="project-gallery-arrow project-gallery-previous" aria-label="Previous screenshot" onClick={() => navigateImage(-1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg></button>
                                    <button type="button" className="project-gallery-arrow project-gallery-next" aria-label="Next screenshot" onClick={() => navigateImage(1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg></button>
                                </>}
                            </div>
                            <div className="project-image-caption" aria-live="polite" aria-atomic="true"><span>{selectedImage.alt}</span>{project.images.length > 1 && <span>{imageIndex + 1} / {project.images.length}</span>}</div>
                            {project.images.length > 1 && <div className="project-thumbnails" aria-label="Choose screenshot">
                                {project.images.map((image, index) => <button type="button" key={image.src} className="project-thumbnail" aria-label={`Show ${image.alt}`} aria-pressed={imageIndex === index} onClick={() => setImageIndex(index)}><img src={image.src} alt="" loading="lazy" /></button>)}
                            </div>}
                        </section>}
                        <section className="project-description" aria-labelledby={`${titleId}-about`}><h3 id={`${titleId}-about`}>About the project</h3>{project.description.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph.trim()}</p>)}</section>
                    </div>
                    {(hasLinks || project.stack.length > 0) && <aside className="project-sidebar" aria-label="Project links and technologies">
                        {hasLinks && <div className="project-links">
                            <div className={`project-link-buttons${liveUrl && (project.repositories?.length ?? 0) > 1 ? " project-link-buttons-multiple-repos" : ""}`}>
                                {liveUrl && <a className="button button-primary" href={liveUrl} target="_blank" rel="noopener noreferrer">Live project ↗</a>}
                                {project.repositories?.map(repository => <a className="button" key={repository.url} href={repository.url} target="_blank" rel="noopener noreferrer">{repository.label} ↗</a>)}
                            </div>
                            {liveUrl && <a className="project-domain" href={liveUrl} target="_blank" rel="noopener noreferrer">{new URL(liveUrl).hostname}</a>}
                        </div>}
                        {project.stack.length > 0 && <section className="project-stack" aria-labelledby={`${titleId}-stack`}>
                            <h3 id={`${titleId}-stack`}>Technology stack</h3>
                            <div className="stack-groups">{project.stack.map(group => <section className="stack-group" key={group.category}>
                                <h4>{stackLabels[group.category]}</h4>
                                <ul className="stack-technologies">{group.technologies.map(technology => {
                                    const TechnologyLogo = technology.logo;
                                    return <li key={technology.name}><TechnologyLogo aria-hidden="true" /><span>{technology.name}</span></li>;
                                })}</ul>
                            </section>)}</div>
                        </section>}
                    </aside>}
                </div>
            </div>
        </dialog>
    );
}
