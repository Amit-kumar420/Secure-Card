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
    // ✅ Silences the chunk warning completely
    chunkSizeWarningLimit: 6000, // 6 MB threshold (safe for large apps)

    // ✅ Optional safe Rollup optimization (keeps chunks smaller)
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

    // ✅ Optimize for production (no side effects)
    minify: "esbuild",
    sourcemap: false,
    cssCodeSplit: true,
  },
});
