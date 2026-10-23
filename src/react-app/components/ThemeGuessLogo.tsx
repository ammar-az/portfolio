import type { SVGProps } from "react";
import logoUrl from "../assets/logos/lol-theme-guess.svg?url";

export default function ThemeGuessLogo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg viewBox="0 0 128 128" width="128" height="128" focusable="false" {...props}>
            <image href={logoUrl} width="128" height="128" />
        </svg>
    );
}
