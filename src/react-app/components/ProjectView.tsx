import { Project } from "../types/project";
import Question from "../assets/icons/question-circle.svg?react";
import "../styles/project-view.css";

type ProjectViewProps = {
    project: Project;
    onClose: () => void;
};

export default function ProjectView({
    project,
    onClose,
}: ProjectViewProps){
    const Logo = project.logo

    return(
        <div className="project-info">
            <section className="info-bar">
                <Logo className="info-logo"/>
                <div className="info-title">
                    <h1>{project.name}</h1>
                </div>
            <button className="exit-button" onClick={onClose}>
                <Question/>
            </button>
            </section>

            <section className="info-visual">
                <div className="info-visual-content"/>
            </section>

            <section className="info-text">
                <h3>
                    <span>url: </span>
                    <a href={`https://${project.subdomain}.ammarz.com`} target="_blank" rel="noopener noreferrer">{project.subdomain}.ammarz.com</a>
                </h3>

                <p className="info-desc">{project.description}</p>
            </section>
        </div>
    );
}
