/**
 * Solarized Light and Dark for CodeMirror 6.
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

const base03 = "#002b36";
const base02 = "#073642";
const base01 = "#586e75";
const base00 = "#657b83";
const base1 = "#93a1a1";
const base0 = "#839496";
const base2 = "#eee8d5";
const base3 = "#fdf6e3";
const yellow = "#b58900";
const orange = "#cb4b16";
const red = "#dc322f";
const magenta = "#d33682";
const violet = "#6c71c4";
const blue = "#268bd2";
const cyan = "#2aa198";
const green = "#859900";

export const solarizedLightTheme = EditorView.theme(
    {
        "&": {
            color: base00,
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
            color: base1,
            border: "none",
            borderRight: `1px solid ${base2}`,
        },
        ".cm-activeLineGutter": { backgroundColor: base2, color: base01 },
        ".cm-foldPlaceholder": { backgroundColor: "transparent", border: "none", color: base00 },
        ".cm-matchingBracket, .cm-nonmatchingBracket": {
            backgroundColor: base2,
            outline: `1px solid ${base1}`,
        },
        ".cm-tooltip": { backgroundColor: base2, border: `1px solid ${base1}` },
        ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
            backgroundColor: base3,
            color: base01,
        },
    },
    { dark: false },
);

const solarizedLightHighlight = HighlightStyle.define([
    { tag: t.keyword, color: green },
    { tag: [t.name, t.deleted, t.character, t.macroName], color: base00 },
    { tag: [t.propertyName], color: blue },
    { tag: [t.variableName], color: base01 },
    { tag: [t.function(t.variableName), t.labelName], color: blue },
    { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: yellow },
    { tag: [t.definition(t.name), t.separator], color: base00 },
    { tag: [t.className], color: yellow },
    { tag: [t.number, t.changed, t.annotation, t.modifier, t.self, t.namespace], color: magenta },
    { tag: [t.typeName], color: yellow },
    { tag: [t.operator, t.operatorKeyword], color: green },
    { tag: [t.string, t.processingInstruction, t.inserted], color: cyan },
    { tag: [t.regexp, t.escape, t.special(t.string)], color: orange },
    { tag: t.meta, color: base01 },
    { tag: t.comment, color: base1, fontStyle: "italic" },
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

export const solarizedDarkTheme = EditorView.theme(
    {
        "&": {
            color: base0,
            backgroundColor: base03,
            fontSize: "14px",
        },
        ".cm-content": {
            caretColor: base1,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
        },
        ".cm-cursor, .cm-dropCursor": { borderLeftColor: base1 },
        "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
            backgroundColor: base02,
        },
        ".cm-activeLine": { backgroundColor: "#07364280" },
        ".cm-gutters": {
            backgroundColor: base03,
            color: base01,
            border: "none",
            borderRight: `1px solid ${base02}`,
        },
        ".cm-activeLineGutter": { backgroundColor: base02, color: base1 },
        ".cm-foldPlaceholder": { backgroundColor: "transparent", border: "none", color: base0 },
        ".cm-matchingBracket, .cm-nonmatchingBracket": {
            backgroundColor: base02,
            outline: `1px solid ${base01}`,
        },
        ".cm-tooltip": { backgroundColor: base02, border: `1px solid ${base01}` },
        ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
            backgroundColor: base03,
            color: base1,
        },
    },
    { dark: true },
);

/**
 * The same highlight rules serve both themes: Solarized's accent colours are
 * chosen to sit legibly on either background, which is the point of it.
 */
export const solarizedDark: Extension = [
    solarizedDarkTheme,
    syntaxHighlighting(solarizedLightHighlight),
];
