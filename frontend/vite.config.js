import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      include: ["stream", "util"],
    }),
  ],

  define: {
    global: "window",
  },

  server: {
    headers: {
      // Cho phép Firebase Auth popup giao tiếp với cửa sổ cha
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    },
    proxy: {
      "/uploads": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
});
