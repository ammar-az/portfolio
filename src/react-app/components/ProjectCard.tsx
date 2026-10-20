import { Project } from "../types/project";
import "../styles/simple-mode.css";

type ProjectCardProps = {
    project: Project;
    onClick: () => void;
};



export default function ProjectCard({
    project,
    onClick,
}: ProjectCardProps){
    const Logo = project.logo

    return(
        <button className="card" onClick={onClick}>
            <div className="card-preview"> 
                <img className="card-img"></img>
            </div>

            <div className="card-info (flex-row)"> 
                <Logo className="card-logo"/>
                <h2 className="card-name">{project.name}</h2>
            </div>
        </button>
    );
}
