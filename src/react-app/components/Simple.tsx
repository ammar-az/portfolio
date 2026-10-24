import { useEffect, useRef, useState } from "react";
import type { Project } from "../types/project";
import { projects } from "../data/projects";
import ProjectCard from "./ProjectCard";
import ProjectView from "./ProjectView";
import "../styles/simple-mode.css";

type SimpleProps = { onSpaceMode?: () => void };

export default function Simple({ onSpaceMode }: SimpleProps) {
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const cardsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const focusProjects = (event: KeyboardEvent) => {
            if (activeProject || document.querySelector("dialog[open]")) return;
            if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
            if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
            if (document.activeElement !== document.body && document.activeElement !== document.documentElement) return;
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed) return;
            const firstCard = cardsRef.current?.querySelector<HTMLButtonElement>(":scope > .card");
            if (firstCard) {
                event.preventDefault();
                firstCard.focus();
            }
        };
        document.addEventListener("keydown", focusProjects);
        return () => document.removeEventListener("keydown", focusProjects);
    }, [activeProject]);

    return (
        <main className="simple-page">
            <section className="intro" aria-labelledby="intro-title">
                <span className="intro-eyebrow">Welcome to my portfolio</span>
                <h1 id="intro-title">Ammar <span>Zaghloul</span></h1>
                <p className="intro-role">Full-Stack Developer</p>
                <p className="intro-description">I create interesting applications. Some of them might even be useful.</p>
                <div className="intro-actions">
                    <a className="button button-primary" href="#projects">View my projects <span aria-hidden="true">↓</span></a>
                    {onSpaceMode ? (
                        <button type="button" className="button" onClick={onSpaceMode}>Explore Immersive View <span aria-hidden="true">↗</span></button>
                    ) : <span className="intro-space-note">Immersive View<span>Coming soon</span></span>}
                </div>
            </section>
            <section id="projects" className="projects-section" aria-labelledby="projects-title">
                <div className="projects-heading">
                    <h2 id="projects-title">Projects</h2>
                    <p>A collection of applications I've built.</p>
                </div>
                <div ref={cardsRef} className="card-layout" onKeyDown={event => {
                    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
                    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
                    const cards = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>(":scope > .card"));
                    const index = cards.findIndex(card => card === event.target);
                    if (index < 0) return;
                    event.preventDefault();
                    const columns = getComputedStyle(event.currentTarget).gridTemplateColumns.split(" ").length;
                    let nextIndex = index;
                    if (event.key === "ArrowLeft" && index % columns > 0) nextIndex--;
                    if (event.key === "ArrowRight" && index % columns < columns - 1) nextIndex++;
                    if (event.key === "ArrowUp") nextIndex -= columns;
                    if (event.key === "ArrowDown") nextIndex += columns;
                    cards[nextIndex]?.focus();
                }}>
                    {projects.map(project => <ProjectCard key={project.subdomain} project={project} onClick={() => setActiveProject(project)} />)}
                </div>
            </section>
            {activeProject && <ProjectView key={activeProject.subdomain} project={activeProject} onClose={() => setActiveProject(null)} />}
        </main>
    );
}
