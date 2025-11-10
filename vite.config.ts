import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // ✅ Increase warning limit to avoid chunk size warnings
    chunkSizeWarningLimit: 1200,

    // ✅ Minify the code for smaller bundle size
    minify: "esbuild",

    // ✅ Optional: optimize Rollup output
    rollupOptions: {
      output: {
        manualChunks: {
          // Splits vendor libraries into separate chunks
          vendor: ["react", "react-dom"],
        },
      },
    },
  },
});
