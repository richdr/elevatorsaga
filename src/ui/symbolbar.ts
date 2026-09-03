/**
 * A row of characters that are buried behind modifier layers on a phone
 * keyboard. Writing `elevator.on("idle", function() {` on a touchscreen without
 * this is genuinely unpleasant.
 */
import type { CodeEditor } from "./editor";
import { qs } from "./dom";

const SYMBOLS = ["{", "}", "(", ")", "[", "]", ".", ",", ";", ":", "=", "<", ">", "!", '"', "_"];

export const installSymbolBar = (editor: CodeEditor): void => {
    const bar = qs(".symbolbar");
    for (const symbol of SYMBOLS) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = symbol;
        button.setAttribute("aria-label", `Insert ${symbol}`);
        // Insert on pointerdown and suppress the default, so the keyboard never
        // gets a chance to dismiss itself between tap and insert.
        button.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            editor.insertText(symbol);
        });
        bar.append(button);
    }
};
