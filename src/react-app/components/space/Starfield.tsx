import { useEffect, useRef } from "react";
import { drawStarfield } from "../../utils/starfield";
import { usePlanetProjection } from "./PlanetProjection";
import type { DeepSkyImage } from "../../data/deepSky";
import { prepareDeepSky, paintDeepSky } from "../../utils/deepSky";

const maxPixelCount = 8_388_608;

export default function Starfield({ revision, maxClusterDiameter, objects, desktop }: { revision: number; maxClusterDiameter: number; objects: DeepSkyImage[]; desktop: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const renderer = usePlanetProjection()?.renderer;

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d", { alpha: false });
        if (!canvas || !context) return;

        let frame = 0;
        let previousSize = "";
        let images: HTMLCanvasElement[]=[];
        let active=true;
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
            const twinkles = drawStarfield(context, width, height, 1871 + revision, maxClusterDiameter,
                ()=>paintDeepSky(context,width,height,1871+revision,images,desktop));
            renderer?.setStarfield(twinkles);
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
        void Promise.allSettled(objects.map(prepareDeepSky)).then(results=>{
            if(!active)return;
            images=results.flatMap(result=>result.status==="fulfilled"?[result.value]:[]);
            previousSize="";scheduleDraw();
        });

        return () => {
            active=false;
            observer.disconnect();
            window.removeEventListener("resize", scheduleDraw);
            resolution.removeEventListener("change", resolutionChanged);
            cancelAnimationFrame(frame);
            renderer?.setStarfield([]);
            // Release the backing store immediately when switching back to Simple Mode.
            canvas.width = 0;
            canvas.height = 0;
        };
    }, [revision, renderer, maxClusterDiameter, objects, desktop]);

    return <canvas ref={canvasRef} className="space-starfield" aria-hidden="true" />;
}
