import { defineConfig } from "vite";

// The fork is served from https://richdr.github.io/elevatorsaga/, so production
// builds need the project-pages subpath. Dev and preview stay at the root.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/elevatorsaga/" : "/",
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: true,
  },
  worker: {
    format: "es",
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
}));
