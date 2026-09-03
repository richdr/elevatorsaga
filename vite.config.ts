import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// The fork is served from https://richdr.github.io/elevatorsaga/, so production
// builds need the project-pages subpath. The dev server stays at the root.
const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command, isPreview }) => ({
    // `vite preview` serves the built output, so it needs the same base the build
    // baked into the asset URLs. Only the dev server runs at the root.
    base: command === "build" || isPreview ? "/elevatorsaga/" : "/",
    build: {
        target: "es2022",
        outDir: "dist",
        sourcemap: true,
        // The main chunk is mostly CodeMirror 6 plus the full lodash we keep for
        // player-code compatibility. Both are deliberate; 500 kB is not a useful
        // threshold here.
        chunkSizeWarningLimit: 700,
        rollupOptions: {
            input: {
                main: resolve(rootDir, "index.html"),
                documentation: resolve(rootDir, "documentation.html"),
            },
        },
    },
    worker: {
        format: "es",
    },
    test: {
        environment: "node",
        include: ["test/**/*.test.ts"],
    },
}));
