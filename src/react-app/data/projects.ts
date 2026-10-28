import type { Project } from "../types/project";
import { technologies as tech } from "./technologies";
import Wasp from "../assets/logos/word-wasp.svg?react";
import Tasked from "../assets/logos/tasked-ico.svg?react";
import FutureProject from "../assets/logos/future-project.svg?react";
import PortfolioLogo from "../components/PortfolioLogo";
import ThemeGuessLogo from "../components/ThemeGuessLogo";

export const projects: Project[] = [
    {
        name: "Tasked",
        featuredTechnologies: [tech.csharp, tech.aspnet, tech.sqlserver, tech.azure],
        subdomain: "tasked",
        repositories: [
            { label: "GitHub: Frontend", url: "https://github.com/ammar-az/tasked-frontend" },
            { label: "GitHub: Backend", url: "https://github.com/ammar-az/Tasked" },
        ],
        liveUrl: "https://tasked.ammarz.com",
        summary: "Collaborative project and task management.",
        description: `Tasked is a full-stack project management application for organizing tasks and collaborating with others. 
        Users can create or join projects, manage tasks, and keep track of assigned work.
        Configurable visibility, join policies, bans, and member roles give project owners full control of their project and let Tasked support anything from a private to-do list to a shared team project.
        \n\nI built Tasked to learn C# through a common backend stack: an ASP.NET Core API backed by SQL Server, with Entity Framework Core handling object-relational mapping and database migrations.
        The backend is responsible for authentication, session management using refresh tokens, authorization, and application logic for managing projects and tasks.
        The API is containerized with Docker and deployed to Azure App Service, with Azure SQL Database hosting application data.`,
        logo: Tasked,
        images: [
            { src: "/projects/tasked/tasked.jpg", alt: "Tasked project workspace with task search, status filters, and task details" },
            { src: "/projects/tasked/tasked-home.jpg", alt: "Tasked homepage introducing the application and its demo projects" },
            { src: "/projects/tasked/tasked-task-create.jpg", alt: "Task creation form" },
            { src: "/projects/tasked/tasked-task-edit.jpg", alt: "Task editing interface" },
            { src: "/projects/tasked/tasked-project-create.jpg", alt: "Project creation form" },
            { src: "/projects/tasked/tasked-project-settings.jpg", alt: "Project settings interface" },
            { src: "/projects/tasked/tasked-myacc.jpg", alt: "Account page with project memberships, assigned tasks, and invitations tabs" },
            { src: "/projects/tasked/tasked-orgs.jpg", alt: "Searchable list of organizations" },
            { src: "/projects/tasked/tasked-org.jpg", alt: "Organization page with projects and a members tab" },
            { src: "/projects/tasked/tasked-stack.jpg", alt: "Tasked architecture showing frontend, backend API, database, and deployment technologies" },
        ],
        stack: [
            { category: "frontend", technologies: [tech.react, tech.typescript, tech.reactrouter, tech.axios] },
            { category: "backend", technologies: [tech.csharp, tech.aspnet, tech.efcore, tech.jwt] },
            { category: "data", technologies: [tech.sqlserver] },
            { category: "deployment", technologies: [tech.docker, tech.azure, tech.azuresql, tech.cloudflare] },
        ]
    },
    {
        name: "LoL Theme Guess",
        featuredTechnologies: [tech.react, tech.typescript, tech.tailwindcss, tech.cloudflareworkers],
        subdomain: "ltg",
        liveUrl: "https://ltg.ammarz.com",
        summary: "A League of Legends theme guessing game.",
        description: `LoL Theme Guess is a game where players score points by listening to snippets of champion themes from League of Legends and guessing the champion.
        Players can configure the number of rounds, duration of snippets, and whether snippets come from random points in the song.
        Single-player and multiplayer gameplay are both supported, with Cloudflare Durable Objects handling unique lobby instances and synchronizing game state through WebSockets.`,
        logo: ThemeGuessLogo,
        images: [
            { src: "/projects/ltg/ltg.jpg", alt: "Theme guessing round with a countdown, guess input, and four players" },
            { src: "/projects/ltg/ltg-win-lose.jpg", alt: "Revealed champion theme with correct and incorrect player guesses" },
            { src: "/projects/ltg/ltg-home.jpg", alt: "LoL Theme Guess home screen with solo and multiplayer options" },
            { src: "/projects/ltg/ltg-lobby-wait.jpg", alt: "Multiplayer lobby with waiting and ready players" },
            { src: "/projects/ltg/ltg-guessed.jpg", alt: "Player cards showing a player with a submitted guess during a round alongside a player who has yet to guess" },
        ],
        stack: [
            { category: "frontend", technologies: [tech.typescript, tech.react, tech.tailwindcss] },
            { category: "backend", technologies: [tech.hono, tech.cloudflareworkers] },
            { category: "data", technologies: [tech.sqlite] },
            { category: "deployment", technologies: [tech.cloudflare] },
        ]
    },
    {
        name: "Portfolio",
        featuredTechnologies: [],
        subdomain: "portfolio",
        liveUrl: "https://ammarz.com/#space",
        repositories: [{ label: "GitHub", url: "https://github.com/ammar-az/portfolio" }],
        summary: "My personal developer portfolio.",
        description: `A place to showcase my projects. I wanted a distinctive page that reflected my interests, and being an amateur astronomer I quickly decided on a space theme, specifically a solar system.
        As solar systems are not an ideal way of conveying information, I realized I had to provide an alternative, more informative display if I didn't want to cover the scene in text.
        Instead of a landing page or explanation prompt, the site defaults to a simpler, more traditional portfolio featuring informative project cards with large previews.
        \n\nWith the default layout immediately recognizable as a portfolio, the space scene I envisioned could be created with more freedom.
        Space mode features an interactive, procedurally generated solar system. Planets orbit the star and have orbiters of their own. Celestial bodies darken as they face away from the sun and cast shadows.
        Like the planets, the starfield background is procedurally generated, and it includes real photographs of deep sky objects. 
        The star emulates the turbulence of stellar surfaces, with visible convection and the formation of starspots.
        It's better seen than described, so check out space mode, preferably on desktop, after reading this.
        \n\nA bit of a disclaimer, I used AI pretty extensively while developing space mode. I directed the visual design, controls, layout, procedural generation, and motion,
        but without any background in graphics or animation I pretty much vibe-coded those aspects.`,
        logo: PortfolioLogo,
        images: [
            {src: "/projects/portfolio/portfolio.jpg", alt: "The portfolio's space mode, with planets representing projects" },
            {src: "/projects/portfolio/portfolio-simple.jpg", alt: "The portfolio's simple mode, with project cards on a dark layout" },
            {src: "/projects/portfolio/portfolio-project-view.jpg", alt: "The portfolio's project information, with the space view visible in the background" },
            {src: "/projects/portfolio/portfolio-transit.jpg", alt: "A planet and its moons transiting the sun" },
            {src: "/projects/portfolio/portfolio-eclipse.jpg", alt: "A moon eclipsing its planet with a visible shadow on the surface" },
            {src: "/projects/portfolio/portfolio-custom-star.jpg", alt: "A customized star with a starspot visible on its surface" },
            {src: "/projects/portfolio/portfolio-mobile.jpg", alt: "The mobile version of the portfolio's space mode" },
            {src: "/projects/portfolio/portfolio-orbiters.jpg", alt: "A gas giant with a ring system orbited by multiple moons" },
        ],
        stack: [
            { category: "frontend", technologies: [tech.react, tech.typescript, tech.css, tech.vite, tech.webgl] },
            { category: "deployment", technologies: [tech.cloudflare] },
        ]
    },
    {
        name: "Word Wasp",
        featuredTechnologies: [tech.react, tech.typescript, tech.css],
        subdomain: "word-wasp",
        repositories: [{ label: "GitHub", url: "https://github.com/ammar-az/word-wasp" }],
        liveUrl: "https://word-wasp.ammarz.com",
        summary: "A word puzzle game inspired by NYT Spelling Bee.",
        description: `Word Wasp is a word puzzle inspired by Spelling Bee. Each Word Wasp puzzle provides 7 letters, with one designated center letter. 
        Players find as many words as possible using those letters, with the constraints that words must be 4+ letters long and contain the center letter.
        Wordle clones seem to be some of the most popular first projects, so I wanted to do something slightly different. 
        The focus of this project was to properly recreate the game logic, scoring rules, and most importantly the UI's iconic honeycomb grid with hexagonal letter tiles.
        Instead of a single daily puzzle, Word Wasp lets players puzzles whenever they want and choose between an easy or hard word list.`,
        logo: Wasp,
        logoBackground: "light",
        images: [{ src: "/projects/word-wasp/word-wasp.jpg", alt: "Word Wasp puzzle with letter tiles, guessed words, and score" }, { src: "/projects/word-wasp/word-wasp-light.jpg", alt: "Word Wasp puzzle with a white background" }],
        stack: [
            { category: "frontend", technologies: [tech.react, tech.typescript, tech.css] },
        ]
    },
    {
        name: "Future Project",
        logoBackground: "dark",
        featuredTechnologies: [tech.angular],
        subdomain: "potential",
        summary: "A project yet to come.",
        description: "No matter how you slice it, there's a hint here...",
        logo: FutureProject,
        images: [],
        stack: [{ category: "frontend", technologies: [tech.angular] }]
    },
    {
        name: "Future Project",
        logoBackground: "dark",
        featuredTechnologies: [tech.cpp],
        subdomain: "potential-cpp",
        summary: "A project yet to come.",
        description: "Something a little different...",
        logo: FutureProject,
        images: [],
        stack: [{ category: "backend", technologies: [tech.cpp] }]
    },


];
