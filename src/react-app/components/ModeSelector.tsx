import { useCallback, useLayoutEffect, useRef } from "react";
import type { CSSProperties } from "react";
import planetIconUrl from "../assets/icons/planet.svg?url&no-inline";

export default function ModeSelector({ simple, onChange }: { simple: boolean; onChange: (simple: boolean) => void }) {
    const ref = useRef<HTMLDivElement>(null);
    const measure = useCallback(() => {
        const root = ref.current;
        const button = root?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
        if (!root || !button?.offsetWidth) return;
        root.style.setProperty("--mode-left", `${button.offsetLeft}px`);
        root.style.setProperty("--mode-width", `${button.offsetWidth}px`);
    }, []);
    useLayoutEffect(measure, [simple, measure]);
    useLayoutEffect(() => {
        const root = ref.current;
        if (!root) return;
        const observer = new ResizeObserver(measure);
        observer.observe(root);
        root.querySelectorAll("button").forEach(button => observer.observe(button));
        return () => observer.disconnect();
    }, [measure]);
    return <div ref={ref} className="mode-selector" role="group" aria-label="Portfolio layout">
        <span className="mode-selector-highlight" aria-hidden="true" />
        <button type="button" aria-pressed={simple} onClick={() => onChange(true)}>Simple</button>
        <button type="button" aria-pressed={!simple} onClick={() => onChange(false)}>Space
            <span className="mode-icon" style={{ "--mode-icon-source": `url("${planetIconUrl}")` } as CSSProperties} aria-hidden="true" />
        </button>
    </div>;
}
