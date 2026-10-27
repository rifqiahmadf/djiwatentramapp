import { modularTensorflowCore } from "../../packages/config/tensorflow-core";
import { createVendorChunks } from "../../packages/config/vendor-chunks";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vite";
import { karyawanPwaSettings } from "./src/pwa-settings";

export default defineConfig({
 build: { rollupOptions: { output: { manualChunks: createVendorChunks(), onlyExplicitManualChunks: true } } },
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: karyawanPwaSettings.name,
        short_name: karyawanPwaSettings.short_name,
        description: karyawanPwaSettings.description,
        theme_color: karyawanPwaSettings.theme_color,
        background_color: karyawanPwaSettings.background_color,
        display: "standalone",
        start_url: karyawanPwaSettings.start_url,
        scope: "/",
        orientation: karyawanPwaSettings.orientation,
        icons: [
          {
            src: karyawanPwaSettings.icon192,
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: karyawanPwaSettings.icon512,
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,png,svg,gif,ico,webmanifest}"],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@tensorflow/tfjs-core": modularTensorflowCore(__dirname),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
