import { useState } from "react";
import type { Project } from "../types/project";
import { projects } from "../data/projects";
import ProjectCard from "./ProjectCard";
import ProjectView from "./ProjectView";
import "../styles/simple-mode.css";

type SimpleProps = { onSpaceMode?: () => void };

export default function Simple({ onSpaceMode }: SimpleProps) {
    const [activeProject, setActiveProject] = useState<Project | null>(null);

    return (
        <main className="simple-page">
            <section className="intro" aria-labelledby="intro-title">
                <span className="intro-eyebrow">Welcome to my portfolio</span>
                <h1 id="intro-title">Ammar <span>Zaghloul</span></h1>
                <p className="intro-role">Full-Stack Developer</p>
                <p className="intro-description">I would introduce myself but this page isn't quite ready yet...</p>
                <div className="intro-actions">
                    <a className="button button-primary" href="#projects">View my projects <span aria-hidden="true">↓</span></a>
                    {onSpaceMode ? (
                        <button type="button" className="button" onClick={onSpaceMode}>Explore space mode <span aria-hidden="true">↗</span></button>
                    ) : <span className="intro-space-note">Interactive space mode<span>Coming soon</span></span>}
                </div>
            </section>
            <section id="projects" className="projects-section" aria-labelledby="projects-title">
                <div className="projects-heading">
                    <h2 id="projects-title">Projects</h2>
                    <p>A collection of applications I've built.</p>
                </div>
                <div className="card-layout">
                    {projects.map(project => <ProjectCard key={project.subdomain} project={project} onClick={() => setActiveProject(project)} />)}
                </div>
            </section>
            {activeProject && <ProjectView key={activeProject.subdomain} project={activeProject} onClose={() => setActiveProject(null)} />}
        </main>
    );
}
