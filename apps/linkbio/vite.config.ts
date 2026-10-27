import { createVendorChunks } from "../../packages/config/vendor-chunks";
import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: { rollupOptions: { output: { manualChunks: createVendorChunks(), onlyExplicitManualChunks: true } },
    target: "es2020",
  },
  server: { port: 3004 },
});
