/**
 * Inline SVG icons, extracted from the Font Awesome 4.1 webfont that the
 * original game shipped. Ten icons in a few kilobytes, instead of a 400 KB
 * icon font, and they inherit `currentColor` so they theme for free.
 *
 * Font Awesome 4.1 by Dave Gandy - http://fontawesome.io
 * Font licensed under SIL OFL 1.1, CSS under MIT.
 *
 * The glyph outlines use the font's coordinate system (1792 units per em,
 * y pointing up), so they are flipped into SVG's y-down space on render.
 */

export type IconName =
    | "arrowCircleDown"
    | "arrowCircleUp"
    | "caretRight"
    | "child"
    | "female"
    | "male"
    | "minusSquare"
    | "plusSquare"
    | "repeat"
    | "warning";

interface Glyph {
    advance: number;
    path: string;
}

const GLYPHS: Record<IconName, Glyph> = {
    arrowCircleDown: {
        advance: 1536,
        path: "M0 640q0 209 103 385.5t279.5 279.5t385.5 103t385.5 -103t279.5 -279.5t103 -385.5t-103 -385.5t-279.5 -279.5t-385.5 -103t-385.5 103t-279.5 279.5t-103 385.5zM252 639q0 -27 18 -45l362 -362l91 -91q18 -18 45 -18t45 18l91 91l362 362q18 18 18 45t-18 45l-91 91 q-18 18 -45 18t-45 -18l-189 -189v502q0 26 -19 45t-45 19h-128q-26 0 -45 -19t-19 -45v-502l-189 189q-19 19 -45 19t-45 -19l-91 -91q-18 -18 -18 -45z",
    },
    arrowCircleUp: {
        advance: 1536,
        path: "M0 640q0 209 103 385.5t279.5 279.5t385.5 103t385.5 -103t279.5 -279.5t103 -385.5t-103 -385.5t-279.5 -279.5t-385.5 -103t-385.5 103t-279.5 279.5t-103 385.5zM252 641q0 -27 18 -45l91 -91q18 -18 45 -18t45 18l189 189v-502q0 -26 19 -45t45 -19h128q26 0 45 19 t19 45v502l189 -189q19 -19 45 -19t45 19l91 91q18 18 18 45t-18 45l-362 362l-91 91q-18 18 -45 18t-45 -18l-91 -91l-362 -362q-18 -18 -18 -45z",
    },
    caretRight: {
        advance: 640,
        path: "M0 192v896q0 26 19 45t45 19t45 -19l448 -448q19 -19 19 -45t-19 -45l-448 -448q-19 -19 -45 -19t-45 19t-19 45z",
    },
    child: {
        advance: 1280,
        path: "M64 1056q0 40 28 68t68 28t68 -28l228 -228h368l228 228q28 28 68 28t68 -28t28 -68t-28 -68l-292 -292v-824q0 -46 -33 -79t-79 -33t-79 33t-33 79v384h-64v-384q0 -46 -33 -79t-79 -33t-79 33t-33 79v824l-292 292q-28 28 -28 68zM416 1152q0 93 65.5 158.5t158.5 65.5 t158.5 -65.5t65.5 -158.5t-65.5 -158.5t-158.5 -65.5t-158.5 65.5t-65.5 158.5z",
    },
    female: {
        advance: 1280,
        path: "M0 480q0 29 16 53l256 384q73 107 176 107h384q103 0 176 -107l256 -384q16 -24 16 -53q0 -40 -28 -68t-68 -28q-51 0 -80 43l-227 341h-45v-132l247 -411q9 -15 9 -33q0 -26 -19 -45t-45 -19h-192v-272q0 -46 -33 -79t-79 -33h-160q-46 0 -79 33t-33 79v272h-192 q-26 0 -45 19t-19 45q0 18 9 33l247 411v132h-45l-227 -341q-29 -43 -80 -43q-40 0 -68 28t-28 68zM416 1280q0 93 65.5 158.5t158.5 65.5t158.5 -65.5t65.5 -158.5t-65.5 -158.5t-158.5 -65.5t-158.5 65.5t-65.5 158.5z",
    },
    male: {
        advance: 1024,
        path: "M0 416v416q0 80 56 136t136 56h640q80 0 136 -56t56 -136v-416q0 -40 -28 -68t-68 -28t-68 28t-28 68v352h-64v-912q0 -46 -33 -79t-79 -33t-79 33t-33 79v464h-64v-464q0 -46 -33 -79t-79 -33t-79 33t-33 79v912h-64v-352q0 -40 -28 -68t-68 -28t-68 28t-28 68z M288 1280q0 93 65.5 158.5t158.5 65.5t158.5 -65.5t65.5 -158.5t-65.5 -158.5t-158.5 -65.5t-158.5 65.5t-65.5 158.5z",
    },
    minusSquare: {
        advance: 1536,
        path: "M0 160v960q0 119 84.5 203.5t203.5 84.5h960q119 0 203.5 -84.5t84.5 -203.5v-960q0 -119 -84.5 -203.5t-203.5 -84.5h-960q-119 0 -203.5 84.5t-84.5 203.5zM256 576q0 -26 19 -45t45 -19h896q26 0 45 19t19 45v128q0 26 -19 45t-45 19h-896q-26 0 -45 -19t-19 -45v-128 z",
    },
    plusSquare: {
        advance: 1536,
        path: "M0 160v960q0 119 84.5 203.5t203.5 84.5h960q119 0 203.5 -84.5t84.5 -203.5v-960q0 -119 -84.5 -203.5t-203.5 -84.5h-960q-119 0 -203.5 84.5t-84.5 203.5zM256 576q0 -26 19 -45t45 -19h320v-320q0 -26 19 -45t45 -19h128q26 0 45 19t19 45v320h320q26 0 45 19t19 45 v128q0 26 -19 45t-45 19h-320v320q0 26 -19 45t-45 19h-128q-26 0 -45 -19t-19 -45v-320h-320q-26 0 -45 -19t-19 -45v-128z",
    },
    repeat: {
        advance: 1536,
        path: "M0 640q0 156 61 298t164 245t245 164t298 61q147 0 284.5 -55.5t244.5 -156.5l130 129q29 31 70 14q39 -17 39 -59v-448q0 -26 -19 -45t-45 -19h-448q-42 0 -59 40q-17 39 14 69l138 138q-148 137 -349 137q-104 0 -198.5 -40.5t-163.5 -109.5t-109.5 -163.5 t-40.5 -198.5t40.5 -198.5t109.5 -163.5t163.5 -109.5t198.5 -40.5q119 0 225 52t179 147q7 10 23 12q14 0 25 -9l137 -138q9 -8 9.5 -20.5t-7.5 -22.5q-109 -132 -264 -204.5t-327 -72.5q-156 0 -298 61t-245 164t-164 245t-61 298z",
    },
    warning: {
        advance: 1792,
        path: "M16 61l768 1408q17 31 47 49t65 18t65 -18t47 -49l768 -1408q35 -63 -2 -126q-17 -29 -46.5 -46t-63.5 -17h-1536q-34 0 -63.5 17t-46.5 46q-37 63 -2 126zM752 992l17 -457q0 -10 10 -16.5t24 -6.5h185q14 0 23.5 6.5t10.5 16.5l18 459q0 12 -10 19q-13 11 -24 11h-220 q-11 0 -24 -11q-10 -7 -10 -21zM768 161q0 -14 9.5 -23.5t22.5 -9.5h192q13 0 22.5 9.5t9.5 23.5v190q0 14 -9.5 23.5t-22.5 9.5h-192q-13 0 -22.5 -9.5t-9.5 -23.5v-190z",
    },
};

const ASCENT = 1536;
const UNITS_PER_EM = 1792;

/** Renders an icon as an SVG string sized to the current font size. */
export const icon = (name: IconName, className = ""): string => {
    const glyph = GLYPHS[name];
    const cls = ["icon", className].filter(Boolean).join(" ");
    return (
        `<svg class="${cls}" viewBox="0 -${ASCENT} ${glyph.advance} ${UNITS_PER_EM}"` +
        ` width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">` +
        `<g transform="scale(1,-1)"><path d="${glyph.path}"/></g></svg>`
    );
};

/** Renders an icon as a real SVG element. */
export const iconElement = (name: IconName, className = ""): SVGElement => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = icon(name, className);
    return wrapper.firstElementChild as SVGElement;
};
