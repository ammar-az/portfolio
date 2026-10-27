import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import useModalDialog from "../../hooks/useModalDialog";
import "../../styles/space-help.css";

type Step = { title: string; text: string; target: string };

export default function SpaceGuidance({ request, introDismissed, onDismiss }: {
    request: number; introDismissed: boolean; onDismiss: () => void;
}) {
    const [closedRequest, setClosedRequest] = useState(request);
    return request !== closedRequest
        ? <SpaceHelp onDismiss={() => { setClosedRequest(request); onDismiss(); }} />
        : !introDismissed && <SpaceIntro onDismiss={onDismiss} />;
}

function SpaceIntro({ onDismiss }: { onDismiss: () => void }) {
    const arrowId = useId();
    const [position, setPosition] = useState({ helpX: 0, helpBottom: 0, helpLeft: 16, helpWidth: 145, projectsLeft: 0, projectsWidth: 220, top: 100, arrowX: 8, arrowY: 100, mobile: false });
    const [touchPointer] = useState(() => matchMedia("(pointer: coarse)").matches);
    useEffect(() => {
        // Dismiss without consuming the interaction: the first tap can open a project or Help.
        let active = true;
        const interact = (event: Event) => {
            if (event.target instanceof Element && event.target.closest("button, a[href], [data-space-body]")) onDismiss();
        };
        const key = (event: KeyboardEvent) => {
            // Check after scene handlers run, including when their registration order changes on resize.
            window.setTimeout(() => { if (active && event.defaultPrevented) onDismiss(); }, 0);
        };
        document.addEventListener("pointerdown", interact, true);
        document.addEventListener("click", interact, true);
        document.addEventListener("keydown", key, true);
        return () => {
            active = false;
            document.removeEventListener("pointerdown", interact, true);
            document.removeEventListener("click", interact, true);
            document.removeEventListener("keydown", key, true);
        };
    }, [onDismiss]);
    useLayoutEffect(() => {
        const header = document.querySelector(".header-identity");
        const controls = document.querySelector(".space-controls");
        const update = () => {
            const r = document.querySelector(".header-help")?.getBoundingClientRect();
            const row = controls?.getBoundingClientRect();
            if (!r || !row) return;
            const helpX = r.left + r.width / 2;
            const helpBottom = r.top + r.height / 2 + 15;
            const mobile = innerWidth < 960;
            const starfield = document.querySelector(".space-starfield-reroll")?.getBoundingClientRect();
            const palette = document.querySelector(".space-palette-button")?.getBoundingClientRect();
            const reset = document.querySelector(".space-orbit-reset")?.getBoundingClientRect();
            let top = row.top + row.height / 2;
            let helpLeft = helpX + 35, helpWidth = 145;
            let projectsLeft = innerWidth / 2, projectsWidth = 240;
            let arrowX = helpLeft - 8, arrowY = top;
            if (mobile && starfield && palette && reset) {
                const leftGap = starfield.left - palette.right, rightGap = reset.left - starfield.right;
                helpLeft = (palette.right + starfield.left) / 2;
                projectsLeft = (starfield.right + reset.left) / 2;
                helpWidth = Math.min(145, leftGap - 8);
                projectsWidth = Math.min(180, rightGap - 8);
                if (Math.min(leftGap, rightGap) < 48) {
                    // Extremely narrow phones cannot fit readable copy inside the 26px gaps.
                    top = row.bottom + 32;
                    helpLeft = helpX - 50;
                    helpWidth = projectsWidth = 66;
                }
                arrowX = helpLeft;
                arrowY = Math.min(top - 18, row.top - 4);
                if (top > row.bottom) arrowY = top - 18;
            }
            const next = { helpX, helpBottom, helpLeft, helpWidth, projectsLeft, projectsWidth, top, arrowX, arrowY, mobile };
            setPosition(previous => Object.keys(next).every(key => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next);
        };
        update();
        const observer = new ResizeObserver(update);
        if (header) observer.observe(header);
        if (controls) observer.observe(controls);
        window.addEventListener("resize", update);
        return () => { observer.disconnect(); window.removeEventListener("resize", update); };
    }, []);
    return <div className="space-intro" role="status" data-mobile={position.mobile || undefined}>
        <button type="button" className="space-intro-projects" onClick={onDismiss} style={{ left: position.projectsLeft, top: position.top, width: position.projectsWidth }}>{touchPointer || position.mobile ? "Tap" : "Click"} a project to learn more</button>
        <button type="button" className="space-intro-help" onClick={onDismiss} style={{ left: position.helpLeft, top: position.top, width: position.helpWidth }}>Detailed controls</button>
        <svg className="space-intro-arrow" aria-hidden="true">
            <defs><marker id={arrowId} markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="m1 1 6 3.5-6 3.5" /></marker></defs>
            <line x1={position.arrowX} y1={position.arrowY} x2={position.helpX} y2={position.helpBottom + 5} markerEnd={`url(#${arrowId})`} />
        </svg>
    </div>;
}

function findTarget(selector: string): Element | null {
    const targets = Array.from(document.querySelectorAll(selector));
    return targets.find(element => {
        const r = element.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight;
    }) ?? targets[0] ?? null;
}

function SpaceHelp({ onDismiss }: { onDismiss: () => void }) {
    const { dialogRef, open, close, restore } = useModalDialog();
    const panelRef = useRef<HTMLDivElement>(null);
    const titleId = useId();
    const [desktop, setDesktop] = useState(() => matchMedia("(min-width: 60rem)").matches);
    const [index, setIndex] = useState(0);
    const [placement, setPlacement] = useState({ left: 16, top: 80, x: 0, y: 0, width: 0, height: 0, below: true, pointerLeft: 20 });
    const steps = useMemo<Step[]>(() => [
        { title: "Explore the projects", text: `${desktop ? "Click" : "Tap"} a planet or the sun to read about a project. You can also use the arrow keys to select one and Enter to open it. Project X has no details yet.`,
            target: ".space-body-button:not([data-space-body='portfolio']) .space-body-sphere, .space-body-star .space-body-logo" },
        { title: "Choose your view", text: desktop ? "Switch between the project list in Simple Mode and this interactive Space Mode. Your scene settings stay with you."
            : "Open this menu to switch between Simple and Space Mode, or find the About and contact links.", target: desktop ? ".header-nav .mode-selector" : ".mobile-menu-toggle" },
        { title: "Pause the scene", text: "Pause or resume the scene's motion. You can still select projects while it is paused. Motion stays off when your device requests reduced motion.",
            target: desktop ? ".header-nav .scene-motion" : ".header-mobile-motion .scene-motion" },
        { title: "Orbital speed", text: "Cycle through 1×, 2× and 4× orbital speed. This changes how quickly planets travel, without speeding up their surfaces or the sun. Each visit starts at 1×.",
            target: desktop ? ".header-nav .scene-speed" : ".header-mobile-motion .scene-speed" },
        { title: "Solar performance", text: "Freeze the sun's animated surface to reduce CPU use. Other scene motion can continue. This control is unavailable while scene motion is paused or reduced motion is enabled.", target: ".space-performance" },
        { title: "Star color", text: "Choose a color for the sun. The palette changes its surface and glow without changing the planets.", target: ".space-palette-button" },
        { title: "Reset the orbits", text: "Return the planets to their starting positions. Their appearance and your other settings stay the same.", target: ".space-orbit-reset" },
        { title: "New planetary surfaces", text: "Generate new planet textures and, on desktop, new moon and ring systems. The planet colors and project identities stay familiar.", target: ".space-reroll" },
        ...(desktop ? [{ title: "Moons and rings", text: "Show or hide planetary moons and rings together. These orbiters are only shown on desktop.", target: ".space-orbiters" }] : []),
        { title: "A new starfield", text: "Reroll the background stars, clusters and deep-sky objects. Your planets and star color stay the same.", target: ".space-starfield-reroll" },
        { title: "Background images", text: "See the objects in this scene, their photo credits and the full image collection. Enjoy exploring!", target: ".space-image-credits" },
    ], [desktop]);
    const currentIndex = Math.min(index, steps.length - 1);
    const step = steps[currentIndex];
    const last = currentIndex === steps.length - 1;

    useLayoutEffect(() => { open(); return close; }, [open, close]);
    useEffect(() => {
        const media = matchMedia("(min-width: 60rem)");
        const update = () => setDesktop(media.matches);
        media.addEventListener("change", update);
        return () => media.removeEventListener("change", update);
    }, []);

    useLayoutEffect(() => {
        const panel = panelRef.current;
        if (!panel) return;
        const update = () => {
            const target = findTarget(step.target);
            const r = target?.getBoundingClientRect();
            const margin = 16, gap = 14;
            const x = Math.max(4, (r?.left ?? innerWidth / 2) - 5);
            const y = Math.max(4, (r?.top ?? 60) - 5);
            const right = Math.min(innerWidth - 4, (r?.right ?? innerWidth / 2) + 5);
            const bottom = Math.min(innerHeight - 4, (r?.bottom ?? 60) + 5);
            const width = Math.max(0, right - x), height = Math.max(0, bottom - y);
            const panelWidth = panel.offsetWidth, panelHeight = panel.offsetHeight;
            const below = bottom + gap + panelHeight <= innerHeight - margin;
            const top = Math.max(margin, Math.min(innerHeight - panelHeight - margin, below ? bottom + gap : y - gap - panelHeight));
            const left = Math.max(margin, Math.min(innerWidth - panelWidth - margin, x + width / 2 - panelWidth / 2));
            const pointerLeft = Math.max(20, Math.min(width / 2 + x - left, panelWidth - 20));
            const next = { left, top, x, y, width, height, below, pointerLeft };
            setPlacement(previous => Object.keys(next).every(key => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next);
        };
        update();
        const observer = new ResizeObserver(update);
        observer.observe(panel);
        for (const element of [findTarget(step.target), document.querySelector(".header-identity"), document.querySelector(".space-scene")]) {
            if (element) observer.observe(element);
        }
        window.addEventListener("resize", update);
        document.addEventListener("scroll", update, true);
        return () => { observer.disconnect(); window.removeEventListener("resize", update); document.removeEventListener("scroll", update, true); };
    }, [step]);

    return <dialog ref={dialogRef} className="space-help-dialog" aria-labelledby={titleId} aria-describedby={`${titleId}-text`}
        onClose={restore} onCancel={event => { event.preventDefault(); onDismiss(); }}>
        <div className="space-help-spotlight" aria-hidden="true" style={{ left: placement.x, top: placement.y, width: placement.width, height: placement.height }} />
        <div ref={panelRef} className="space-help-panel" style={{ left: placement.left, top: placement.top }}>
            <span className={`space-help-pointer${placement.below ? "" : " space-help-pointer-bottom"}`} aria-hidden="true"
                style={{ left: placement.pointerLeft }} />
            <p className="space-help-progress">SCENE CONTROLS <span>{currentIndex + 1} / {steps.length}</span></p>
            <div aria-live="polite" aria-atomic="true">
                <h2 id={titleId}>{step.title}</h2>
                <p id={`${titleId}-text`}>{step.text}</p>
            </div>
            <div className="space-help-actions">
                <button type="button" className="space-help-skip" onClick={onDismiss}>Skip</button>
                <button type="button" className="button" disabled={currentIndex === 0} onClick={() => setIndex(currentIndex - 1)}>Back</button>
                <button type="button" className="button button-primary" autoFocus onClick={() => last ? onDismiss() : setIndex(currentIndex + 1)}>{last ? "Done" : "Next"}</button>
            </div>
        </div>
    </dialog>;
}
