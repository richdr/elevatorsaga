import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Guards on the coupling between the markup in `templates.ts` and the rules in
 * `style.css` — the kind of mistake that type-checks, renders, and is only
 * visible if you happen to look at the right screen.
 */
const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

const templates = read("../src/ui/templates.ts");
const css = read("../src/styles/style.css");

describe("the challenge-complete overlay", () => {
    /**
     * `.feedback .emphasis-color` has specificity (0,2,0) and `.feedback a`
     * (0,1,1), so a link carrying `emphasis-color` silently takes the emphasis
     * colour instead of its own button ink. That shipped once: the "Next
     * challenge" button rendered lime on teal, at 1.23:1.
     */
    it("styles the next-challenge link as a button, not as emphasised text", () => {
        const anchor = templates.match(/<a href="\$\{escapeHtml\(url\)\}"[^>]*>/)?.[0];
        expect(anchor, "expected a next-challenge anchor in renderFeedback").toBeDefined();
        expect(anchor).toContain('class="feedback_next"');
        expect(anchor).not.toContain("emphasis-color");
    });

    it("gives that link both an ink and a fill, so it cannot inherit a mismatched pair", () => {
        const rule = css.match(/\.feedback a \{([^}]*)\}/)?.[1];
        expect(rule, "expected a `.feedback a` rule").toBeDefined();
        expect(rule).toMatch(/(^|\s)color:\s*var\(--accent-ink\)/m);
        expect(rule).toMatch(/background-color:\s*var\(--accent\)/);
    });
});
