import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "popup.html"),
        options: resolve(__dirname, "options.html"),
        background: resolve(__dirname, "src/background.js"),
        "content/canvas-content": resolve(__dirname, "src/canvas/content.js"),
        "canvas/sidebar": resolve(__dirname, "src/canvas/sidebar/main.jsx"),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === "background") return "background.js";
          if (chunk.name === "content/canvas-content") return "content/canvas-content.js";
          if (chunk.name === "canvas/sidebar") return "canvas/sidebar.js";
          return "assets/[name]-[hash].js";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
