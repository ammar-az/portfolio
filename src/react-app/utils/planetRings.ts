import { createWebGLProgram } from "./webglProgram";
import { planetShadowFragment } from "./planetShadowShader";
import { getPlanetShadowCasters, maxPlanetShadowCasters } from "./planetShadows";
import type { ShadowSphere, ShadowSun } from "./planetShadows";
import { ringPixels, systemBasis } from "./planetSystems";
import type { RingProfile, Vector3 } from "./planetSystems";
import { solarGlowFragment } from "./solarGlow";

export type RingInstance = { id: string; profile: RingProfile; center: Vector3; radius: number; angle: number; opacity: number; drawDepth?: number };
const vertex = `
attribute vec2 a_point;
uniform vec2 u_resolution;
uniform vec4 u_center;
uniform vec3 u_major;
uniform vec3 u_minor;
uniform float u_outer;
uniform float u_depthRange;
uniform float u_drawDepth;
varying vec3 v_local;
varying vec2 v_pixel;
void main() {
    v_local = (u_major * a_point.x + u_minor * a_point.y) * u_center.w * u_outer;
    v_pixel = u_center.xy + v_local.xy;
    gl_Position = vec4(v_pixel / u_resolution * 2.0 - 1.0, -(u_drawDepth + v_local.z) / u_depthRange, 1.0);
}`;
const fragment = `
precision highp float;
const float PI = 3.141592653589793;
varying vec3 v_local;
varying vec2 v_pixel;
uniform sampler2D u_map;
uniform vec4 u_center;
uniform vec3 u_major;
uniform vec3 u_minor;
uniform vec3 u_limits;
uniform vec4 u_color;
uniform vec4 u_sunRect;
${planetShadowFragment}
${solarGlowFragment}
void main() {
    float r = length(v_local) / u_center.w;
    if (r <= u_limits.x || r >= u_limits.y) discard;
    float edge = 1.1 / u_center.w;
    float alpha = texture2D(u_map, vec2((r-u_limits.x)/(u_limits.y-u_limits.x),0.5)).r * u_limits.z * u_color.a;
    alpha *= smoothstep(u_limits.x,u_limits.x+edge,r) * (1.0-smoothstep(u_limits.y-edge,u_limits.y,r));
    // A slightly denser foreground section makes the planet/ring crossing easier to read.
    float overPlanet = 1.0-smoothstep(0.97,1.02,length(v_local.xy)/u_center.w);
    alpha *= 1.0 + 0.30 * overPlanet * smoothstep(0.0,0.12*u_center.w,v_local.z);
    if (u_center.z + v_local.z < 0.0 && u_sunRect.z > 0.0) {
        alpha *= smoothstep(0.99,1.01,length((v_pixel-u_sunRect.xy)/(u_sunRect.zw*0.5)));
    }
    vec3 light = normalize(u_shadowSun.xyz-v_local);
    float diffuse = 0.4 + 0.6 * sqrt(abs(dot(cross(u_major,u_minor),light)));
    float lighting = 0.20 + 0.80 * diffuse * planetShadowVisibility(v_local);
    vec3 color = u_color.rgb * lighting;
    if (u_center.z + v_local.z < 0.0) color = solarGlowOver(color, v_pixel);
    gl_FragColor = vec4(color * alpha,alpha);
}`;

/** Thin physical annuli share the sphere depth buffer; no DOM hit targets or animated raster textures. */
export class PlanetRings {
    private textures = new Map<RingProfile, WebGLTexture>();
    private program: WebGLProgram;
    private buffer: WebGLBuffer;
    private point: number;
    private uniforms: Record<string, WebGLUniformLocation | null>;
    private casters = new Float32Array(maxPlanetShadowCasters * 4);
    private fades = new Float32Array(maxPlanetShadowCasters);
    constructor(private gl: WebGLRenderingContext) {
        this.program = createWebGLProgram(gl, vertex, fragment);
        const buffer = gl.createBuffer();
        if (!buffer) throw new Error("Ring buffer allocation failed");
        this.buffer = buffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
        this.point = gl.getAttribLocation(this.program, "a_point");
        this.uniforms = Object.fromEntries(["resolution", "center", "major", "minor", "outer", "depthRange", "drawDepth", "map", "limits", "color", "sunRect", "solarGlow", "shadowCount", "shadowCasters", "shadowFades", "shadowSun", "shadowRadius"].map(name => [name,
            gl.getUniformLocation(this.program, `u_${name}${["shadowCasters", "shadowFades"].includes(name) ? "[0]" : ""}`)]));
    }
    texture(profile: RingProfile) {
        const cached = this.textures.get(profile);
        if (cached) return cached;
        const gl = this.gl, texture = gl.createTexture();
        if (!texture) throw new Error("Ring texture allocation failed");
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, ringPixels(profile));
        gl.generateMipmap(gl.TEXTURE_2D);
        this.textures.set(profile, texture);
        return texture;
    }
    draw(rings: RingInstance[], bounds: DOMRect, depthRange: number, sun: ShadowSun, solarRect: DOMRect, spheres: ShadowSphere[], shadows: boolean, glow: [number, number, number, number]) {
        const gl = this.gl, u = this.uniforms;
        gl.useProgram(this.program); gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.enableVertexAttribArray(this.point); gl.vertexAttribPointer(this.point, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(u.resolution, bounds.width, bounds.height); gl.uniform1f(u.depthRange, depthRange);
        gl.uniform1i(u.map, 0); gl.activeTexture(gl.TEXTURE0);
        gl.uniform4fv(u.solarGlow, glow);
        gl.uniform4f(u.sunRect, solarRect.left - bounds.left + solarRect.width / 2, bounds.bottom - solarRect.top - solarRect.height / 2, solarRect.width, solarRect.height);
        for (const ring of [...rings].sort((a, b) => a.center[2] - b.center[2])) {
            const { profile, center, radius } = ring, basis = systemBasis(ring.angle, profile.opening);
            gl.bindTexture(gl.TEXTURE_2D, this.texture(profile));
            gl.uniform4f(u.center, center[0] - bounds.left, center[1] + bounds.bottom, center[2], radius);
            gl.uniform1f(u.drawDepth,ring.drawDepth??center[2]);
            gl.uniform3fv(u.major, basis.major); gl.uniform3fv(u.minor, basis.minor);
            gl.uniform1f(u.outer, profile.outer); gl.uniform3f(u.limits, profile.inner, profile.outer, profile.opacity);
            gl.uniform4f(u.color, ...profile.tint, ring.opacity);
            gl.uniform4f(u.shadowSun, sun.center[0] - center[0], sun.center[1] - center[1], sun.center[2] - center[2], sun.radius);
            gl.uniform1f(u.shadowRadius, 1);
            const parent = spheres.find(s => s.id === ring.id);
            const nearby = getPlanetShadowCasters({ id: ring.id, center, radius: radius * profile.outer, opacity: 1 }, spheres, sun);
            const candidates = shadows ? [...(parent ? [{ sphere: parent, opacity: 1 }] : []), ...nearby].slice(0, maxPlanetShadowCasters) : [];
            gl.uniform1i(u.shadowCount, candidates.length);
            if (candidates.length) {
                candidates.forEach(({ sphere, opacity }, i) => { this.casters.set([...sphere.center.map((v, k) => v - center[k]), sphere.radius], i * 4); this.fades[i] = opacity; });
                gl.uniform4fv(u.shadowCasters, this.casters); gl.uniform1fv(u.shadowFades, this.fades);
            }
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
        // Rerolls/context changes must not accumulate unused radial textures.
        const retained = new Set(rings.map(r => r.profile));
        for (const [profile, texture] of this.textures) if (!retained.has(profile)) { gl.deleteTexture(texture); this.textures.delete(profile); }
    }
    dispose() {
        for (const texture of this.textures.values()) this.gl.deleteTexture(texture);
        this.textures.clear(); this.gl.deleteBuffer(this.buffer); this.gl.deleteProgram(this.program);
    }
}
