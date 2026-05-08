import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ["**/*.mind"],
  optimizeDeps: {
    exclude: ["three", "mindar-image-three"], // Vite không pre-bundle
  },
  build: {
    rollupOptions: {
      external: ["three"],
    },
  },
});
