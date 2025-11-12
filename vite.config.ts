import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  base: "./", // ✅ ensures correct asset paths for Vercel
  server: {
    host: "::",
    port: 8080,
  },

  plugins: [
    react(), // ✅ React support (JSX + Fast Refresh)
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    // ✅ Fix "chunk size limit" warning safely
    chunkSizeWarningLimit: 2500, // 2.5 MB limit — increase to silence warnings
  },
});
