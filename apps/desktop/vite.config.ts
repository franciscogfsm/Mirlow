import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Tauri expects a fixed port and reads the dev server's output itself. The
// port is above 5000 because Windows with Hyper-V or WSL reserves blocks of
// lower ports (1420, Tauri's usual choice, is often among them).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    host: "127.0.0.1",
    port: 5183,
    strictPort: true,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  build: {
    target: "chrome111",
    outDir: "dist",
    emptyOutDir: true,
  },
});
