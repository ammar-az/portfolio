import type { Project } from "../types/project";
import { technologies as tech } from "./technologies";
import Wasp from "../assets/logos/word-wasp.svg?react";
import Tasked from "../assets/logos/tasked-ico.svg?react";
import FutureProject from "../assets/logos/future-project.svg?react";
import PortfolioLogo from "../components/PortfolioLogo";

export const projects: Project[] = [
    {
        name: "Portfolio",
        featuredTechnologies: [tech.react, tech.typescript, tech.vite],
        subdomain: "portfolio",
        liveUrl: "https://ammarz.com",
        githubUrl: "https://github.com/ammar-az/portfolio",
        summary: "My personal developer portfolio.",
        description: "A portfolio showcasing my projects.",
        logo: PortfolioLogo,
        images: [],
        stack: [
            { category: "frontend", technologies: [tech.react, tech.typescript, tech.css, tech.vite] },
            { category: "deployment", technologies: [tech.cloudflareworkers, tech.cloudflare] },
        ]
    },
    {
        name: "Tasked",
        featuredTechnologies: [tech.csharp, tech.aspnet, tech.sqlserver, tech.react],
        subdomain: "tasked",
        liveUrl: "https://tasked.ammarz.com",
        summary: "Collaborative project and task management.",
        description: `Tasked is a full-stack project management application for creating projects, managing tasks, and collaborating with others. User-created projects and the corresponding tasks within them are the core of Tasked. Tasks can be created, updated, searched, and filtered by status in order to organize projects and keep track of work at all stages of completion. Tasked supports projects as simple as private to-do lists or as complex as multi-user group work with configurable project settings such as join policies and visibility. Role-based authorization of project members allow users to designate trusted contributors or admins as required. Server-side authorization ensures that users can only access resources as permitted, and refresh-token based authentication handles user sessions.
        \n\nTasked is a fully functional and deployed application, but I initially started Tasked to learn new technologies and refine some of my less tested skills. My primary goals were to learn C# and its ecosystem, deploy a containerized application using Docker, and familiarize myself with Azure deployment.
        \n\nTasked's frontend is built with React, Typescript, and React Router's framework mode. An Axios-based HTTP client communicates with the backend and the application handles routing, tracks authentication state, and provides a simple interface for projects and tasks.
        \n\nTasked's backend consists of an ASP.NET Core web application and a Microsoft SQL Server database. The web application handles application logic, authentication, enforces authorization rules, and exposes a RESTful API through ASP.NET Core controllers. Authentication uses JWT access tokens and HttpOnly cookies for refresh-token management. The API supports CRUD operations and searchable, sortable, filterable, and paginated data retrieval. Entity Framework Core maps application entities to the database, and schema migrations. The backend is containerized with Docker and deployed to Azure App Service, with Azure SQL hosting the database.`,
        logo: Tasked,
        images: [{ src: "/previews/tasked.jpg", alt: "Tasked project workspace with task search, status filters, and task details" }],
        stack: [
            { category: "frontend", technologies: [tech.react, tech.typescript, tech.reactrouter, tech.axios] },
            { category: "backend", technologies: [tech.csharp, tech.aspnet, tech.efcore, tech.jwt] },
            { category: "data", technologies: [tech.sqlserver] },
            { category: "deployment", technologies: [tech.docker, tech.azure, tech.azuresql, tech.cloudflare] },
        ]
    },
    {
        name: "LoL Theme Guess",
        logoIsPlaceholder: true,
        featuredTechnologies: [tech.react, tech.typescript, tech.hono, tech.cloudflareworkers],
        subdomain: "ltg",
        liveUrl: "https://ltg.ammarz.com",
        summary: "A League of Legends theme guessing game.",
        description: "Guess League of Legends themes.",
        logo: FutureProject,
        images: [],
        stack: [
            { category: "frontend", technologies: [tech.typescript, tech.react, tech.tailwindcss] },
            { category: "backend", technologies: [tech.hono, tech.cloudflareworkers] },
            { category: "deployment", technologies: [tech.cloudflare] },
        ]
    },
    {
        name: "Word Wasp",
        featuredTechnologies: [tech.react, tech.typescript, tech.css],
        subdomain: "word-wasp",
        liveUrl: "https://word-wasp.ammarz.com",
        summary: "A word puzzle game inspired by NYT Spelling Bee.",
        description: "NYT spelling bee clone",
        logo: Wasp,
        images: [{ src: "/previews/word-wasp.jpg", alt: "Word Wasp puzzle with letter tiles, guessed words, and score" }],
        stack: [
            { category: "frontend", technologies: [tech.react, tech.typescript, tech.css] },
        ]
    },
    {
        name: "Future Project",
        logoIsPlaceholder: true,
        featuredTechnologies: [],
        subdomain: "potential",
        summary: "A project yet to come.",
        description: "A project yet to come...",
        logo: FutureProject,
        images: [],
        stack: []
    },

    
];
