import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CONSOLE_DARK, SOLARIZED_LIGHT, type Palette } from "../src/ui/palette";

/**
 * The editor gets its colours from `palette.ts`; the building gets the same
 * colours from custom properties in `style.css`, because CSS cannot import a
 * TypeScript module. That duplication is the only copy in the codebase, and
 * this test is what stops it drifting.
 */
const css = readFileSync(
    fileURLToPath(new URL("../src/styles/style.css", import.meta.url)),
    "utf8",
);

/** Custom-property name for each palette key, e.g. `activeLine` → `--syn-active-line`. */
const cssName = (key: keyof Palette): string =>
    "--syn-" + key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

/**
 * Reads the `--syn-*` declarations from one `:root` block. `which` selects
 * which block: the first is the default (dark), the second is inside the
 * light-scheme media query.
 */
const readTokens = (which: number): Record<string, string> => {
    const blocks = [...css.matchAll(/:root\s*\{([^}]*)\}/g)].map((m) => m[1]);
    const bodies = blocks.filter((b) => b.includes("--syn-"));
    const body = bodies[which];
    expect(
        body,
        `expected at least ${which + 1} :root blocks declaring --syn-* tokens`,
    ).toBeDefined();
    const tokens: Record<string, string> = {};
    for (const [, name, value] of body.matchAll(/(--syn-[\w-]+)\s*:\s*([^;]+);/g)) {
        tokens[name] = value.trim();
    }
    return tokens;
};

describe.each([
    ["dark (CONSOLE_DARK)", CONSOLE_DARK, 0],
    ["light (SOLARIZED_LIGHT)", SOLARIZED_LIGHT, 1],
] as const)("%s palette is mirrored into style.css", (_label, palette, blockIndex) => {
    const tokens = readTokens(blockIndex);

    it.each(Object.keys(palette) as (keyof Palette)[])("%s matches", (key) => {
        expect(tokens[cssName(key)]).toBe(palette[key]);
    });

    it("declares no --syn-* tokens the palette does not define", () => {
        const expected = new Set(Object.keys(palette).map((k) => cssName(k as keyof Palette)));
        expect(Object.keys(tokens).filter((name) => !expected.has(name))).toEqual([]);
    });
});

describe("the building is coloured from the palette", () => {
    /**
     * Every world colour should be derived, not hardcoded - that is the whole
     * point of the shared palette. A literal hex in one of these would be a
     * colour that silently ignores the colour scheme.
     */
    const WORLD_TOKENS = [
        "--world-bg",
        "--world-line",
        "--floor-tint-a",
        "--floor-tint-b",
        "--floor-tint-c",
        "--floor-number",
        "--indicator-idle",
        "--indicator-active",
        "--elevator-bg",
        "--elevator-border",
        "--elevator-ink",
        "--elevator-button",
        "--user-color",
        "--user-waiting",
        "--user-late",
        "--stats-text",
        "--stats-value",
        "--stats-line",
        "--stats-border",
    ];

    it.each(WORLD_TOKENS)("%s is derived from a --syn-* token", (name) => {
        const match = css.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
        expect(match, `${name} is not declared`).not.toBeNull();
        expect(match![1]).toContain("var(--syn-");
    });
});
