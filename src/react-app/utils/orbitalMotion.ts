import { getOrbitPoint } from "./spaceGeometry";
import type { Orbit, Point } from "./spaceGeometry";
import { seededRandom } from "./seededRandom";

type Segment = { start: number; end: number; span: number; offset: number };
export type OrbitalBody = {
    id: string; element: HTMLElement; orbit: Orbit; initialPosition: Point; phase: number;
    degreesPerSecond: number;
};
export type OrbitalScene = {
    width: number; height: number; headerBottom: number; focusTop: number;
    center: Point; starWidth: number; starHeight: number; bodies: OrbitalBody[];
    compact: boolean; system: HTMLElement; viewport: HTMLElement;
};
type Track = OrbitalBody & {
    segments: Segment[]; span: number; progress: number; startProgress: number; period: number;
    x: number; y: number; angle: number; lightRotation: number;
    back: boolean; reachable: boolean; needsStart: boolean;
    halfWidth: number; halfHeight: number;
    speedBounds: { left: number; right: number; top: number; bottom: number };
    speedMultiplier: number;
    geometryKey: string;
};
const wrap = (value: number, size: number) => (value % size + size) % size;
const clippedSpeedMultiplier = 4;

function positionAt(track: Track) {
    const distance = track.progress * track.span;
    const segment = track.segments.find(s => distance < s.offset + s.span) ?? track.segments[track.segments.length - 1];
    const angle = segment.start + distance - segment.offset;
    return { angle, point: getOrbitPoint(track.orbit, angle) };
}

/** Pure visibility/ellipse sampling. Hidden stretches consume no orbital time. */
export function visibleOrbit(orbit: Orbit, visible: (point: Point, angle: number) => boolean) {
    const segments: Segment[] = [];
    const step = 0.5;
    let start: number | null = null;
    let span = 0;
    for (let angle = 0; angle <= 360; angle += step) {
        const show = visible(getOrbitPoint(orbit, angle), angle);
        // Both endpoints lie just outside visibility, so skips cannot cut off a visible sliver.
        if (show && start === null) start = Math.max(0, angle - step);
        if ((!show || angle === 360) && start !== null) {
            const end = angle;
            if (end > start) {
                segments.push({ start, end, span: end - start, offset: span });
                span += end - start;
            }
            start = null;
        }
    }
    // The 0/360 seam is continuous when both sides are visible.
    if (segments.length > 1 && segments[0].start === 0 && segments[segments.length - 1].end === 360) {
        const first = segments.shift()!, last = segments.pop()!;
        segments.push({ start: last.start, end: first.end + 360, span: last.span + first.span, offset: 0 });
        let offset = 0;
        for (const segment of segments) { segment.offset = offset; offset += segment.span; }
    }
    return { segments, span };
}

function progressAt(track: Pick<Track, "segments" | "span">, angle: number) {
    if (!track.span) return 0;
    const a = wrap(angle, 360);
    let closest = 0, distance = Infinity;
    for (const segment of track.segments) {
        for (const unwrapped of [a - 360, a, a + 360]) {
            const clamped = Math.max(segment.start, Math.min(segment.end, unwrapped));
            const d = Math.abs(unwrapped - clamped);
            if (d < distance) {
                distance = d;
                closest = (segment.offset + clamped - segment.start) / track.span;
            }
        }
    }
    return wrap(closest, 1);
}

/** DOM adapter driven exclusively by PlanetRenderer's clock; geometry can be supplied by either layout. */
export class OrbitalMotion {
    private scene: OrbitalScene | null = null;
    private tracks = new Map<string, Track>();
    private angles = new Map<string, number>();
    private scale = { x: 1, y: 1 };
    private origin = { x: 0, y: 0 };
    private viewportBounds = { left: 0, right: 0, top: 0, bottom: 0 };
    private hovered: string | null = null;
    private focused: string | null = null;
    private pressed: string | null = null;
    private pointerType = "";
    private root: HTMLElement | null = null;

    constructor(private invalidate: () => void) {}

    private phaseKey(id: string) { return `${this.scene?.compact ? "mobile" : "desktop"}:${id}`; }

    configure(scene: OrbitalScene, root: HTMLElement) {
        this.detach();
        this.scene = scene;
        this.root = root;
        for (const body of scene.bodies) {
            const random = seededRandom(`${body.id}:orbit-period`);
            this.tracks.set(body.id, { ...body, segments: [], span: 0, progress: 0, startProgress: 0,
                // A full-orbit rate keeps the approved local pace as the visible arc gets longer.
                period: 360 / (body.degreesPerSecond * (0.95 + random() * 0.1)),
                x: 0, y: 0, angle: this.angles.get(this.phaseKey(body.id)) ?? body.phase, lightRotation: 0,
                back: false, reachable: true, needsStart: !this.angles.has(this.phaseKey(body.id)),
                halfWidth: 0, halfHeight: 0,
                speedBounds: { left: 0, right: 0, top: 0, bottom: 0 }, speedMultiplier: 1, geometryKey: "" });
        }
        root.addEventListener("pointerover", this.pointerOver);
        root.addEventListener("pointerout", this.pointerOut);
        root.addEventListener("pointerdown", this.pointerDown);
        root.addEventListener("pointerup", this.pointerEnd);
        root.addEventListener("pointercancel", this.pointerEnd);
        root.addEventListener("focusin", this.focusIn);
        root.addEventListener("focusout", this.focusOut);
        this.focused = this.focusId(document.activeElement);
        this.hovered = this.pointerType === "touch" ? null : this.bodyId(root.querySelector("[data-orbit-id]:hover [data-space-body]"));
    }

    detach() {
        this.root?.removeEventListener("pointerover", this.pointerOver);
        this.root?.removeEventListener("pointerout", this.pointerOut);
        this.root?.removeEventListener("pointerdown", this.pointerDown);
        this.root?.removeEventListener("pointerup", this.pointerEnd);
        this.root?.removeEventListener("pointercancel", this.pointerEnd);
        this.root?.removeEventListener("focusin", this.focusIn);
        this.root?.removeEventListener("focusout", this.focusOut);
        for (const track of this.tracks.values()) {
            track.element.style.removeProperty("translate");
            track.element.style.removeProperty("--orbit-light-rotation");
            delete track.element.dataset.orbitBack;
        }
        this.tracks.clear();
        this.scene = null; this.root = null; this.hovered = null; this.focused = null; this.pressed = null;
    }

    private bodyId(target: EventTarget | null) {
        const id = target instanceof Element
            ? target.closest("[data-space-body]")?.closest<HTMLElement>("[data-orbit-id]")?.dataset.orbitId
            : undefined;
        return id && this.tracks.has(id) ? id : null;
    }
    private pointerOver = (event: PointerEvent) => { if (event.pointerType !== "touch") this.hovered = this.bodyId(event.target); };
    private pointerOut = (event: PointerEvent) => { if (event.pointerType !== "touch") this.hovered = this.bodyId(event.relatedTarget); };
    private pointerDown = (event: PointerEvent) => {
        this.pointerType = event.pointerType;
        if (event.pointerType === "touch") {
            this.pressed = this.bodyId(event.target);
            if (this.scene?.compact) this.focused = null;
        }
    };
    private pointerEnd = (event: PointerEvent) => { if (event.pointerType === "touch") this.pressed = null; };
    private focusId(target: EventTarget | null) {
        // Touch holds last until release; retained browser focus must not pin a planet after scrolling/closing details.
        if (this.scene?.compact && this.pointerType === "touch" && target instanceof Element && !target.matches(":focus-visible")) return null;
        return this.bodyId(target);
    }
    private focusIn = (event: FocusEvent) => {
        this.focused = this.focusId(event.target);
        const track = this.focused ? this.tracks.get(this.focused) : undefined;
        if (track && !track.reachable) this.reset(track.id);
    };
    private focusOut = (event: FocusEvent) => { this.focused = this.focusId(event.relatedTarget); };

    measure(bounds: DOMRect) {
        const scene = this.scene;
        if (!scene) return;
        const system = scene.system.getBoundingClientRect(), viewport = scene.viewport.getBoundingClientRect();
        this.scale = { x: system.width / scene.width, y: system.height / scene.height };
        this.origin = { x: system.left - bounds.left, y: system.top - bounds.top };
        this.viewportBounds = {
            left: Math.max(0, viewport.left - bounds.left), right: Math.min(bounds.width, viewport.right - bounds.left),
            top: Math.max(scene.headerBottom, viewport.top - bounds.top), bottom: Math.min(bounds.height, viewport.bottom - bounds.top),
        };
        for (const track of this.tracks.values()) {
            const radius = track.element.getBoundingClientRect().width / 2;
            const content = track.element.querySelector<HTMLElement>("[data-space-body]")!.getBoundingClientRect();
            track.halfWidth = content.width / 2;
            track.halfHeight = content.height / 2;
            const centerX = system.left + track.initialPosition.x * this.scale.x + track.x;
            const centerY = system.top + track.initialPosition.y * this.scale.y + track.y;
            const visibleParts = Array.from(track.element.querySelectorAll<HTMLElement>(".space-body-sphere, .space-body-logo, .space-body-label"))
                .filter(part => !part.classList.contains("space-body-logo") || part.querySelector("svg"))
                .map(part => part.getBoundingClientRect());
            track.speedBounds = {
                left: Math.min(...visibleParts.map(part => part.left - centerX)),
                right: Math.max(...visibleParts.map(part => part.right - centerX)),
                top: Math.min(...visibleParts.map(part => part.top - centerY)),
                bottom: Math.max(...visibleParts.map(part => part.bottom - centerY)),
            };
            // Skip only after the entire project (including its glow/identity) clears the screen.
            // The header and control band do not shorten the actual orbital path.
            const marginX = Math.max(radius + 28, track.halfWidth) + 8;
            const marginY = Math.max(radius + 28, track.halfHeight) + 8;
            const geometryKey = `${system.width}:${system.height}:${marginX}:${marginY}`;
            // Scrolling moves the viewport over the system; it must not rebuild or skip orbital arcs.
            if (geometryKey === track.geometryKey) continue;
            track.geometryKey = geometryKey;
            const path = visibleOrbit(track.orbit, point => {
                const x = point.x * this.scale.x, y = point.y * this.scale.y;
                return x + marginX >= 0 && x - marginX <= system.width
                    && y + marginY >= 0 && y - marginY <= system.height;
            });
            track.segments = path.segments; track.span = path.span;
            track.startProgress = progressAt(track, track.phase);
            track.progress = track.needsStart ? track.startProgress : progressAt(track, track.angle);
            track.needsStart = false;
        }
    }

    reset(id?: string) {
        for (const track of this.tracks.values()) {
            if (id && track.id !== id) continue;
            track.angle = track.phase;
            track.progress = track.startProgress;
            track.needsStart = !track.span;
            this.angles.set(this.phaseKey(track.id), track.phase);
        }
        this.update(0);
        this.invalidate();
    }

    update(deltaMs: number) {
        const scene = this.scene;
        if (!scene) return;
        for (const track of this.tracks.values()) {
            if (!track.span) continue;
            let position = positionAt(track);
            const bounds = track.speedBounds;
            const currentX = this.origin.x + position.point.x * this.scale.x, currentY = this.origin.y + position.point.y * this.scale.y;
            const viewport = this.viewportBounds;
            const clipped = currentX + bounds.left < viewport.left || currentX + bounds.right > viewport.right
                || currentY + bounds.top < viewport.top || currentY + bounds.bottom > viewport.bottom;
            track.speedMultiplier = clipped ? clippedSpeedMultiplier : 1;
            if (!this.held(track.id) && deltaMs > 0) {
                track.progress = wrap(track.progress + deltaMs * track.speedMultiplier / (track.period * 1000) * 360 / track.span, 1);
                position = positionAt(track);
            }
            const { angle, point } = position;
            track.angle = wrap(angle, 360);
            this.angles.set(this.phaseKey(track.id), track.angle);
            track.x = (point.x - track.initialPosition.x) * this.scale.x;
            track.y = (point.y - track.initialPosition.y) * this.scale.y;
            track.lightRotation = Math.atan2((scene.center.y - point.y) * this.scale.y,
                (scene.center.x - point.x) * this.scale.x) * 180 / Math.PI + 180;
            track.back = Math.sin(angle * Math.PI / 180) < 0;
            const x = point.x * this.scale.x, y = point.y * this.scale.y;
            const solarDistance = Math.hypot((point.x - scene.center.x) * this.scale.x / (scene.starWidth / 2),
                (point.y - scene.center.y) * this.scale.y / (scene.starHeight / 2));
            track.reachable = (!track.back || solarDistance >= 1.3)
                && x - track.halfWidth > 0 && x + track.halfWidth < scene.width * this.scale.x
                && y - track.halfHeight > scene.focusTop && y + track.halfHeight < scene.height * this.scale.y;
            track.element.dataset.orbitBack = `${track.back}`;
            track.element.style.translate = `${track.x}px ${track.y}px`;
            track.element.style.setProperty("--orbit-light-rotation", `${track.lightRotation}deg`);
        }
    }

    private held(id: string) { return id === this.hovered || id === this.focused || id === this.pressed; }

    hasMotion() {
        for (const track of this.tracks.values()) if (track.span && !this.held(track.id)) return true;
        return false;
    }

    get(id: string | undefined) { return id ? this.tracks.get(id) : undefined; }
}
