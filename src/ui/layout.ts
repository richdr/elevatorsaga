/**
 * Responsive shell behaviour: the code/elevator view toggle, scaling the world
 * to fit whatever space it has, and the small touch affordances around them.
 */
import { qs, qsa } from "./dom";

export const NARROW = "(max-width: 899px)";

export type ViewName = "world" | "code";

const VIEW_KEY = "elevatorView";

export interface ViewToggle {
    get(): ViewName;
    set(view: ViewName, remember?: boolean): void;
    onChange(cb: (view: ViewName) => void): void;
}

/**
 * The centrepiece of the mobile layout. On a phone the elevator shaft and the
 * code editor cannot usefully share the screen, so they become tabs. Above the
 * breakpoint both are visible and the toggle is hidden, but the state is still
 * tracked so that switching orientation keeps its meaning.
 */
export const createViewToggle = (): ViewToggle => {
    const options = qsa<HTMLButtonElement>(".viewtoggle_option");
    const listeners: ((view: ViewName) => void)[] = [];
    const stored = localStorage.getItem(VIEW_KEY);
    let current: ViewName = stored === "code" ? "code" : "world";

    const render = () => {
        document.body.dataset.view = current;
        for (const option of options) {
            option.setAttribute("aria-selected", String(option.dataset.view === current));
            option.tabIndex = option.dataset.view === current ? 0 : -1;
        }
    };

    const set = (view: ViewName, remember = true) => {
        if (view === current) {
            return;
        }
        current = view;
        if (remember) {
            localStorage.setItem(VIEW_KEY, view);
        }
        render();
        for (const cb of listeners) {
            cb(view);
        }
    };

    for (const option of options) {
        option.addEventListener("click", () => set(option.dataset.view as ViewName));
    }

    // Arrow keys move between tabs, as a tablist should.
    qs(".viewtoggle").addEventListener("keydown", (event) => {
        const e = event as KeyboardEvent;
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
            return;
        }
        e.preventDefault();
        const next: ViewName = current === "world" ? "code" : "world";
        set(next);
        options.find((o) => o.dataset.view === next)?.focus();
    });

    render();

    return {
        get: () => current,
        set,
        onChange: (cb) => listeners.push(cb),
    };
};

export interface WorldMetrics {
    /** Width of the world's coordinate space on a wide screen, in engine pixels. */
    width: number;
    /**
     * Width of the band that actually contains anything: the elevators, the
     * people waiting beside them, and the room they walk into on the way out.
     * The original's canvas was much wider than this, which is affordable on a
     * desktop and not on a phone.
     */
    tightWidth: number;
    /** Height of the world's coordinate space, in engine pixels. */
    height: number;
}

export interface WorldScaler {
    setMetrics(metrics: WorldMetrics): void;
    refresh(): void;
}

/**
 * Below this scale the people become unreadable smudges, so we stop shrinking
 * and let the viewport scroll instead. 0.3 is low enough that the tallest
 * challenge - 21 floors - still fits a phone whole.
 */
const MIN_SCALE = 0.3;

/**
 * Fits the world into the space available by scaling it, rather than by
 * changing the simulation's geometry. The engine keeps its fixed pixel
 * coordinate space and none of the gameplay maths moves.
 *
 * `scaler` carries the transform and keeps the world's true pixel size, so the
 * children's coordinates are untouched. `sizer` is given the *scaled* size,
 * because a transform does not affect layout and without it the viewport could
 * neither centre the world nor scroll to the parts hanging off the edge.
 */
export const createWorldScaler = (
    viewport: HTMLElement,
    sizer: HTMLElement,
    scaler: HTMLElement,
    pane: HTMLElement,
    stats: HTMLElement,
): WorldScaler => {
    let metrics: WorldMetrics = { width: 938, tightWidth: 938, height: 200 };
    const narrow = window.matchMedia(NARROW);

    const apply = () => {
        const availableWidth = viewport.clientWidth;
        if (availableWidth === 0 || metrics.height === 0) {
            // Hidden, or not built yet. We get another go when it is shown.
            return;
        }

        const isNarrow = narrow.matches;
        const worldWidth = isNarrow ? metrics.tightWidth : metrics.width;
        let scale = availableWidth / worldWidth;

        if (isNarrow) {
            // The pane is a fixed slice of the viewport here, so its height is a
            // real constraint rather than something the content decides.
            const availableHeight = pane.clientHeight - stats.offsetHeight;
            if (availableHeight > 0) {
                scale = Math.min(scale, availableHeight / metrics.height);
            }
        }

        scale = Math.min(1, Math.max(scale, MIN_SCALE));

        scaler.style.width = `${worldWidth}px`;
        scaler.style.height = `${metrics.height}px`;
        scaler.style.transform = `scale(${scale})`;
        sizer.style.width = `${Math.ceil(worldWidth * scale)}px`;
        sizer.style.height = `${Math.ceil(metrics.height * scale)}px`;
    };

    const observer = new ResizeObserver(() => apply());
    observer.observe(pane);
    observer.observe(stats);
    window.addEventListener("orientationchange", () => apply());

    return {
        setMetrics(next) {
            metrics = next;
            apply();
        },
        refresh: apply,
    };
};

/**
 * Turns `data-hint` buttons into tap-to-reveal tooltips, so the explanation is
 * not locked behind a hover that a touchscreen cannot perform.
 */
export const installHints = (): void => {
    const hints = qsa<HTMLButtonElement>(".hint");
    for (const hint of hints) {
        hint.setAttribute("aria-expanded", "false");
        hint.addEventListener("click", (e) => {
            e.stopPropagation();
            const wasOpen = hint.getAttribute("aria-expanded") === "true";
            for (const other of hints) {
                other.setAttribute("aria-expanded", "false");
            }
            hint.setAttribute("aria-expanded", String(!wasOpen));
        });
    }
    document.addEventListener("click", () => {
        for (const hint of hints) {
            hint.setAttribute("aria-expanded", "false");
        }
    });
};

/**
 * Keeps the layout above the on-screen keyboard. Without this the caret ends up
 * behind it on iOS, because the visual viewport shrinks but the layout viewport
 * does not.
 */
export const installKeyboardInset = (): void => {
    const vv = window.visualViewport;
    if (!vv) {
        return;
    }
    const update = () => {
        const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        document.documentElement.style.setProperty("--keyboard-inset", `${inset}px`);
        document.body.classList.toggle("keyboard-open", inset > 120);
    };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    update();
};
