import { seededRandom } from "./seededRandom";
import { solarSpotCount } from "./solarShader";

type Slot = {
    period: number; offset: number; epoch: number;
    u: number; v: number; radius: number; duration: number;
};
const cache = new Map<number, { slots: Slot[]; uniforms: Float32Array<ArrayBuffer> }>();
const smooth = (a: number, b: number, value: number) => {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

/** Independent events choose new hemisphere locations only while their previous spot is absent. */
export function getSolarActivity(seed: number, elapsedMs: number): Float32Array<ArrayBuffer> {
    let activity = cache.get(seed);
    if (!activity) {
        const random = seededRandom(`${seed}:solar-event-slots`);
        const slots = Array.from({ length: solarSpotCount }, (): Slot => {
            const period = 24 + random() * 20;
            return { period, offset: random() * period, epoch: NaN, u: 0, v: 0, radius: 0, duration: 1 };
        });
        activity = { slots, uniforms: new Float32Array(solarSpotCount * 4) };
        if (cache.size >= 2) cache.delete(cache.keys().next().value!);
        cache.set(seed, activity);
    }
    activity.slots.forEach((slot, index) => {
        const time = Math.max(0, elapsedMs) / 1000 + slot.offset;
        const epoch = Math.floor(time / slot.period);
        if (slot.epoch !== epoch) {
            const random = seededRandom(`${seed}:solar-event:${index}:${epoch}`);
            slot.epoch = epoch;
            slot.u = random();
            // Uniform surface-area distribution across the visible hemisphere, without reserved regions.
            slot.v = 0.5 - Math.asin(random() * 2 - 1) / Math.PI;
            slot.radius = 0.007 + random() * 0.011;
            slot.duration = slot.period * (0.4 + random() * 0.2);
        }
        const age = (time - epoch * slot.period) / slot.duration;
        const life = smooth(0, 0.28, age) * (1 - smooth(0.58, 1, age));
        activity.uniforms.set([slot.u, slot.v, slot.radius, life], index * 4);
    });
    return activity.uniforms;
}
