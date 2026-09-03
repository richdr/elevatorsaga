/**
 * CodeMirror 6 themes, generated from the shared syntax palette.
 *
 * Hand-rolled rather than pulled in as a dependency: it is a colour table and
 * a dozen selectors, and having it here means the mobile work can tune sizing
 * and touch behaviour without fighting someone else's theme. Both themes come
 * out of one factory, so the two schemes cannot drift apart in structure.
 *
 * The same palette colours the building — see `palette.ts`.
 */
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";
import { CONSOLE_DARK, SOLARIZED_LIGHT, type Palette } from "./palette";

const editorTheme = (p: Palette, dark: boolean): Extension =>
    EditorView.theme(
        {
            "&": {
                color: p.fg,
                backgroundColor: p.bg,
                fontSize: "14px",
            },
            ".cm-content": {
                caretColor: p.string,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
            },
            ".cm-cursor, .cm-dropCursor": { borderLeftColor: p.string },
            "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
                {
                    backgroundColor: p.selection,
                },
            ".cm-activeLine": { backgroundColor: p.activeLine },
            ".cm-gutters": {
                backgroundColor: p.bg,
                color: p.muted,
                border: "none",
            },
            ".cm-activeLineGutter": { backgroundColor: p.activeLine, color: p.fg },
            ".cm-foldPlaceholder": {
                backgroundColor: "transparent",
                border: "none",
                color: p.muted,
            },
            ".cm-matchingBracket, .cm-nonmatchingBracket": {
                backgroundColor: p.selection,
                outline: `1px solid ${p.muted}`,
            },
            ".cm-tooltip": {
                backgroundColor: p.activeLine,
                border: `1px solid ${p.selection}`,
            },
            ".cm-tooltip-autocomplete > ul > li[aria-selected]": {
                backgroundColor: p.selection,
                color: p.fg,
            },
        },
        { dark },
    );

const highlightStyle = (p: Palette): Extension =>
    syntaxHighlighting(
        HighlightStyle.define([
            { tag: t.keyword, color: p.keyword },
            { tag: [t.operator, t.operatorKeyword], color: p.keyword },
            { tag: [t.name, t.deleted, t.character, t.macroName], color: p.fg },
            { tag: [t.variableName], color: p.fg },
            { tag: [t.propertyName], color: p.callable },
            { tag: [t.function(t.variableName), t.labelName], color: p.callable },
            { tag: [t.definition(t.name), t.separator], color: p.fg },
            { tag: [t.className, t.typeName], color: p.type },
            { tag: [t.number, t.bool, t.null], color: p.number },
            { tag: [t.constant(t.name), t.standard(t.name)], color: p.type },
            { tag: [t.changed, t.annotation, t.modifier, t.self, t.namespace], color: p.type },
            { tag: [t.string, t.processingInstruction, t.inserted], color: p.string },
            { tag: [t.regexp, t.escape, t.special(t.string)], color: p.special },
            { tag: t.meta, color: p.muted },
            { tag: t.comment, color: p.muted, fontStyle: "italic" },
            { tag: t.strong, fontWeight: "bold" },
            { tag: t.emphasis, fontStyle: "italic" },
            { tag: t.link, color: p.callable, textDecoration: "underline" },
            { tag: t.heading, fontWeight: "bold", color: p.type },
            { tag: t.invalid, color: p.invalid },
            { tag: t.strikethrough, textDecoration: "line-through" },
        ]),
    );

export const consoleDark: Extension = [
    editorTheme(CONSOLE_DARK, true),
    highlightStyle(CONSOLE_DARK),
];

export const solarizedLight: Extension = [
    editorTheme(SOLARIZED_LIGHT, false),
    highlightStyle(SOLARIZED_LIGHT),
];
