import type { SVGProps } from "react";
import shadedLogoUrl from "../assets/logos/az-shaded.svg?url";

export default function PortfolioLogo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 262 262" width="262" height="262" focusable="false" {...props}>
            <image href={shadedLogoUrl} width="262" height="262" />
        </svg>
    );
}
