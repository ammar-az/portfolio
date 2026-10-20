import type { ComponentType, SVGProps } from "react";

export type Project = {
    id: number;
    name: string;
    subdomain: string;
    summary: string;
    description: string;
    logo: ComponentType<SVGProps<SVGSVGElement>>;
    // git url?
    // technologies or stack?
}
