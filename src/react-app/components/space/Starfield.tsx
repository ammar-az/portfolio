import { useEffect, useRef } from "react";
import { drawStarfield } from "../../utils/starfield";

const maxPixelCount = 8_388_608;

export default function Starfield({ revision }: { revision: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d", { alpha: false });
        if (!canvas || !context) return;

        let frame = 0;
        let previousSize = "";
        let resolution: MediaQueryList;

        function draw() {
            frame = 0;
            if (!canvas || !context) return;
            const { width, height } = canvas.getBoundingClientRect();
            if (width <= 0 || height <= 0) return;
            // Bound backing-store memory on large/high-DPI displays without moving stars.
            const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(maxPixelCount / (width * height)));
            const size = `${width}:${height}:${ratio}`;
            if (size === previousSize) return;
            previousSize = size;
            canvas.width = Math.max(1, Math.floor(width * ratio));
            canvas.height = Math.max(1, Math.floor(height * ratio));
            context.setTransform(canvas.width / width, 0, 0, canvas.height / height, 0, 0);
            drawStarfield(context, width, height, 1871 + revision);
        }

        function scheduleDraw() {
            if (!frame) frame = requestAnimationFrame(draw);
        }

        function watchResolution() {
            resolution?.removeEventListener("change", resolutionChanged);
            resolution = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
            resolution.addEventListener("change", resolutionChanged);
        }

        function resolutionChanged() {
            watchResolution();
            scheduleDraw();
        }

        const observer = new ResizeObserver(scheduleDraw);
        observer.observe(canvas);
        window.addEventListener("resize", scheduleDraw);
        watchResolution();
        draw();

        return () => {
            observer.disconnect();
            window.removeEventListener("resize", scheduleDraw);
            resolution.removeEventListener("change", resolutionChanged);
            cancelAnimationFrame(frame);
            // Release the backing store immediately when switching back to Simple Mode.
            canvas.width = 0;
            canvas.height = 0;
        };
    }, [revision]);

    return <canvas ref={canvasRef} className="space-starfield" aria-hidden="true" />;
}
