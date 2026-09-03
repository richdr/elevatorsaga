/**
 * The syntax palette, shared by the code editor and the building.
 *
 * There is one palette per colour scheme, and both the CodeMirror themes and
 * the world's CSS derive from it — so the lift shaft is coloured by the same
 * tokens that colour the code you write to control it. Floor numbers take the
 * `number` colour, the car takes `string`, lit indicators take `keyword`.
 *
 * `style.css` mirrors these values into custom properties, because CSS cannot
 * import them. `palette.test.ts` asserts the two stay in step.
 *
 * Solarized palette by Ethan Schoonover - https://ethanschoonover.com/solarized/
 */

export interface Palette {
    /** Editor and shaft background. */
    bg: string;
    /** Default text, and the people in the building. */
    fg: string;
    /** Comments, gutter, and unlit indicators. */
    muted: string;
    /** Selection background, and the floor separators. */
    selection: string;
    /** Active line, and the floor bands. */
    activeLine: string;

    /** Keywords — and every lit indicator in the building. */
    keyword: string;
    /** Strings — and the elevator car. */
    string: string;
    /** Numbers — and the floor numbers. */
    number: string;
    /** Functions and properties. */
    callable: string;
    /** Types and constants. */
    type: string;
    /** Regular expressions and escapes. */
    special: string;
    /** Invalid code, and people who have waited too long. */
    invalid: string;
}

/**
 * Console Dark, the default. Built for this app rather than adapted: Solarized
 * Dark's cyan-tinted background clashed with the cooler slate of the chrome.
 */
export const CONSOLE_DARK: Palette = {
    bg: "#0f1115",
    fg: "#c9d1d9",
    // 4.8:1 on the background; the more obvious #6b7684 only managed 3.9:1.
    muted: "#7d8894",
    selection: "#22303a",
    activeLine: "#161b22",

    keyword: "#a3e635",
    string: "#2dd4bf",
    number: "#fbbf24",
    callable: "#7dd3fc",
    type: "#fbbf24",
    special: "#2dd4bf",
    invalid: "#f87171",
};

/**
 * Solarized Light, with the accents darkened.
 *
 * The canonical palette does not clear WCAG AA on its own #fdf6e3 background —
 * its comment grey manages 2.3:1 and most accents sit around 3:1. These are the
 * same hues, taken down to at least 4.5:1.
 */
export const SOLARIZED_LIGHT: Palette = {
    bg: "#fdf6e3",
    fg: "#586e75",
    muted: "#5f6e6e",
    selection: "#eee8d5",
    activeLine: "#f2ecda",

    keyword: "#5f7000",
    string: "#1a6f6a",
    number: "#a3255f",
    callable: "#1a6ea8",
    type: "#7a5c00",
    special: "#9c4210",
    invalid: "#b02725",
};
