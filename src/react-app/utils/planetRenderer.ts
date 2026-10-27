import { generatePlanetMap } from "./planetMaps";
import type { PlanetMap } from "./planetMaps";
import { getPlanetRotation } from "./planetRotation";
import type { PlanetTextureOptions } from "./planetTextures";
import { getPlanetLighting, getPlanetPhaseLighting } from "./planetLighting";
import type { StarPalette } from "../data/starAppearance";
import { generateSolarMaps } from "./solarMaps";
import { getSolarActivity } from "./solarActivity";
import { solarCycleSeconds, solarFragment } from "./solarShader";
import { OrbitalMotion } from "./orbitalMotion";
import { createWebGLProgram } from "./webglProgram";
import { twinkleVertex, twinkleFragment } from "./twinkleShader";
import type { TwinkleStar } from "./starfield";
import { giantStormFragment, getGiantStormActivity, getGiantStormPalette } from "./giantStorms";
import type { GiantStormProfile } from "./giantStorms";
import { getPlanetShadowCasters, maxPlanetShadowCasters } from "./planetShadows";
import type { ShadowSphere, ShadowSun } from "./planetShadows";
import { planetShadowFragment } from "./planetShadowShader";
import { hasFiniteSize } from "./spaceGeometry";

const vertexSource = `
attribute vec2 a_point;
uniform vec2 u_resolution;
uniform vec4 u_rect;
varying vec2 v_point;
varying vec2 v_pixel;
void main() {
    v_point = a_point;
    vec2 pixel = u_rect.xy + a_point * u_rect.zw * 0.5;
    v_pixel = pixel;
    gl_Position = vec4(pixel / u_resolution * 2.0 - 1.0, 0.0, 1.0);
}`;

const fragmentSource = `
precision highp float;
varying vec2 v_point;
varying vec2 v_pixel;
uniform sampler2D u_map;
uniform float u_phase;
uniform vec3 u_light;
uniform float u_relief;
uniform float u_edge;
uniform float u_equalArea;
uniform float u_axisTilt;
uniform float u_fill;
uniform float u_terminatorStart;
uniform float u_behind;
uniform vec4 u_sunRect;
const float PI = 3.141592653589793;
${solarFragment}
${giantStormFragment}
${planetShadowFragment}
void main() {
    if (u_solar > 1.5) {
        gl_FragColor = texture2D(u_map, v_point * 0.5 + 0.5);
        return;
    }
    float radius = length(v_point);
    if (radius >= 1.0) discard;
    vec3 normal = vec3(v_point, sqrt(max(0.0, 1.0 - dot(v_point, v_point))));
    if (u_solar > 0.5) {
        float alpha = 1.0 - smoothstep(1.0 - u_edge, 1.0, radius);
        gl_FragColor = vec4(solarSurface(normal) * alpha, alpha);
        return;
    }
    vec3 sphereNormal = normal;
    // Giant artwork uses an equal-area cylindrical map to retain the original belt/storm proportions.
    float c = cos(u_axisTilt), s = sin(u_axisTilt);
    vec3 materialNormal = vec3(c * normal.x - s * normal.y, s * normal.x + c * normal.y, normal.z);
    float v = u_equalArea > 0.5 ? 0.5 - materialNormal.y * 0.5 : asin(normal.y) / PI + 0.5;
    vec2 uv = vec2(atan(materialNormal.x, materialNormal.z) / (2.0 * PI) + 0.5 + u_phase / (2.0 * PI), v);
    vec3 albedo = giantWeather(texture2D(u_map, giantFlow(uv)).rgb, uv);
    if (u_relief > 0.0) {
        float dx = texture2D(u_map, uv + vec2(1.0 / 512.0, 0.0)).a - texture2D(u_map, uv - vec2(1.0 / 512.0, 0.0)).a;
        float dy = texture2D(u_map, uv + vec2(0.0, 1.0 / 256.0)).a - texture2D(u_map, uv - vec2(0.0, 1.0 / 256.0)).a;
        vec3 tangent = normalize(vec3(normal.z + 0.00001, 0.0, -normal.x));
        vec3 bitangent = cross(normal, tangent);
        float latitudeScale = max(0.2, length(normal.xz));
        normal = normalize(normal - u_relief * (tangent * dx * 512.0 / (4.0 * PI * latitudeScale) + bitangent * dy * 256.0 / (2.0 * PI)));
    }
    // Orbital light direction supplies phases; the extended solar disc softens the terminator.
    float diffuse = smoothstep(u_terminatorStart, 0.95, dot(normal, u_light));
    float sunlight = diffuse;
    if (diffuse > 0.0) sunlight *= planetShadowVisibility(sphereNormal);
    float light = u_fill + (1.0 - u_fill) * sunlight;
    float limb = mix(0.94, 1.0, smoothstep(0.0, 0.38, normal.z));
    float alpha = 1.0 - smoothstep(1.0 - u_edge, 1.0, radius);
    if (u_behind > 0.5 && u_sunRect.z > 0.0) {
        float solarDistance = length((v_pixel - u_sunRect.xy) / (u_sunRect.zw * 0.5));
        alpha *= smoothstep(0.99, 1.01, solarDistance);
    }
    gl_FragColor = vec4(albedo * light * limb * alpha, alpha);
}`;

type Entry = {
    element: HTMLElement;
    options: PlanetTextureOptions;
    rotation: ReturnType<typeof getPlanetRotation>;
    lighting: ReturnType<typeof getPlanetLighting>;
    texture?: WebGLTexture;
    rect?: DOMRect;
    baseRect?: DOMRect;
    orbitId?: string;
    light?: [number, number, number];
    loadToken?: object;
    map?: { equalArea?: boolean; axisTilt?: number; storms?: GiantStormProfile[] };
    stormPalette: ReturnType<typeof getGiantStormPalette>;
    failed?: boolean;
};
type SolarSnapshot = {
    texture: WebGLTexture; framebuffer: WebGLFramebuffer; key: string;
    left: number; bottom: number; width: number; height: number;
};
type SolarEntry = {
    element: HTMLElement;
    palette: StarPalette;
    seed: number;
    textures?: WebGLTexture[];
    rect?: DOMRect;
    identity?: DOMRect;
    loadToken?: object;
    failed?: boolean;
    snapshot?: SolarSnapshot;
    snapshotFailed?: string;
};
type Uniforms = Record<"resolution" | "rect" | "map" | "phase" | "light" | "relief" | "edge" | "equalArea" | "axisTilt" | "fill" | "terminatorStart" | "behind" | "sunRect" | "solar" | "solarPhase" | "sunspots" | "sunspotFrames" | "sites" | "solarPrimary" | "solarHighlight" | "solarShadow" | "solarLaneAccent" | "stormsEnabled" | "storms" | "stormMotion" | "stormPale" | "stormDark" | "shadowCount" | "shadowCasters" | "shadowFades" | "shadowSun" | "shadowRadius", WebGLUniformLocation | null>;
type TwinklePass = {
    program: WebGLProgram; buffer: WebGLBuffer; dirty: boolean;
    attributes: { location: number; size: number; offset: number }[];
    resolution: WebGLUniformLocation | null; pixelRatio: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null; occluders: WebGLUniformLocation | null;
};

/** One context and clock for all discs. DOM controls, labels, hit testing and fallback artwork stay intact. */
export class PlanetRenderer {
    readonly orbits = new OrbitalMotion(() => this.invalidate());
    private entries = new Set<Entry>();
    private solarEntries = new Set<SolarEntry>();
    private canvas: HTMLCanvasElement | null = null;
    private gl: WebGLRenderingContext | null = null;
    private program: WebGLProgram | null = null;
    private buffer: WebGLBuffer | null = null;
    private uniforms: Uniforms | null = null;
    private pointAttribute = 0;
    private twinkleStars: TwinkleStar[] = [];
    private twinklePass: TwinklePass | null = null;
    private twinkleFailed = false;
    private twinkleOccluders = new Float32Array(7 * 4);
    private resizeObserver: ResizeObserver | null = null;
    private frame = 0;
    private lastTime: number | null = null;
    private enabled = true;
    private blocked = false;
    private needsMeasure = true;
    private dirty = true;
    private bounds: DOMRect | null = null;
    private clip: DOMRect | null = null;
    private convectionEnabled = true;
    private solarTime = 0;
    private solarLastSceneTime = 0;
    private ready = false;
    private readyWaiters = new Set<() => void>();
    private shadowsEnabled = true;
    private shadowCasters = new Float32Array(maxPlanetShadowCasters * 4);
    private shadowFades = new Float32Array(maxPlanetShadowCasters);

    constructor(private clock: { current: number }) {}

    setShadowsEnabled(enabled: boolean) {
        this.shadowsEnabled = enabled;
        this.invalidate();
    }

    setStarfield(stars: TwinkleStar[]) {
        this.twinkleStars = stars;
        if (this.twinklePass) this.twinklePass.dirty = true;
        this.invalidate();
    }

    whenReady(signal: AbortSignal): Promise<void> {
        if (this.ready || signal.aborted) return Promise.resolve();
        return new Promise(resolve => {
            const done = () => { this.readyWaiters.delete(done); signal.removeEventListener("abort", done); resolve(); };
            this.readyWaiters.add(done);
            signal.addEventListener("abort", done, { once: true });
        });
    }

    private markReady() {
        this.ready = true;
        for (const done of [...this.readyWaiters]) done();
    }

    setConvectionEnabled(enabled: boolean) {
        if (this.convectionEnabled === enabled) return;
        this.convectionEnabled = enabled;
        this.solarLastSceneTime = this.clock.current;
        for (const entry of this.solarEntries) this.clearSnapshot(entry);
        this.invalidate();
    }

    private clearSnapshot(entry: SolarEntry) {
        if (entry.snapshot) {
            this.gl?.deleteTexture(entry.snapshot.texture);
            this.gl?.deleteFramebuffer(entry.snapshot.framebuffer);
        }
        entry.snapshot = undefined;
        entry.snapshotFailed = undefined;
    }

    registerSolar(element: HTMLElement, palette: StarPalette, seed: number) {
        const entry: SolarEntry = { element, palette, seed };
        this.solarEntries.add(entry);
        this.resizeObserver?.observe(element);
        this.invalidate();
        return () => {
            this.resizeObserver?.unobserve(element);
            this.clearSolar(entry);
            this.solarEntries.delete(entry);
            this.invalidate();
        };
    }

    private clearSolar(entry: SolarEntry) {
        this.clearSnapshot(entry);
        for (const texture of entry.textures ?? []) this.gl?.deleteTexture(texture);
        entry.textures = undefined;
        entry.loadToken = undefined;
        entry.failed = false;
        entry.element.removeAttribute("data-projected");
    }

    register(element: HTMLElement, options: PlanetTextureOptions, orbitRadius?: number) {
        const entry: Entry = { element, options, rotation: getPlanetRotation(options.seed, options), lighting: getPlanetLighting(orbitRadius),
            stormPalette: getGiantStormPalette(options),
            orbitId: element.closest<HTMLElement>("[data-orbit-id]")?.dataset.orbitId };
        this.entries.add(entry);
        this.resizeObserver?.observe(element);
        this.invalidate();
        return () => {
            this.resizeObserver?.unobserve(element);
            if (entry.texture) this.gl?.deleteTexture(entry.texture);
            element.removeAttribute("data-projected");
            this.entries.delete(entry);
            this.invalidate();
        };
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        this.syncMotion();
    }

    refreshLayout() {
        this.invalidate();
    }

    private syncMotion = () => {
        this.blocked = document.hidden || !!document.querySelector("dialog[open]") || !!this.canvas?.closest("[inert]");
        if (!this.enabled || this.blocked) {
            if (this.lastTime !== null) this.clock.current += performance.now() - this.lastTime;
            this.lastTime = null;
            cancelAnimationFrame(this.frame);
            this.frame = 0;
        }
        this.invalidate();
    };

    private invalidate = () => {
        this.needsMeasure = true;
        this.dirty = true;
        if (this.gl && !document.hidden && !this.frame) this.frame = requestAnimationFrame(this.render);
    };

    attach(canvas: HTMLCanvasElement, availability: (ready: boolean) => void) {
        this.canvas = canvas;
        this.ready = false;
        const initialize = () => {
            try {
                const gl = canvas.getContext("webgl", { alpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
                if (!gl) throw new Error("WebGL unavailable");
                this.gl = gl;
                const program = createWebGLProgram(gl, vertexSource, fragmentSource);
                this.program = program;
                gl.useProgram(program);
                this.buffer = gl.createBuffer();
                if (!this.buffer) throw new Error("Buffer allocation failed");
                gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
                const point = gl.getAttribLocation(program, "a_point");
                this.pointAttribute = point;
                gl.enableVertexAttribArray(point); gl.vertexAttribPointer(point, 2, gl.FLOAT, false, 0, 0);
                this.uniforms = Object.fromEntries(["resolution", "rect", "map", "phase", "light", "relief", "edge", "equalArea", "axisTilt", "fill", "terminatorStart", "behind", "sunRect", "solar", "solarPhase", "sunspots", "sunspotFrames", "sites", "solarPrimary", "solarHighlight", "solarShadow", "solarLaneAccent", "stormsEnabled", "storms", "stormMotion", "stormPale", "stormDark", "shadowCount", "shadowCasters", "shadowFades", "shadowSun", "shadowRadius"].map(name => [name, gl.getUniformLocation(program, ["sunspots", "sunspotFrames", "storms", "stormMotion", "shadowCasters", "shadowFades"].includes(name) ? `u_${name}[0]` : `u_${name}`)])) as Uniforms;
                this.twinkleFailed = false;
                gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
                gl.clearColor(0, 0, 0, 0);
                gl.uniform1i(this.uniforms.map, 0);
                gl.uniform1i(this.uniforms.sites, 1);
                canvas.dataset.renderer = "webgl";
                availability(true);
                this.syncMotion();
            } catch {
                this.release();
                this.orbits.reset();
                canvas.dataset.renderer = "fallback";
                availability(false);
                this.markReady();
            }
        };
        const lost = (event: Event) => {
            event.preventDefault();
            cancelAnimationFrame(this.frame); this.frame = 0;
            this.lastTime = null;
            this.gl = null; this.program = null; this.buffer = null; this.uniforms = null;
            this.twinklePass = null;
            for (const entry of this.entries) { entry.texture = undefined; entry.loadToken = undefined; entry.failed = false; entry.element.removeAttribute("data-projected"); }
            for (const entry of this.solarEntries) this.clearSolar(entry);
            this.orbits.reset();
            canvas.dataset.renderer = "fallback";
            availability(false);
            this.markReady();
        };
        canvas.addEventListener("webglcontextlost", lost);
        canvas.addEventListener("webglcontextrestored", initialize);
        this.resizeObserver = new ResizeObserver(this.invalidate);
        this.resizeObserver.observe(canvas);
        const system = canvas.closest(".space-scene")?.querySelector(".space-system");
        if (system) this.resizeObserver.observe(system);
        for (const entry of this.entries) this.resizeObserver.observe(entry.element);
        for (const entry of this.solarEntries) this.resizeObserver.observe(entry.element);
        const mutation = new MutationObserver(this.syncMotion);
        mutation.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["open", "inert"] });
        document.addEventListener("visibilitychange", this.syncMotion);
        document.addEventListener("scroll", this.invalidate, { capture: true, passive: true });
        window.addEventListener("resize", this.invalidate);
        let resolution: MediaQueryList;
        const resolutionChanged = () => { watchResolution(); this.invalidate(); };
        const watchResolution = () => {
            resolution?.removeEventListener("change", resolutionChanged);
            resolution = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
            resolution.addEventListener("change", resolutionChanged);
        };
        watchResolution();
        initialize();
        return () => {
            canvas.removeEventListener("webglcontextlost", lost);
            canvas.removeEventListener("webglcontextrestored", initialize);
            document.removeEventListener("visibilitychange", this.syncMotion);
            document.removeEventListener("scroll", this.invalidate, true);
            window.removeEventListener("resize", this.invalidate);
            resolution.removeEventListener("change", resolutionChanged);
            mutation.disconnect(); this.resizeObserver?.disconnect(); this.resizeObserver = null;
            this.release();
            canvas.width = 0; canvas.height = 0;
            this.canvas = null;
        };
    }

    private release() {
        cancelAnimationFrame(this.frame); this.frame = 0;
        this.lastTime = null;
        for (const entry of this.entries) {
            if (entry.texture) this.gl?.deleteTexture(entry.texture);
            entry.texture = undefined;
            entry.loadToken = undefined;
            entry.failed = false;
            entry.element.removeAttribute("data-projected");
        }
        for (const entry of this.solarEntries) this.clearSolar(entry);
        if (this.twinklePass) {
            this.gl?.deleteBuffer(this.twinklePass.buffer);
            this.gl?.deleteProgram(this.twinklePass.program);
            this.twinklePass = null;
        }
        if (this.buffer) this.gl?.deleteBuffer(this.buffer);
        if (this.program) this.gl?.deleteProgram(this.program);
        this.gl = null; this.program = null; this.buffer = null; this.uniforms = null;
    }

    private upload(entry: Entry, map: PlanetMap) {
        const gl = this.gl;
        if (!gl) return;
        const texture = gl.createTexture();
        if (!texture) { entry.failed = true; return; }
        entry.texture = texture;
        entry.map = { equalArea: map.equalArea, axisTilt: map.axisTilt, storms: map.storms };
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, map.equalArea ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, map.width, map.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, map.pixels);
        if (map.equalArea) gl.generateMipmap(gl.TEXTURE_2D);
    }

    private prepareSolar(entry: SolarEntry) {
        const gl = this.gl!, uniforms = this.uniforms!;
        entry.textures!.forEach((texture, index) => {
            gl.activeTexture(gl.TEXTURE0 + index);
            gl.bindTexture(gl.TEXTURE_2D, texture);
        });
        gl.uniform1f(uniforms.solar, 1);
        const activity = getSolarActivity(entry.seed, this.solarTime);
        gl.uniform4fv(uniforms.sunspots, activity.centers);
        gl.uniform4fv(uniforms.sunspotFrames, activity.frames);
        gl.uniform1f(uniforms.solarPhase, (this.solarTime % (solarCycleSeconds * 1000)) / (solarCycleSeconds * 1000) * Math.PI * 2);
        for (const [uniform, color] of [[uniforms.solarPrimary, entry.palette.color],
            [uniforms.solarHighlight, entry.palette.highlight], [uniforms.solarShadow, entry.palette.shadow]] as const) {
            gl.uniform3fv(uniform, [1, 3, 5].map(index => parseInt(color.slice(index, index + 2), 16) / 255));
        }
        gl.uniform1f(uniforms.solarLaneAccent, entry.palette.laneAccent);
        gl.uniform1f(uniforms.edge, 28 / Math.min(entry.rect!.width, entry.rect!.height));
    }

    /** Sparse points share the scene's WebGL context and clock; the static starfield stays untouched. */
    private drawTwinkles(bounds: DOMRect, pixelRatio: number) {
        const gl = this.gl!;
        if (!this.twinkleStars.length || this.twinkleFailed) return;
        if (!this.twinklePass) {
            let program: WebGLProgram | null = null;
            try {
                program = createWebGLProgram(gl, twinkleVertex, twinkleFragment);
                const buffer = gl.createBuffer();
                if (!buffer) throw new Error("Twinkle buffer allocation failed");
                this.twinklePass = { program, buffer, dirty: true,
                    attributes: ([["position", 2, 0], ["shape", 2, 8], ["color", 3, 16], ["cycle", 3, 28]] as const).map(([name, size, offset]) =>
                        ({ location: gl.getAttribLocation(program!, `a_${name}`), size, offset })),
                    resolution: gl.getUniformLocation(program, "u_resolution"), pixelRatio: gl.getUniformLocation(program, "u_pixelRatio"),
                    time: gl.getUniformLocation(program, "u_time"), occluders: gl.getUniformLocation(program, "u_occluders[0]") };
            } catch {
                if (program) gl.deleteProgram(program);
                this.twinkleFailed = true;
                return;
            }
        }
        const pass = this.twinklePass;
        gl.useProgram(pass.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, pass.buffer);
        if (pass.dirty) {
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.twinkleStars.flatMap(star =>
                [star.x, star.y, star.radius, star.opacity, ...star.color, star.phase, star.frequency, star.strength])), gl.STATIC_DRAW);
            pass.dirty = false;
        }
        for (const attribute of pass.attributes) {
            gl.enableVertexAttribArray(attribute.location);
            gl.vertexAttribPointer(attribute.location, attribute.size, gl.FLOAT, false, 40, attribute.offset);
        }
        this.twinkleOccluders.fill(0);
        let index = 0;
        for (const entry of this.entries) {
            if (index >= 6) break;
            if (!entry.rect) continue;
            const rect = entry.rect, orbit = this.orbits.get(entry.orbitId);
            const x = rect.left - bounds.left + rect.width / 2, y = rect.top - bounds.top + rect.height / 2;
            const group = orbit?.speedBounds ?? { left: -rect.width / 2 - 28, right: rect.width / 2 + 28, top: -rect.height / 2 - 80, bottom: rect.height / 2 + 80 };
            this.twinkleOccluders.set([x + group.left - 2, y + group.top - 2, x + group.right + 2, y + group.bottom + 2], index++ * 4);
        }
        const identity = this.solarEntries.values().next().value?.identity;
        if (identity) this.twinkleOccluders.set([identity.left - bounds.left, identity.top - bounds.top, identity.right - bounds.left, identity.bottom - bounds.top], 24);
        gl.uniform2f(pass.resolution, bounds.width, bounds.height);
        gl.uniform1f(pass.pixelRatio, pixelRatio);
        gl.uniform1f(pass.time, this.clock.current / 1000);
        gl.uniform4fv(pass.occluders, this.twinkleOccluders);
        gl.drawArrays(gl.POINTS, 0, this.twinkleStars.length);
        for (const attribute of pass.attributes) gl.disableVertexAttribArray(attribute.location);
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.enableVertexAttribArray(this.pointAttribute);
        gl.vertexAttribPointer(this.pointAttribute, 2, gl.FLOAT, false, 0, 0);
    }

    /** Cache only the visible solar rectangle, at the canvas's native pixel density. */
    private drawSolarSnapshot(entry: SolarEntry, bounds: DOMRect, clip: DOMRect, sx: number, sy: number): boolean {
        const gl = this.gl!, canvas = this.canvas!, uniforms = this.uniforms!, rect = entry.rect!;
        const left = Math.max(0, Math.floor((Math.max(rect.left, clip.left, bounds.left) - bounds.left) * sx));
        const right = Math.min(canvas.width, Math.ceil((Math.min(rect.right, clip.right, bounds.right) - bounds.left) * sx));
        const bottom = Math.max(0, Math.floor((bounds.bottom - Math.min(rect.bottom, clip.bottom, bounds.bottom)) * sy));
        const top = Math.min(canvas.height, Math.ceil((bounds.bottom - Math.max(rect.top, clip.top, bounds.top)) * sy));
        const width = right - left, height = top - bottom;
        if (width <= 0 || height <= 0) return false;
        // Native mobile scrolling moves both boxes together; local geometry and the snapshot stay valid.
        const key = JSON.stringify([left, bottom, width, height, rect.left - bounds.left, rect.top - bounds.top, rect.width, rect.height, sx, sy]);
        if (entry.snapshot?.key !== key && entry.snapshotFailed !== key) {
            this.clearSnapshot(entry);
            const texture = gl.createTexture(), framebuffer = gl.createFramebuffer();
            try {
                if (!texture || !framebuffer) throw new Error("Solar cache allocation failed");
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
                if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error("Solar cache unavailable");
                gl.viewport(0, 0, width, height);
                gl.disable(gl.SCISSOR_TEST);
                gl.clear(gl.COLOR_BUFFER_BIT);
                this.prepareSolar(entry);
                gl.uniform2f(uniforms.resolution, width, height);
                gl.uniform4f(uniforms.rect, (rect.left - bounds.left + rect.width / 2) * sx - left,
                    (bounds.height - (rect.top - bounds.top + rect.height / 2)) * sy - bottom, rect.width * sx, rect.height * sy);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
                entry.snapshot = { texture, framebuffer, key, left, bottom, width, height };
            } catch {
                if (texture) gl.deleteTexture(texture);
                if (framebuffer) gl.deleteFramebuffer(framebuffer);
                entry.snapshotFailed = key;
            } finally {
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                gl.viewport(0, 0, canvas.width, canvas.height);
                gl.enable(gl.SCISSOR_TEST);
                gl.uniform2f(uniforms.resolution, bounds.width, bounds.height);
            }
        }
        const snapshot = entry.snapshot;
        if (!snapshot) return false;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, snapshot.texture);
        gl.uniform1f(uniforms.solar, 2);
        gl.uniform4f(uniforms.rect, (snapshot.left + snapshot.width / 2) / sx,
            (snapshot.bottom + snapshot.height / 2) / sy, snapshot.width / sx, snapshot.height / sy);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        return true;
    }

    private render = (time: number) => {
        this.frame = 0;
        const { gl, canvas, uniforms } = this;
        if (!gl || !canvas || !uniforms || document.hidden) return;
        const running = this.enabled && !this.blocked;
        if (!this.dirty && running && this.lastTime !== null && time - this.lastTime < 1000 / 30 - 1) {
            this.frame = requestAnimationFrame(this.render);
            return;
        }
        if (this.needsMeasure) {
            const bounds = canvas.getBoundingClientRect();
            if (!hasFiniteSize(bounds) || !this.orbits.measure(bounds)) {
                // ResizeObserver/configure will retry when the layout is measurable again.
                // Do not advance time or retain coordinates derived from a collapsed/detached canvas.
                this.lastTime = null;
                return;
            }
            this.bounds = bounds;
            this.clip = canvas.parentElement?.querySelector(".space-viewport")?.getBoundingClientRect() ?? this.bounds;
            for (const entry of this.solarEntries) {
                entry.rect = entry.element.getBoundingClientRect();
                const identity = Array.from(entry.element.closest(".space-body")?.querySelectorAll(".space-body-logo, .space-body-label") ?? [], element => element.getBoundingClientRect());
                if (identity.length) {
                    const left = Math.min(...identity.map(rect => rect.left)), top = Math.min(...identity.map(rect => rect.top));
                    entry.identity = new DOMRect(left, top, Math.max(...identity.map(rect => rect.right)) - left, Math.max(...identity.map(rect => rect.bottom)) - top);
                }
            }
            for (const entry of this.entries) {
                const measured = entry.element.getBoundingClientRect();
                const offset = this.orbits.get(entry.orbitId);
                entry.baseRect = new DOMRect(measured.x - (offset?.x ?? 0), measured.y - (offset?.y ?? 0), measured.width, measured.height);
                entry.rect = measured;
                const rotation = parseFloat(getComputedStyle(entry.element).getPropertyValue("--light-rotation")) * Math.PI / 180;
                const depth = entry.lighting.depth;
                const length = Math.hypot(1, depth);
                entry.light = [-Math.cos(rotation) / length, Math.sin(rotation) / length, depth / length];
            }
            this.needsMeasure = false;
        }
        const previousTime = this.clock.current;
        if (running) {
            if (this.lastTime !== null) this.clock.current += Math.max(0, time - this.lastTime);
            this.lastTime = time;
        }
        if (this.convectionEnabled) this.solarTime += Math.max(0, this.clock.current - this.solarLastSceneTime);
        this.solarLastSceneTime = this.clock.current;
        this.orbits.update(this.clock.current - previousTime);
        for (const entry of this.entries) {
            const orbit = this.orbits.get(entry.orbitId), base = entry.baseRect!;
            if (!orbit) { entry.rect = base; continue; }
            entry.rect = new DOMRect(base.x + orbit.x, base.y + orbit.y, base.width, base.height);
            entry.light = orbit.lightDirection;
        }
        const bounds = this.bounds!, clip = this.clip!;
        const ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(8_388_608 / (bounds.width * bounds.height)));
        const pixelWidth = Math.max(1, Math.round(bounds.width * ratio)), pixelHeight = Math.max(1, Math.round(bounds.height * ratio));
        if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; }
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.disable(gl.SCISSOR_TEST); gl.clear(gl.COLOR_BUFFER_BIT);
        this.drawTwinkles(bounds, canvas.width / bounds.width);
        gl.enable(gl.SCISSOR_TEST);
        const left = Math.max(0, clip.left - bounds.left), top = Math.max(0, clip.top - bounds.top);
        const right = Math.min(bounds.width, clip.right - bounds.left), bottom = Math.min(bounds.height, clip.bottom - bounds.top);
        const sx = canvas.width / bounds.width, sy = canvas.height / bounds.height;
        gl.scissor(Math.ceil(left * sx), Math.ceil((bounds.height - bottom) * sy), Math.max(0, Math.floor((right - left) * sx)), Math.max(0, Math.floor((bottom - top) * sy)));
        gl.uniform2f(uniforms.resolution, bounds.width, bounds.height);
        let visible = 0;
        let pending = false;
        for (const entry of this.solarEntries) {
            const rect = entry.rect!;
            if (!rect.width || rect.bottom <= clip.top || rect.top >= clip.bottom || rect.right <= clip.left || rect.left >= clip.right) continue;
            if (!entry.textures && !entry.loadToken && !entry.failed) {
                const token = {};
                entry.loadToken = token;
                void generateSolarMaps(entry.seed).then(maps => {
                    if (!this.solarEntries.has(entry) || entry.loadToken !== token || this.gl !== gl) return;
                    const textures: WebGLTexture[] = [];
                    try {
                        [maps.detail, maps.sites].forEach((map, index) => {
                            const texture = gl.createTexture();
                            if (!texture) throw new Error("Solar texture allocation failed");
                            textures.push(texture);
                            gl.activeTexture(gl.TEXTURE0 + index);
                            gl.bindTexture(gl.TEXTURE_2D, texture);
                            const wrap = gl.REPEAT;
                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, index === 1 ? gl.NEAREST : gl.LINEAR_MIPMAP_LINEAR);
                            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, index === 1 ? gl.NEAREST : gl.LINEAR);
                            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, map.width, map.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, map.pixels);
                            if (index === 0) gl.generateMipmap(gl.TEXTURE_2D);
                        });
                        entry.textures = textures;
                        this.invalidate();
                    } catch {
                        for (const texture of textures) gl.deleteTexture(texture);
                        entry.failed = true;
                        this.invalidate();
                    } finally { gl.activeTexture(gl.TEXTURE0); }
                }, () => { entry.failed = true; this.invalidate(); });
            }
            if (!entry.textures) { if (!entry.failed) pending = true; continue; }
            if (this.convectionEnabled || !this.drawSolarSnapshot(entry, bounds, clip, sx, sy)) {
                this.prepareSolar(entry);
                gl.uniform4f(uniforms.rect, rect.left - bounds.left + rect.width / 2, bounds.height - (rect.top - bounds.top + rect.height / 2), rect.width, rect.height);
                gl.drawArrays(gl.TRIANGLES, 0, 6);
            }
            if (!entry.element.hasAttribute("data-projected")) entry.element.setAttribute("data-projected", "");
            visible++;
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1f(uniforms.solar, 0);
        const solarRect = this.solarEntries.values().next().value?.rect;
        gl.uniform4f(uniforms.sunRect, solarRect ? solarRect.left - bounds.left + solarRect.width / 2 : 0,
            solarRect ? bounds.height - (solarRect.top - bounds.top + solarRect.height / 2) : 0,
            solarRect?.width ?? 0, solarRect?.height ?? 0);
        const planetDrawOrder = [...this.entries].sort((a, b) =>
            (this.orbits.get(a.orbitId)?.depth ?? 0) - (this.orbits.get(b.orbitId)?.depth ?? 0));
        const shadowSpheres = new Map<Entry, ShadowSphere>();
        const shadowSun: ShadowSun | null = solarRect ? {
            center: [solarRect.left + solarRect.width / 2, -solarRect.top - solarRect.height / 2, 0],
            radius: Math.min(solarRect.width, solarRect.height) / 2,
        } : null;
        if (this.shadowsEnabled && shadowSun) {
            for (const entry of planetDrawOrder) {
                const orbit = this.orbits.get(entry.orbitId), rect = entry.rect;
                if (orbit && rect) shadowSpheres.set(entry, { id: orbit.id,
                    center: [rect.left + rect.width / 2, -rect.top - rect.height / 2, orbit.depth],
                    radius: rect.width / 2, opacity: orbit.shadowOpacity });
            }
        }
        const spheres = [...shadowSpheres.values()];
        for (const entry of planetDrawOrder) {
            const rect = entry.rect!;
            if (!rect.width || rect.bottom <= clip.top || rect.top >= clip.bottom || rect.right <= clip.left || rect.left >= clip.right) continue;
            if (!entry.texture && !entry.loadToken && !entry.failed) {
                const map = generatePlanetMap(entry.options);
                if (map instanceof Promise) {
                    const token = {};
                    entry.loadToken = token;
                    void map.then(loaded => {
                        if (!this.entries.has(entry) || entry.loadToken !== token || this.gl !== gl) return;
                        this.upload(entry, loaded);
                        this.invalidate();
                    }, () => { entry.failed = true; this.invalidate(); });
                } else this.upload(entry, map);
            }
            if (!entry.texture) { if (!entry.failed) pending = true; continue; }
            gl.bindTexture(gl.TEXTURE_2D, entry.texture);
            const { rotation } = entry;
            const phase = rotation.phase + rotation.direction * this.clock.current / (rotation.periodSeconds * 1000) * Math.PI * 2;
            gl.uniform4f(uniforms.rect, rect.left - bounds.left + rect.width / 2, bounds.height - (rect.top - bounds.top + rect.height / 2), rect.width, rect.height);
            gl.uniform1f(uniforms.phase, phase % (Math.PI * 2));
            gl.uniform3fv(uniforms.light, entry.light!);
            gl.uniform1f(uniforms.relief, entry.options.type === "terrestrial" ? 0.05 : 0);
            gl.uniform1f(uniforms.edge, 3 / rect.width);
            gl.uniform1f(uniforms.equalArea, entry.map?.equalArea ? 1 : 0);
            gl.uniform1f(uniforms.axisTilt, entry.map?.axisTilt ?? 0);
            const orbit = this.orbits.get(entry.orbitId);
            const lighting = getPlanetPhaseLighting(entry.lighting, orbit);
            gl.uniform1f(uniforms.fill, lighting.fill);
            gl.uniform1f(uniforms.terminatorStart, lighting.terminatorStart);
            const receiver = shadowSpheres.get(entry);
            const casters = receiver && shadowSun ? getPlanetShadowCasters(receiver, spheres, shadowSun) : [];
            gl.uniform1i(uniforms.shadowCount, casters.length);
            if (receiver && shadowSun && casters.length) {
                casters.forEach(({ sphere, opacity }, index) => {
                    this.shadowCasters.set([...sphere.center.map((v, i) => v - receiver.center[i]), sphere.radius], index * 4);
                    this.shadowFades[index] = opacity;
                });
                gl.uniform4fv(uniforms.shadowCasters, this.shadowCasters);
                gl.uniform1fv(uniforms.shadowFades, this.shadowFades);
                gl.uniform4f(uniforms.shadowSun, shadowSun.center[0] - receiver.center[0],
                    shadowSun.center[1] - receiver.center[1], shadowSun.center[2] - receiver.center[2], shadowSun.radius);
                gl.uniform1f(uniforms.shadowRadius, receiver.radius);
            }
            const profiles = entry.map?.storms;
            gl.uniform1f(uniforms.stormsEnabled, profiles?.length ? 1 : 0);
            if (profiles?.length) {
                const activity = getGiantStormActivity(entry.options.seed, profiles, this.clock.current);
                gl.uniform4fv(uniforms.storms, activity.geometry);
                gl.uniform4fv(uniforms.stormMotion, activity.motion);
                gl.uniform3fv(uniforms.stormPale, entry.stormPalette.pale);
                gl.uniform3fv(uniforms.stormDark, entry.stormPalette.dark);
            }
            gl.uniform1f(uniforms.behind, orbit?.back ? 1 : 0);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            if (!entry.element.hasAttribute("data-projected")) entry.element.setAttribute("data-projected", "");
            visible++;
        }
        this.dirty = false;
        if (!pending) this.markReady();
        if (running && (visible || this.orbits.hasMotion() || this.twinkleStars.length)) this.frame = requestAnimationFrame(this.render);
        else this.lastTime = null;
    };
}
