import { seededRandom } from "../utils/seededRandom";

export type DeepSkyImage = {
    id: string; name: string; page: string; credit: string;
    crop: readonly [number, number, number, number];
};

let catalogue: Promise<DeepSkyImage[]> | undefined;

/** Public assets are fetched by URL; the standalone gallery uses the same catalogue. */
export function loadDeepSkyCatalogue(): Promise<DeepSkyImage[]> {
    if (!catalogue) catalogue = fetch("/space/deep-sky/sources.json").then(response => {
        if (!response.ok) throw new Error("Background image catalogue unavailable");
        return response.json() as Promise<DeepSkyImage[]>;
    }).catch(error => { catalogue = undefined; throw error; });
    return catalogue;
}

export function chooseDeepSky(seed: number, desktop: boolean, images: readonly DeepSkyImage[]): DeepSkyImage[] {
    const random = seededRandom(`${seed}:deep-sky`), pool = [...images];
    const result: DeepSkyImage[] = [];
    const count = Math.min(pool.length, desktop ? 6 + Math.floor(random() * 5) : 3 + Math.floor(random() * 3));
    for (let i = 0; i < count; i++)result.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
    return result;
}
