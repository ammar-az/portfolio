import type { DeepSkyImage } from "../data/deepSky";
import { seededRandom } from "./seededRandom";

const prepared = new Map<string, Promise<HTMLCanvasElement>>();
const smooth = (a: number, b: number, v: number) => { const t = Math.max(0, Math.min(1, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Preparation also runs in the review browser to produce small transparent WebP assets. */
export function processDeepSky(image: HTMLImageElement, asset: DeepSkyImage) {
    const [x, y, w, h] = asset.crop, aspect = image.width * w / (image.height * h);
    const canvas = document.createElement("canvas");
    canvas.width = aspect >= 1 ? 160 : Math.round(160 * aspect);
    canvas.height = aspect <= 1 ? 160 : Math.round(160 / aspect);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Background image preparation unavailable");
    context.drawImage(image, x * image.width, y * image.height, w * image.width, h * image.height, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height), data = pixels.data;
    const border: number[][] = [[], [], []];
    for (let py = 0; py < canvas.height; py++) for (let px = 0; px < canvas.width; px++) {
        const edge = Math.min(px / canvas.width, 1 - px / canvas.width, py / canvas.height, 1 - py / canvas.height);
        const i = (py * canvas.width + px) * 4;
        if (edge < .10) for (let c = 0; c < 3; c++) border[c].push(data[i + c]);
    }
    const black = border.map(channel => { channel.sort((a, b) => a - b); return channel[Math.floor(channel.length * .45)] ?? 0; });
    for (let py = 0; py < canvas.height; py++) for (let px = 0; px < canvas.width; px++) {
        const i = (py * canvas.width + px) * 4;
        for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, data[i + c] - black[c] - 3);
        const luminance = (data[i] * .3 + data[i + 1] * .59 + data[i + 2] * .11) / 255;
        const edge = Math.min((px + .5) / canvas.width, 1 - (px + .5) / canvas.width,
            (py + .5) / canvas.height, 1 - (py + .5) / canvas.height);
        data[i + 3] = Math.round(255 * smooth(.012, .36, luminance) * smooth(0, .19, edge));
    }
    context.putImageData(pixels, 0, 0);
    return canvas;
}

export function prepareDeepSky(asset: DeepSkyImage) {
    const cached = prepared.get(asset.id);
    if (cached) return cached;
    const pending = (async () => {
        const image = new Image();
        image.decoding = "async"; image.fetchPriority = "low";
        try {
            image.src = `/space/deep-sky/thumbs/${asset.id}.webp`;
            await image.decode();
            const canvas = document.createElement("canvas");
            canvas.width = image.width; canvas.height = image.height;
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Background canvas unavailable");
            context.drawImage(image, 0, 0);
            return canvas;
        } finally { image.removeAttribute("src"); }
    })();
    if (prepared.size >= 16) prepared.delete(prepared.keys().next().value!);
    prepared.set(asset.id, pending); void pending.catch(() => {
        if (prepared.get(asset.id) === pending) prepared.delete(asset.id);
    });
    return pending;
}

export function paintDeepSky(context: CanvasRenderingContext2D, width: number, height: number, seed: number, images: HTMLCanvasElement[], desktop: boolean) {
    const random = seededRandom(`${seed}:deep-sky-placement`);
    // Distinct jittered cells spread a fuller sky without piling objects onto the same four positions.
    const cells = desktop
        ? Array.from({ length: 12 }, (_, i) => [.33 + i % 4 * .19, .20 + Math.floor(i / 4) * .29])
        : Array.from({ length: 9 }, (_, i) => [.18 + i % 3 * .32, .25 + Math.floor(i / 3) * .21]);
    context.save(); context.globalCompositeOperation = "screen";
    images.forEach(image => {
        const cell = cells.splice(Math.floor(random() * cells.length), 1)[0];
        const x = width * (cell[0] + (random() - .5) * .09);
        const y = height * (cell[1] + (random() - .5) * .10);
        const size = Math.min(width * .065, 24 + random() * 30);
        const scale = size / Math.max(image.width, image.height);
        context.save(); context.translate(x, y); context.rotate(random() * Math.PI * 2);
        context.globalAlpha = .30 + random() * .18;
        context.drawImage(image, -image.width * scale / 2, -image.height * scale / 2, image.width * scale, image.height * scale); context.restore();
    });
    context.restore();
}
