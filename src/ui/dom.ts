/** Tiny DOM helpers, replacing the jQuery the original leaned on. */

/** Parses a trusted HTML string into a single element. */
export const html = <T extends Element = HTMLElement>(markup: string): T => {
    const template = document.createElement("template");
    template.innerHTML = markup.trim();
    return template.content.firstElementChild as T;
};

export const qs = <T extends Element = HTMLElement>(
    selector: string,
    root: ParentNode = document,
): T => {
    const el = root.querySelector<T>(selector);
    if (!el) {
        throw new Error(`Expected an element matching "${selector}"`);
    }
    return el;
};

export const qsa = <T extends Element = HTMLElement>(
    selector: string,
    root: ParentNode = document,
): T[] => Array.from(root.querySelectorAll<T>(selector));

export const clear = (...elements: Element[]): void => {
    for (const el of elements) {
        el.replaceChildren();
    }
};

export const setTransformPos = (elem: HTMLElement, x: number, y: number): void => {
    elem.style.transform = `translate(${x}px,${y}px) translateZ(0)`;
};

/** Escapes text for interpolation into a trusted HTML template. */
export const escapeHtml = (value: unknown): string =>
    String(value ?? "").replace(
        /[&<>"']/g,
        (c) =>
            ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
    );
