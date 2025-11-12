import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    // ✅ React plugin enables JSX/TSX + Fast Refresh + SWC compilation
    react(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // ✅ Fix "chunk size limit" warning from Vercel
    chunkSizeWarningLimit: 2000, // 2 MB limit

    // ✅ Split large libraries into smaller chunks (improves caching + load)
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

    // ✅ Fast, safe minification
    minify: "esbuild",

    // ✅ Optimized output settings
    sourcemap: false,
    cssCodeSplit: true,
  },
});
