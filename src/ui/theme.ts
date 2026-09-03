/**
 * Editor themes for CodeMirror 6: Console Dark (the default) and Solarized
 * Light (the alternate, for a light colour scheme).
 *
 * Hand-rolled rather than pulled in as a dependency: it is a colour table and
 * a dozen selectors, and having it here means the mobile work in phase 3 can
 * tune sizing and touch behaviour without fighting someone else's theme.
 *
 * Palette by Ethan Schoonover - https://ethanschoonover.com/solarized/
 */
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";

/*
 * Solarized Light, with the accents darkened.
 *
 * The canonical palette does not clear WCAG AA on its own #fdf6e3 background -
 * its comment grey manages 2.3:1 and most accents sit around 3:1. These are the
 * same hues, taken down to at least 4.5:1.
 */
const base01 = "#586e75";
const base2 = "#eee8d5";
const base3 = "#fdf6e3";
const gutterFg = "#5f6e6e";
const yellow = "#7a5c00";
const orange = "#9c4210";
const red = "#b02725";
const magenta = "#a3255f";
const violet = "#4c50a0";
const blue = "#1a6ea8";
const cyan = "#1a6f6a";
const green = "#5f7000";

export const solarizedLightTheme = EditorView.theme(
    {
        "&": {
            color: base01,
            backgroundColor: base3,
            fontSize: "14px",
        },
        ".cm-content": {
            caretColor: base01,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        },
        ".cm-cursor, .cm-dropCursor": { borderLeftColor: base01 },
        "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
            backgroundColor: base2,
        },
        ".cm-activeLine": { backgroundColor: "#eee8d580" },
        ".cm-gutters": {
            backgroundColor: base3,
            color: gutterFg,
            border: "none",
            borderRight: `1px solid ${base2}`,
        },
        ".cm-activeLineGutter": { backgroundColor: base2, color: base01 },
        ".cm-foldPlaceholder": { backgroundColor: "transparent", border: "none", color: base01 },
        ".cm-matchingBracket, .cm-nonmatchingBracket": {
            backgroundColor: base2,
            outline: `1px solid ${gutterFg}`,
        },
        ".cm-tooltip": { backgroundColor: base2, border: `1px solid ${gutterFg}` },
        ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
            backgroundColor: base3,
            color: base01,
        },
    },
    { dark: false },
);

const solarizedLightHighlight = HighlightStyle.define([
    { tag: t.keyword, color: green },
    { tag: [t.name, t.deleted, t.character, t.macroName], color: base01 },
    { tag: [t.propertyName], color: blue },
    { tag: [t.variableName], color: base01 },
    { tag: [t.function(t.variableName), t.labelName], color: blue },
    { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: yellow },
    { tag: [t.definition(t.name), t.separator], color: base01 },
    { tag: [t.className], color: yellow },
    { tag: [t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: magenta },
    { tag: [t.typeName], color: yellow },
    { tag: [t.operator, t.operatorKeyword], color: green },
    { tag: [t.string, t.processingInstruction, t.inserted], color: cyan },
    { tag: [t.regexp, t.escape, t.special(t.string)], color: orange },
    { tag: t.meta, color: base01 },
    { tag: t.comment, color: gutterFg, fontStyle: "italic" },
    { tag: t.strong, fontWeight: "bold" },
    { tag: t.emphasis, fontStyle: "italic" },
    { tag: t.link, color: violet, textDecoration: "underline" },
    { tag: t.heading, fontWeight: "bold", color: yellow },
    { tag: t.invalid, color: red },
    { tag: t.strikethrough, textDecoration: "line-through" },
]);

export const solarizedLight: Extension = [
    solarizedLightTheme,
    syntaxHighlighting(solarizedLightHighlight),
];

/* ---------------------------------------------------------------------------
 * Console Dark - the default theme, matching the app's dark palette.
 *
 * Solarized Dark's cyan-tinted background clashed with the app's cooler
 * slate, so the dark editor theme is built from the same tokens as the rest
 * of the UI: teal for strings, lime for keywords, amber for numbers, sky for
 * anything callable.
 * ------------------------------------------------------------------------- */

const consoleBg = "#0f1115";
const consoleFg = "#c9d1d9";
// 4.8:1 on the editor background; #6b7684 only managed 3.9:1.
const consoleMuted = "#7d8894";
const consoleSelection = "#22303a";
const consoleActiveLine = "#161b22";
const teal = "#2dd4bf";
const lime = "#a3e635";
const amber = "#fbbf24";
const sky = "#7dd3fc";
const rose = "#f87171";

export const consoleDarkTheme = EditorView.theme(
    {
        "&": {
            color: consoleFg,
            backgroundColor: consoleBg,
            fontSize: "14px",
        },
        ".cm-content": {
            caretColor: teal,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        },
        ".cm-cursor, .cm-dropCursor": { borderLeftColor: teal },
        "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
            backgroundColor: consoleSelection,
        },
        ".cm-activeLine": { backgroundColor: consoleActiveLine },
        ".cm-gutters": {
            backgroundColor: consoleBg,
            color: consoleMuted,
            border: "none",
        },
        ".cm-activeLineGutter": { backgroundColor: consoleActiveLine, color: consoleFg },
        ".cm-foldPlaceholder": {
            backgroundColor: "transparent",
            border: "none",
            color: consoleMuted,
        },
        ".cm-matchingBracket, .cm-nonmatchingBracket": {
            backgroundColor: consoleSelection,
            outline: `1px solid ${consoleMuted}`,
        },
        ".cm-tooltip": {
            backgroundColor: consoleActiveLine,
            border: `1px solid ${consoleSelection}`,
        },
        ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
            backgroundColor: consoleSelection,
            color: consoleFg,
        },
    },
    { dark: true },
);

const consoleDarkHighlight = HighlightStyle.define([
    { tag: t.keyword, color: lime },
    { tag: [t.operator, t.operatorKeyword], color: lime },
    { tag: [t.name, t.deleted, t.character, t.macroName], color: consoleFg },
    { tag: [t.variableName], color: consoleFg },
    { tag: [t.propertyName], color: sky },
    { tag: [t.function(t.variableName), t.labelName], color: sky },
    { tag: [t.definition(t.name), t.separator], color: consoleFg },
    { tag: [t.className, t.typeName], color: amber },
    { tag: [t.number, t.bool, t.null], color: amber },
    { tag: [t.constant(t.name), t.standard(t.name)], color: amber },
    { tag: [t.changed, t.annotation, t.modifier, t.self, t.namespace], color: amber },
    { tag: [t.string, t.processingInstruction, t.inserted], color: teal },
    { tag: [t.regexp, t.escape, t.special(t.string)], color: teal },
    { tag: t.meta, color: consoleMuted },
    { tag: t.comment, color: consoleMuted, fontStyle: "italic" },
    { tag: t.strong, fontWeight: "bold" },
    { tag: t.emphasis, fontStyle: "italic" },
    { tag: t.link, color: sky, textDecoration: "underline" },
    { tag: t.heading, fontWeight: "bold", color: amber },
    { tag: t.invalid, color: rose },
    { tag: t.strikethrough, textDecoration: "line-through" },
]);

export const consoleDark: Extension = [consoleDarkTheme, syntaxHighlighting(consoleDarkHighlight)];
