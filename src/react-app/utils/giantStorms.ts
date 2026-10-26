import type { PlanetTextureOptions } from "./planetTextures";
import { seededRandom } from "./seededRandom";

export const giantStormCount = 3;
export type GiantStormProfile = { u: number; v: number; radiusU: number; radiusV: number; rotation: number };
type Slot = {
    period: number; offset: number; epoch: number; duration: number;
    u: number; v: number; size: number; aspect: number; drift: number; spin: number; phase: number;
};
type StormActivity = { geometry: Float32Array<ArrayBuffer>; motion: Float32Array<ArrayBuffer> };
const cache = new Map<string | number, StormActivity & { slots: Slot[] }>();
const smooth = (a: number, b: number, value: number) => {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

/** Seeded cloud systems with visible circulation and slower travel relative to the atmosphere. */
export function getGiantStormActivity(seed: string | number, profiles: GiantStormProfile[], elapsedMs: number): StormActivity {
    let activity = cache.get(seed);
    if (!activity) {
        const random = seededRandom(`${seed}:storm-slots`);
        const slots = profiles.slice(0, giantStormCount).map((_, index): Slot => {
            const period = 120 + random() * 70;
            return { period, offset: (index / giantStormCount + random() * 0.12) * period, epoch: NaN,
                duration: 1, u: 0, v: 0, size: 1, aspect: 1, drift: 0, spin: 0, phase: 0 };
        });
        activity = { slots, geometry: new Float32Array(giantStormCount * 4), motion: new Float32Array(giantStormCount * 4) };
        if (cache.size >= 12) cache.delete(cache.keys().next().value!);
        cache.set(seed, activity);
    }
    activity.slots.forEach((slot, index) => {
        const profile = profiles[index];
        const time = Math.max(0, elapsedMs) / 1000 + slot.offset;
        const epoch = Math.floor(time / slot.period), eventTime = time - epoch * slot.period;
        if (slot.epoch !== epoch) {
            const random = seededRandom(`${seed}:storm:${index}:${epoch}`);
            slot.epoch = epoch;
            slot.u = epoch === 0 ? profile.u : random();
            slot.v = profile.v + (random() - 0.5) * 0.035;
            slot.duration = slot.period * (0.72 + random() * 0.08);
            slot.size = 1.15 + random() * 0.5;
            const drift = random() - 0.5;
            slot.drift = (drift < 0 ? -1 : 1) * (0.00035 + Math.abs(drift) * 0.0007);
            slot.spin = (random() < 0.5 ? -1 : 1) * Math.PI * 2 / (24 + random() * 18);
            slot.phase = random() * Math.PI * 2;
            // At least one slot produces round storms; others vary between ovals and circles.
            // Separate randomness preserves event positions, lifetimes and circulation directions.
            const shape = seededRandom(`${seed}:storm-shape:${index}:${epoch}`);
            const roundSlot = Math.floor(seededRandom(`${seed}:round-storm`)() * activity!.slots.length);
            slot.aspect = index === roundSlot || shape() < 0.3 ? 0.9 + shape() * 0.15 : 0.6 + shape() * 0.25;
        }
        const age = eventTime / slot.duration;
        const life = smooth(0, 0.25, age) * (1 - smooth(0.7, 1, age));
        const u = slot.u + eventTime * slot.drift;
        const radiusU = Math.max(0.014, Math.min(0.034, profile.radiusU * slot.size));
        // Correct equal-area map scales so a round storm is round on the sphere, not a thin belt.
        const latitudeScaleSquared = Math.max(0.2, 1 - (1 - slot.v * 2) ** 2);
        const radiusV = radiusU * Math.PI * latitudeScaleSquared * slot.aspect;
        activity.geometry.set([((u % 1) + 1) % 1, slot.v, radiusU, radiusV], index * 4);
        activity.motion.set([life, slot.phase + eventTime * slot.spin, profile.rotation, Math.sign(slot.spin)], index * 4);
    });
    return activity;
}

export function getGiantStormPalette(options: PlanetTextureOptions) {
    const rgb = (hex: string) => {
        const raw = hex.replace("#", "");
        const full = raw.length === 3 ? [...raw].map(c => c + c).join("") : raw;
        return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255);
    };
    const primary = rgb(options.color), accent = options.accentColor ? rgb(options.accentColor) : primary;
    return {
        pale: primary.map((c, i) => c * 0.25 + accent[i] * 0.55 + 0.2),
        dark: primary.map((c, i) => c * 0.45 + [7, 17, 34][i] / 255 * 0.55),
    };
}

export const giantStormFragment = `
uniform float u_stormsEnabled;
uniform vec4 u_storms[${giantStormCount}];
uniform vec4 u_stormMotion[${giantStormCount}];
uniform vec3 u_stormPale;
uniform vec3 u_stormDark;

vec2 giantFlow(vec2 uv) {
    if (u_stormsEnabled < 0.5) return uv;
    vec2 result = uv;
    for (int i = 0; i < ${giantStormCount}; i++) {
        vec4 storm = u_storms[i], motion = u_stormMotion[i];
        if (motion.x <= 0.0) continue;
        vec2 delta = vec2(fract(uv.x - storm.x + 0.5) - 0.5, uv.y - storm.y);
        vec2 q = delta / storm.zw;
        float radius = length(q);
        if (radius >= 2.5) continue;
        // A compact circulation field bends nearby bands and fades to an unchanged atmosphere.
        float bend = motion.w * motion.x * 0.24 * (1.0 - smoothstep(0.35, 2.5, radius));
        float c = cos(bend), s = sin(bend);
        result += (mat2(c, -s, s, c) * q - q) * storm.zw;
    }
    return result;
}

vec3 giantWeather(vec3 color, vec2 uv) {
    if (u_stormsEnabled < 0.5) return color;
    for (int i = 0; i < ${giantStormCount}; i++) {
        vec4 storm = u_storms[i], motion = u_stormMotion[i];
        float life = motion.x;
        if (life <= 0.0) continue;
        float growth = 0.65 + 0.35 * sqrt(life);
        vec2 delta = vec2(fract(uv.x - storm.x + 0.5) - 0.5, uv.y - storm.y);
        vec2 q = delta / (storm.zw * growth);
        float c = cos(motion.z), s = sin(motion.z);
        q = mat2(c, -s, s, c) * q;
        float radius = length(q);
        if (radius >= 2.2) continue;
        float angle = atan(q.y, q.x) - motion.y;
        // Establish a coherent oval cloud mass before adding circulation around its edge.
        // Moving broad cloud variations give the filled body readable internal circulation.
        float body = 1.0 - smoothstep(0.8, 1.15, radius);
        float interior = 0.3 + 0.06 * (1.0 - smoothstep(0.0, 1.1, radius))
            + 0.18 * sin(angle + radius * 3.0);
        color = mix(color, mix(u_stormDark, u_stormPale, interior), body * life * 0.72);
        // One asymmetric, soft cloud arm crosses the outer body and trails into the atmosphere.
        // A broad feature is readable at scene size without replacing the oval with tight rings.
        float flow = angle + radius * 2.7 + 0.22 * sin(angle * 2.0 + radius * 1.5 + motion.z * 7.0);
        float cloud = smoothstep(0.5, 0.95, 0.5 + 0.5 * sin(flow));
        float tail = smoothstep(0.4, 0.85, radius) * (1.0 - smoothstep(1.25, 2.2, radius));
        float wisps = 0.55 + 0.45 * sin(angle + radius * 0.4 + motion.z * 7.0);
        vec3 cloudColor = mix(u_stormPale, vec3(1.0), 0.4);
        color = mix(color, cloudColor, tail * cloud * wisps * life * smoothstep(0.12, 0.8, life) * 0.7);
    }
    return color;
}`;
