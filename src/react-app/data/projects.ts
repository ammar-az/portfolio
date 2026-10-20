import { Project } from "../types/project";
import Wasp from "../assets/word-wasp.svg?react";
import Tasked from "../assets/tasked-ico.svg?react";

export const projects: Project[] = [
    {
        name: "Word Wasp",
        subdomain: "word-wasp",
        id: 0,
        summary: "It's a game",
        description: "NYT spelling bee clone",
        logo: Wasp,
    },
    {
        name: "Tasked",
        subdomain: "tasked",
        id: 1,
        summary: "it's a serious project",
        description: `Tasked is a full-stack project management application for creating projects, managing tasks, and collaborating with others. User-created projects and the corresponding tasks within them are the core of Tasked. Tasks can be created, updated, searched, and filtered by status in order to organize projects and keep track of work at all stages of completion. Tasked supports projects as simple as private to-do lists or as complex as multi-user group work with configurable project settings such as join policies and visibility. Role-based authorization of project members allow users to designate trusted contributors or admins as required. Server-side authorization ensures that users can only access resources as permitted, and refresh-token based authentication handles user sessions.
        \n\nTasked is a fully functional and deployed application, but I initially started Tasked to learn new technologies and refine some of my less tested skills. My primary goals were to learn C# and its ecosystem, deploy a containerized application using Docker, and familiarize myself with Azure deployment.
        \n\nTasked's frontend is built with React, Typescript, and React Router's framework mode. An Axios-based HTTP client communicates with the backend and the application handles routing, tracks authentication state, and provides a simple interface for projects and tasks.
        \n\nTasked's backend consists of an ASP.NET Core web application and a Microsoft SQL Server database. The web application handles application logic, authentication, enforces authorization rules, and exposes a RESTful API through ASP.NET Core controllers. Authentication uses JWT access tokens and HttpOnly cookies for refresh-token management. The API supports CRUD operations and searchable, sortable, filterable, and paginated data retrieval. Entity Framework Core maps application entities to the database, and schema migrations. The backend is containerized with Docker and deployed to Azure App Service, with Azure SQL hosting the database.`,
        logo: Tasked,
    },
    {
        id: 2,
        name: "Future Project",
        subdomain: "potential",
        summary: "",
        description: "A project yet to come...",
        logo: Wasp
    },
    {
        id: 3,
        name: "Future Project",
        subdomain: "potential",
        summary: "",
        description: "A project yet to come...",
        logo: Tasked
    },
    {
        id: 4,
        name: "Future Project",
        subdomain: "potential",
        summary: "",
        description: "A project yet to come...",
        logo: Wasp
    },
    {
        id: 5,
        name: "Future Project",
        subdomain: "potential",
        summary: "",
        description: "A project yet to come...",
        logo: Tasked
    },
    {
        id: 6,
        name: "Future Project",
        subdomain: "potential",
        summary: "",
        description: "A project yet to come...",
        logo: Wasp
    },
    {
        id: 7,
        name: "Future Project",
        subdomain: "potential",
        summary: "",
        description: "A project yet to come...",
        logo: Tasked
    }
    
];
