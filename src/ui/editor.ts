/**
 * The code editor pane. CodeMirror 6 replaces the original's CodeMirror 5:
 * CM5 is unmaintained, and its handling of touch input and on-screen
 * keyboards is poor, which matters for the mobile work.
 */
import { EditorState, type Extension } from "@codemirror/state";
import { EditorView, keymap, lineNumbers, highlightActiveLine } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { bracketMatching, indentOnInput, indentUnit } from "@codemirror/language";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { Observable } from "../game/observable";
import { getCodeObjFromCode, type UserCodeObject } from "../game/usercode";
import { DEFAULT_CODE, DEVTEST_CODE } from "./default-code";
import { solarizedLight } from "./theme";

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

    constructor(parent: HTMLElement, extraExtensions: Extension[] = []) {
        super();

        const autoSave = debounce(() => this.save(), 1000);

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
                    solarizedLight,
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
