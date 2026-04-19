import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided.",
  );
}

const routeToHtml: Record<string, string> = {
  "/about": "/about.html",
  "/achievements": "/achievements.html",
  "/matcherino": "/matcherino.html",
  "/join": "/join.html",
  "/rules": "/rules.html",
  "/terms": "/terms.html",
  "/privacy": "/privacy.html",
  "/players-login": "/players-login.html",
  "/meonix": "/meonix.html",
  "/staff": "/staff.html",
};

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    {
      name: "per-page-html",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = (req.url || "/").split("?")[0];
          const stripped = url.replace(/^\/(fr|es|de|pt)(\/|$)/, "/").replace(/\/$/, "") || "/";
          // /roster and /roster/:username all serve roster.html
          if (stripped === "/roster" || stripped.startsWith("/roster/")) {
            req.url = "/roster.html";
            next();
            return;
          }
          const target = routeToHtml[stripped];
          if (target) req.url = target;
          next();
        });
      },
    },
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(import.meta.dirname, "index.html"),
        about: path.resolve(import.meta.dirname, "about.html"),
        achievements: path.resolve(import.meta.dirname, "achievements.html"),
        matcherino: path.resolve(import.meta.dirname, "matcherino.html"),
        roster: path.resolve(import.meta.dirname, "roster.html"),
        join: path.resolve(import.meta.dirname, "join.html"),
        rules: path.resolve(import.meta.dirname, "rules.html"),
        terms: path.resolve(import.meta.dirname, "terms.html"),
        privacy: path.resolve(import.meta.dirname, "privacy.html"),
        playersLogin: path.resolve(import.meta.dirname, "players-login.html"),
        meonix: path.resolve(import.meta.dirname, "meonix.html"),
        staff: path.resolve(import.meta.dirname, "staff.html"),
      },
    },
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
