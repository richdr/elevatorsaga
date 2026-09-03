/**
 * The code editor pane. CodeMirror 6 replaces the original's CodeMirror 5:
 * CM5 is unmaintained, and its handling of touch input and on-screen
 * keyboards is poor, which matters for the mobile work.
 */
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { bracketMatching, indentOnInput, indentUnit } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { Observable } from "../game/observable";
import { getCodeObjFromCode, type UserCodeObject } from "../game/usercode";
import { DEFAULT_CODE, DEVTEST_CODE } from "./default-code";
import { consoleDark, solarizedLight } from "./theme";

/**
 * Unchanged from the original on purpose: a player who has a solution in
 * progress on play.elevatorsaga.com keeps it when they open this fork.
 */
const STORAGE_KEY = "elevatorCrushCode_v5";
const BACKUP_KEY = "develevateBackupCode";

export type EditorEvents = {
    change: [];
    saved: [at: Date];
    apply_code: [];
    code_success: [];
    usercode_error: [error: unknown];
};

const debounce = (fn: () => void, wait: number): (() => void) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    return () => {
        clearTimeout(timer);
        timer = setTimeout(fn, wait);
    };
};

export class CodeEditor extends Observable<EditorEvents> {
    private readonly view: EditorView;
    private readonly themeCompartment = new Compartment();

    constructor(parent: HTMLElement, extraExtensions: Extension[] = []) {
        super();

        const autoSave = debounce(() => this.save(), 1000);
        // Dark is the default; a light colour scheme is the opt-out.
        const lightMode = window.matchMedia("(prefers-color-scheme: light)");

        this.view = new EditorView({
            parent,
            state: EditorState.create({
                doc: localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CODE,
                extensions: [
                    lineNumbers(),
                    history(),
                    indentOnInput(),
                    indentUnit.of("    "),
                    bracketMatching(),
                    closeBrackets(),
                    highlightActiveLine(),
                    javascript(),
                    // Wrapping matters more than column discipline on a phone,
                    // where there is no room to scroll sideways comfortably.
                    EditorView.lineWrapping,
                    // The content div is a role="textbox" and needs a name.
                    // Tab indents rather than moving focus, so the escape
                    // mechanism is named here where a screen reader will read it.
                    EditorView.contentAttributes.of({
                        "aria-label":
                            "Your elevator program. Press Escape then Tab to move focus out of the editor.",
                    }),
                    this.themeCompartment.of(lightMode.matches ? solarizedLight : consoleDark),
                    keymap.of([
                        ...closeBracketsKeymap,
                        ...defaultKeymap,
                        ...historyKeymap,
                        indentWithTab,
                    ]),
                    EditorView.updateListener.of((update) => {
                        if (update.docChanged) {
                            autoSave();
                        }
                    }),
                    ...extraExtensions,
                ],
            }),
        });

        lightMode.addEventListener("change", (e) => {
            this.view.dispatch({
                effects: this.themeCompartment.reconfigure(
                    e.matches ? solarizedLight : consoleDark,
                ),
            });
        });
    }

    /** Inserts text at the cursor and keeps focus, for the mobile symbol bar. */
    insertText(text: string): void {
        const { from, to } = this.view.state.selection.main;
        this.view.dispatch({
            changes: { from, to, insert: text },
            selection: { anchor: from + text.length },
            scrollIntoView: true,
        });
        this.view.focus();
    }

    getCode(): string {
        return this.view.state.doc.toString();
    }

    setCode(code: string): void {
        this.view.dispatch({
            changes: { from: 0, to: this.view.state.doc.length, insert: code },
        });
    }

    focus(): void {
        this.view.focus();
    }

    save(): void {
        localStorage.setItem(STORAGE_KEY, this.getCode());
        this.trigger("saved", new Date());
        this.trigger("change");
    }

    reset(): void {
        localStorage.setItem(BACKUP_KEY, this.getCode());
        this.setCode(DEFAULT_CODE);
    }

    undoReset(): void {
        this.setCode(localStorage.getItem(BACKUP_KEY) ?? "");
    }

    setDevTestCode(): void {
        this.setCode(DEVTEST_CODE);
    }

    /** Compiles the current code, reporting failures through `usercode_error`. */
    getCodeObj(): UserCodeObject | null {
        try {
            const obj = getCodeObjFromCode(this.getCode());
            this.trigger("code_success");
            return obj;
        } catch (e) {
            this.trigger("usercode_error", e);
            return null;
        }
    }
}
