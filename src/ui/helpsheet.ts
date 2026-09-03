/**
 * In-app help, as a slide-over sheet.
 *
 * On a phone, sending someone to a separate documentation page means losing the
 * game state they were looking at and a fiddly trip back. The sheet keeps the
 * API reference one tap away; documentation.html still exists and renders the
 * same content, for deep links and for sharing.
 */
import { qs } from "./dom";
import { DOCS_HTML } from "./docs-content";
import { highlightWithin } from "./highlight";

export const installHelpSheet = (): void => {
    const sheet = qs<HTMLDialogElement>("#help_sheet");
    const body = qs("#help_body");
    let loaded = false;

    const open = () => {
        if (!loaded) {
            body.innerHTML = DOCS_HTML;
            loaded = true;
            void highlightWithin(body);
        }
        sheet.showModal();
    };

    qs("#button_help").addEventListener("click", open);
    qs("#help_close").addEventListener("click", () => sheet.close());

    // Clicking the backdrop, which is outside the dialog's own box, closes it.
    sheet.addEventListener("click", (e) => {
        if (e.target === sheet) {
            sheet.close();
        }
    });
};
