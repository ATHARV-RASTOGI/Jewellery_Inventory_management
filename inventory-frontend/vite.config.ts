import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // or @vitejs/plugin-react depending on what you have
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    host: "::",
    port: 5173,
    proxy: {
      // This is the magic bridge!
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // Make sure there is NO 'rewrite' line here, because your 
        // Java backend expects the "/api" part in the URL!
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