import { useState, useEffect } from "react";
import { projects } from "../data/projects";
import ProjectCard from "./ProjectCard";
import ProjectView from "./ProjectView";
import { Project } from "../types/project";

import "../App.css";

export default function Simple(){
    const [activeProject, setActiveProject] = useState<Project | undefined>();

    function handleProjectOpen(project: Project){
        setActiveProject(project);
    }

    function handleProjectClose(){
        setActiveProject(undefined);
    }


    useEffect(() => {
        document.body.style.overflow = activeProject ? "hidden" : "";

        return () => {
            document.body.style.overflow = "";
        };
    }, [activeProject]);
    
    return (
            <div className="app">
                
                {activeProject && (
                    <div className="cover">
                    <ProjectView project={activeProject} onClose={handleProjectClose}/>
                    </div>
                )}

                <section className="intro">
                    <h2>Work in progress!</h2>
                    <p>Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos. Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor. Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra inceptos himenaeos.</p>
                </section>

                <div className="card-layout">
                    {projects.map((project) => (
                        <ProjectCard project={project} onClick={()=>handleProjectOpen(project)} />
                    ))}
                </div>
            </div>
    );
}
