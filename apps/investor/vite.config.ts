import { createVendorChunks } from "../../packages/config/vendor-chunks";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
 build: { rollupOptions: { output: { manualChunks: createVendorChunks(), onlyExplicitManualChunks: true } } },
  plugins: [react(), TanStackRouterVite(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { port: 3011 },
});
