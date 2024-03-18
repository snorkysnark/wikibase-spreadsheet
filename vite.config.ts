import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../server/dist",
    emptyOutDir: true,
  },

  resolve: {
    alias: {
      src: path.resolve("src/"),
    },
  },
});
