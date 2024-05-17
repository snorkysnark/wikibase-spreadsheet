import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Develompent only: load port numbers directly from docker .env
  const dockerEnv = loadEnv(mode, path.join(process.cwd(), "docker"), "");
  process.env = {
    ...process.env,
    VITE_WIKIBASE_PORT: dockerEnv.WIKIBASE_PORT,
    VITE_WDQS_FRONTEND_PORT: dockerEnv.WDQS_FRONTEND_PORT,
  };

  return {
    server: {
      port: 5173,
    },
    plugins: [
      react({
        jsxImportSource: "@emotion/react",
        plugins: [["@swc/plugin-emotion", {}]],
      }),
    ],
    build: {
      outDir: "../server/dist",
      emptyOutDir: true,
    },

    resolve: {
      alias: {
        src: path.resolve("src/"),
      },
    },
  };
});
