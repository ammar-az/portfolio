import type { Technology } from "../types/project";

import AxiosLogo from "../assets/technologies/axios.svg?react";
import AzureLogo from "../assets/technologies/azure.svg?react";
import AzureSqlLogo from "../assets/technologies/azuresql.svg?react";
import CloudflareLogo from "../assets/technologies/cloudflare.svg?react";
import CloudflareWorkersLogo from "../assets/technologies/cloudflareworkers.svg?react";
import HonoLogo from "../assets/technologies/hono.svg?react";
import TailwindCssLogo from "../assets/technologies/tailwindcss.svg?react";
import CSharpLogo from "../assets/technologies/csharp.svg?react";
import CssLogo from "../assets/technologies/css3.svg?react";
import DockerLogo from "../assets/technologies/docker.svg?react";
import DotnetLogo from "../assets/technologies/dotnetcore.svg?react";
import EfCoreLogo from "../assets/technologies/efcore.svg?react";
import JwtLogo from "../assets/technologies/jwt.svg?react";
import SqlServerLogo from "../assets/technologies/microsoftsqlserver.svg?react";
import ReactLogo from "../assets/technologies/react.svg?react";
import ReactRouterLogo from "../assets/technologies/react-router.svg?react";
import TypeScriptLogo from "../assets/technologies/typescript.svg?react";
import ViteLogo from "../assets/technologies/vite.svg?react";

export const technologies = {
    axios: {
        name: "Axios",
        logo: AxiosLogo,
    },
    azure: {
        name: "Azure App Service",
        logo: AzureLogo,
    },
    azuresql: {
        name: "Azure SQL Database",
        logo: AzureSqlLogo,
    },
    cloudflare: {
        name: "Cloudflare",
        logo: CloudflareLogo,
    },
    cloudflareworkers: {
        name: "Cloudflare Workers",
        logo: CloudflareWorkersLogo,
    },
    hono: {
        name: "Hono",
        logo: HonoLogo,
    },
    tailwindcss: {
        name: "Tailwind CSS",
        logo: TailwindCssLogo,
    },
    csharp: {
        name: "C#",
        logo: CSharpLogo,
    },
    css: {
        name: "CSS",
        logo: CssLogo,
    },
    docker: {
        name: "Docker",
        logo: DockerLogo,
    },
    aspnet: {
        name: "ASP.NET Core",
        logo: DotnetLogo,
    },
    efcore: {
        name: "EF Core",
        logo: EfCoreLogo,
    },
    jwt: {
        name: "JWT",
        logo: JwtLogo,
    },
    sqlserver: {
        name: "SQL Server",
        logo: SqlServerLogo,
    },
    react: {
        name: "React",
        logo: ReactLogo,
    },
    reactrouter: {
        name: "React Router",
        logo: ReactRouterLogo,
    },
    typescript: {
        name: "TypeScript",
        logo: TypeScriptLogo,
    },
    vite: {
        name: "Vite",
        logo: ViteLogo,
    },
} satisfies Record<string, Technology>;
