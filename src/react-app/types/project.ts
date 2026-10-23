import type { ComponentType, SVGProps } from "react";

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type Technology = {
    name: string;
    logo: SvgIcon;
};

type ProjectImage = {
    src: string;
    alt: string;
};

export type StackCategory =
    | "frontend"
    | "backend"
    | "data"
    | "deployment";

type StackGroup = {
    category: StackCategory;
    technologies: Technology[];
};

export const stackLabels: Record<StackCategory, string> = {
    frontend: "Frontend",
    backend: "Backend",
    data: "Data",
    deployment: "Deployment",
};

export type Project = {
    name: string;
    subdomain: string;
    summary: string;
    description: string;
    logo: SvgIcon;
    repositories?: { label: string; url: string }[];
    logoIsPlaceholder?: boolean;
    featuredTechnologies: Technology[];
    liveUrl?: string;
    images: ProjectImage[];
    stack: StackGroup[];
};

