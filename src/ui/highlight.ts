/**
 * Syntax highlighting for the documentation's code samples.
 *
 * Loaded on demand: the help sheet is opened rarely, and there is no reason for
 * highlight.js to be in the critical path of a game that starts paused. The
 * token colours live in style.css, so they theme with everything else.
 */
export const highlightWithin = async (root: ParentNode): Promise<void> => {
    const blocks = root.querySelectorAll<HTMLElement>("pre code:not(.hljs)");
    if (blocks.length === 0) {
        return;
    }
    const [{ default: hljs }, { default: javascript }] = await Promise.all([
        import("highlight.js/lib/core"),
        import("highlight.js/lib/languages/javascript"),
    ]);
    hljs.registerLanguage("javascript", javascript);
    for (const block of blocks) {
        hljs.highlightElement(block);
    }
};
