import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import svgr from "vite-plugin-svgr";

export default defineConfig({
	plugins: [react(), cloudflare(), svgr()],
});
