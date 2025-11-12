import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: "./", // ✅ ensures correct asset paths on Vercel
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(), // ✅ required for React + Fast Refresh
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    chunkSizeWarningLimit: 2000, // ✅ removes Vercel chunk warnings
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .toString();
          }
        },
      },
    },
    minify: "esbuild",
    sourcemap: false,
    cssCodeSplit: true,
  },
});