import type { StarFinish, StarPalette } from "../data/starAppearance";

const textureCache = new Map<string, string>();
const textureCacheLimit = 64;

const n = (value: number) => value.toFixed(2);
const channels = (hex: string) => [1, 3, 5].map(index => (parseInt(hex.slice(index, index + 2), 16) / 255).toFixed(3));

// Separate seeded streams keep activity fixed across palette and finish changes.
function randomSequence(seed: number) {
    let state = (seed | 0) || 0x6d2b79f5;
    return () => {
        state ^= state << 13;
        state ^= state >>> 17;
        state ^= state << 5;
        return (state >>> 0) / 4294967296;
    };
}

function spotOutline(radius: number, random: () => number): string {
    const points = Array.from({ length: 18 }, (_, index) => {
        const angle = index / 18 * Math.PI * 2;
        const r = radius * (0.72 + random() * 0.45);
        return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
    });
    let path = `M${n((points[17].x + points[0].x) / 2)} ${n((points[17].y + points[0].y) / 2)}`;
    points.forEach((point, index) => {
        const next = points[(index + 1) % points.length];
        path += `Q${n(point.x)} ${n(point.y)} ${n((point.x + next.x) / 2)} ${n((point.y + next.y) / 2)}`;
    });
    return path + "Z";
}

function activityGroups(palette: StarPalette, finish: StarFinish, seed: number): string {
    const random = randomSequence(seed ^ 0x51a7);
    const core = `#${[1, 3, 5].map(index => Math.round(parseInt(palette.shadow.slice(index, index + 2), 16) * 0.22).toString(16).padStart(2, "0")).join("")}`;
    return Array.from({ length: 5 }, (_, index) => {
        // Bias a few groups toward the visible cap; project and compress them toward the limb.
        const longitude = (index < 3 ? 35 + random() * 30 : -50 + random() * 100) * Math.PI / 180;
        const latitude = (index % 2 ? -1 : 1) * (10 + random() * 20) * Math.PI / 180;
        const x = 256 + Math.sin(longitude) * Math.cos(latitude) * 228;
        const y = 256 + Math.sin(latitude) * 228;
        const mu = Math.max(0.25, Math.cos(longitude) * Math.cos(latitude));
        const rotation = Math.atan2(y - 256, x - 256) * 180 / Math.PI;
        const count = 2 + Math.floor(random() * 3);
        const spots = Array.from({ length: count }, (_, spot) => {
            const radius = spot === 0 ? 2.5 + random() * 2.8 : 1 + random() * 1.8;
            const dx = spot === 0 ? 0 : (random() - 0.5) * 23;
            const dy = spot === 0 ? 0 : (random() - 0.5) * 14;
            const outer = spotOutline(radius * 2.1, random);
            const inner = spotOutline(radius, random);
            const fibers = Array.from({ length: 20 }, (_, i) => {
                const angle = i / 20 * Math.PI * 2;
                const r = radius * (1.1 + random() * 0.3);
                return `<path d="M${n(Math.cos(angle) * r)} ${n(Math.sin(angle) * r)}l${n(Math.cos(angle) * radius * 0.7)} ${n(Math.sin(angle) * radius * 0.7)}" stroke="${core}" stroke-width=".35" opacity=".18"/>`;
            }).join("");
            return `<g transform="translate(${n(dx)} ${n(dy)})">
                <path d="${outer}" fill="${palette.shadow}" opacity="${finish === "smooth" ? ".38" : ".28"}"/>
                ${fibers}<path d="${inner}" fill="${core}" opacity=".88"/>
            </g>`;
        }).join("");
        return `<g data-activity-group="${index}" transform="translate(${n(x)} ${n(y)}) rotate(${n(rotation)}) scale(${n(mu)} 1)">
            <ellipse rx="18" ry="10" fill="${palette.highlight}" opacity=".045"/>
            <g filter="url(#activity)">${spots}</g>
        </g>`;
    }).join("");
}

export function generateStarTexture(palette: StarPalette, finish: StarFinish, seed = 1871): string {
    const key = JSON.stringify([palette.color, palette.highlight, palette.shadow, finish, seed]);
    const cached = textureCache.get(key);
    if (cached) return cached;

    const random = randomSequence(seed);
    const primary = channels(palette.color);
    const bright = channels(palette.highlight);
    const dark = channels(palette.shadow);

    const filaments = finish === "textured" ? Array.from({ length: 180 }, () => {
        const x = random() * 512;
        const y = random() * 512;
        const dx = 4 + random() * 14;
        const dy = (random() - 0.5) * 13;
        const color = random() > 0.5 ? palette.highlight : palette.shadow;
        return `<path d="M${n(x)} ${n(y)}q${n(dx * 0.3)} ${n(dy + 5)} ${n(dx)} ${n(dy)}t${n(dx * 0.6)} ${n(-dy * 0.4)}"
            fill="none" stroke="${color}" stroke-width="${n(0.5 + random() * 1.2)}" opacity="${n(0.12 + random() * 0.18)}"/>`;
    }).join("") : "";

    const spots = activityGroups(palette, finish, seed);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 512 512" preserveAspectRatio="none">
        <defs>
            <filter id="granulation" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">
                <feTurbulence type="fractalNoise" baseFrequency="${finish === "smooth" ? ".46" : ".25"}" numOctaves="3" seed="${seed}"/>
                <feColorMatrix type="saturate" values="0"/>
                <feComponentTransfer>
                    <feFuncR type="table" tableValues="${dark[0]} ${primary[0]} ${bright[0]}"/>
                    <feFuncG type="table" tableValues="${dark[1]} ${primary[1]} ${bright[1]}"/>
                    <feFuncB type="table" tableValues="${dark[2]} ${primary[2]} ${bright[2]}"/>
                    <feFuncA type="linear" slope="0" intercept="1"/>
                </feComponentTransfer>
            </filter>
            <filter id="mottling">
                <feTurbulence type="turbulence" baseFrequency=".022 .035" numOctaves="3" seed="${seed + 982}"/>
                <feColorMatrix type="saturate" values="0"/>
            </filter>
            <filter id="activity" x="-60%" y="-60%" width="220%" height="220%">
                <feTurbulence type="fractalNoise" baseFrequency=".15" numOctaves="2" seed="${seed + 117}" result="noise"/>
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G"/>
                <feGaussianBlur stdDeviation=".25"/>
            </filter>
        </defs>
        <rect width="512" height="512" fill="${palette.color}"/>
        <rect width="512" height="512" filter="url(#granulation)" opacity="${finish === "smooth" ? ".42" : ".95"}"/>
        <rect width="512" height="512" filter="url(#mottling)" opacity="${finish === "smooth" ? ".045" : ".15"}" style="mix-blend-mode:soft-light"/>
        ${filaments}${spots}
    </svg>`;

    if (textureCache.size >= textureCacheLimit) {
        const oldest = textureCache.keys().next().value;
        if (oldest !== undefined) textureCache.delete(oldest);
    }
    textureCache.set(key, svg);
    return svg;
}
