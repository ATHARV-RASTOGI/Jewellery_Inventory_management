import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // or @vitejs/plugin-react depending on what you have
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    host: "::",
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});