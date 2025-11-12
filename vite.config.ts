import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import viteCompression from "vite-plugin-compression";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(),

    // ✅ Automatically compress built files (Brotli + Gzip)
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 10240, // Compress files > 10KB
    }),
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 10240,
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // ✅ Fix "chunk size limit" warning
    chunkSizeWarningLimit: 2000, // 2 MB limit

    // ✅ Split libraries into smaller chunks
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

    // ✅ Use fast, safe minifier for smaller builds
    minify: "esbuild",

    // ✅ Optimize for production
    sourcemap: false,
    cssCodeSplit: true,
  },
});
