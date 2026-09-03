/**
 * Minimal event emitter, replacing the two event systems the original used
 * (`riot.observable` for floors/interfaces/world, `unobservable` for movables).
 *
 * The semantics are riot 1.0.2's, preserved deliberately, because the engine
 * depends on the sharper edges:
 *
 *  - `on("a b", fn)` subscribes to several events at once, and a handler
 *    registered that way is *typed*: it receives the event name as its first
 *    argument. `world.ts` relies on this for the floor button handling.
 *  - A handler is never re-entered while it is running (`busy`), which stops
 *    user code from recursing infinitely through `idle`.
 *  - A handler may remove itself during dispatch; iteration copes.
 *  - `off("*")` drops every subscription, used when a world is unwound.
 */

export type EventMap = Record<string, unknown[]>;

type Listener = {
    (...args: any[]): void;
    /** Registered via a multi-event string, so it receives the event name first. */
    typed?: boolean;
    /** Currently being dispatched — guards against re-entrancy. */
    busy?: boolean;
    /** Unsubscribe after the first dispatch. */
    one?: boolean;
};

const NON_WHITESPACE = /[^\s]+/g;

export class Observable<E extends EventMap = Record<string, any[]>> {
    private callbacks: Record<string, Listener[]> = {};

    on<K extends keyof E & string>(event: K, fn: (...args: E[K]) => void): this;
    on(events: string, fn: (...args: any[]) => void): this;
    on(events: string, fn: Listener): this {
        if (typeof fn === "function") {
            events.replace(NON_WHITESPACE, (name, pos: number) => {
                (this.callbacks[name] ??= []).push(fn);
                fn.typed = pos > 0;
                return name;
            });
        }
        return this;
    }

    /** Subscribe until the first dispatch. Single event name only. */
    one<K extends keyof E & string>(event: K, fn: (...args: E[K]) => void): this;
    one(event: string, fn: (...args: any[]) => void): this;
    one(event: string, fn: Listener): this {
        if (fn) {
            fn.one = true;
        }
        return this.on(event, fn);
    }

    /** `off("*")` clears everything; otherwise drops one handler, or all handlers for the events. */
    off<K extends keyof E & string>(event: K, fn?: (...args: E[K]) => void): this;
    off(events: string, fn?: (...args: any[]) => void): this;
    off(events: string, fn?: Listener): this {
        if (events === "*") {
            this.callbacks = {};
        } else if (fn) {
            const arr = this.callbacks[events];
            if (arr) {
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i] === fn) {
                        arr.splice(i, 1);
                        i--;
                    }
                }
            }
        } else {
            events.replace(NON_WHITESPACE, (name) => {
                this.callbacks[name] = [];
                return name;
            });
        }
        return this;
    }

    trigger<K extends keyof E & string>(event: K, ...args: E[K]): this;
    trigger(event: string, ...args: any[]): this;
    trigger(event: string, ...args: any[]): this {
        const fns = this.callbacks[event];
        if (!fns) {
            return this;
        }
        for (let i = 0; i < fns.length; i++) {
            const fn = fns[i];
            if (fn.busy) {
                continue;
            }
            fn.busy = true;
            fn.apply(this, fn.typed ? [event, ...args] : args);
            if (fn.one) {
                fns.splice(i, 1);
                i--;
            } else if (fns[i] && fns[i] !== fn) {
                // The handler removed itself during dispatch.
                i--;
            }
            fn.busy = false;
        }
        return this;
    }
}
