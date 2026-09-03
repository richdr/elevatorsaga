import { describe, expect, it, vi } from "vitest";
import { Observable } from "../src/game/observable";

describe("Observable", () => {
    it("calls handlers with the triggered arguments", () => {
        const o = new Observable();
        const handler = vi.fn((..._args: any[]) => {});
        o.on("thing", handler);
        o.trigger("thing", 1, "two");
        expect(handler).toHaveBeenCalledWith(1, "two");
    });

    it("prepends the event name for multi-event subscriptions", () => {
        const o = new Observable();
        const handler = vi.fn((..._args: any[]) => {});
        o.on("a b", handler);
        o.trigger("a", 42);
        o.trigger("b", 43);
        expect(handler.mock.calls).toEqual([
            ["a", 42],
            ["b", 43],
        ]);
    });

    it("does not re-enter a handler that is already running", () => {
        const o = new Observable();
        let calls = 0;
        o.on("loop", () => {
            calls++;
            o.trigger("loop");
        });
        o.trigger("loop");
        expect(calls).toBe(1);
    });

    it("lets a handler remove itself during dispatch without skipping the next one", () => {
        const o = new Observable();
        const seen: string[] = [];
        const first = () => {
            seen.push("first");
            o.off("evt", first);
        };
        o.on("evt", first);
        o.on("evt", () => seen.push("second"));
        o.trigger("evt");
        expect(seen).toEqual(["first", "second"]);
    });

    it("unsubscribes a `one` handler after the first dispatch", () => {
        const o = new Observable();
        const handler = vi.fn((..._args: any[]) => {});
        o.one("once", handler);
        o.trigger("once");
        o.trigger("once");
        expect(handler.mock.calls.length).toBe(1);
    });

    it('drops every subscription on off("*")', () => {
        const o = new Observable();
        const handler = vi.fn((..._args: any[]) => {});
        o.on("a", handler);
        o.on("b", handler);
        o.off("*");
        o.trigger("a");
        o.trigger("b");
        expect(handler).not.toHaveBeenCalled();
    });

    it("drops only the named events when off is given no handler", () => {
        const o = new Observable();
        const a = vi.fn((..._args: any[]) => {});
        const b = vi.fn((..._args: any[]) => {});
        o.on("a", a);
        o.on("b", b);
        o.off("a");
        o.trigger("a");
        o.trigger("b");
        expect(a).not.toHaveBeenCalled();
        expect(b).toHaveBeenCalled();
    });
});
