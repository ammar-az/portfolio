const tileSize = 512;
const starsPerTile = 144;
const starColors = ["216, 229, 255", "187, 211, 255", "235, 237, 255", "255, 225, 196"];

function tileRandom(column: number, row: number, seed: number) {
    let state = Math.imul(column + 1, 73856093) ^ Math.imul(row + 1, 19349663) ^ seed;
    return () => {
        state = (state + 0x6d2b79f5) | 0;
        let value = Math.imul(state ^ state >>> 15, 1 | state);
        value ^= value + Math.imul(value ^ value >>> 7, 61 | value);
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
}

/** CSS-pixel world coordinates keep existing stars fixed when the viewport grows. */
export function drawStarfield(context: CanvasRenderingContext2D, width: number, height: number, seed: number) {
    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);

    for (let row = 0; row <= Math.floor(height / tileSize); row++) {
        for (let column = 0; column <= Math.floor(width / tileSize); column++) {
            const random = tileRandom(column, row, seed);
            for (let index = 0; index < starsPerTile; index++) {
                const x = column * tileSize + random() * tileSize;
                const y = row * tileSize + random() * tileSize;
                const prominence = random();
                const bright = prominence > 0.975;
                const radius = bright ? 0.95 + random() * 0.5 : 0.25 + random() ** 2 * 0.65;
                const opacity = bright ? 0.75 + random() * 0.2 : 0.15 + random() ** 2 * 0.45;
                const tint = random();
                const color = starColors[tint < 0.6 ? 0 : tint < 0.82 ? 1 : tint < 0.93 ? 2 : 3];
                if (x > width + 8 || y > height + 8) continue;

                if (bright) {
                    const halo = context.createRadialGradient(x, y, 0, x, y, radius * 5);
                    halo.addColorStop(0, `rgba(${color}, 0.2)`);
                    halo.addColorStop(0.3, `rgba(${color}, 0.07)`);
                    halo.addColorStop(1, `rgba(${color}, 0)`);
                    context.fillStyle = halo;
                    context.fillRect(x - radius * 5, y - radius * 5, radius * 10, radius * 10);
                }

                context.fillStyle = `rgba(${color}, ${opacity})`;
                context.beginPath();
                context.arc(x, y, radius, 0, Math.PI * 2);
                context.fill();
            }
        }
    }
}
