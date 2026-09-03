import { describe, expect, it } from "vitest";
import { installUserCodeGlobals } from "../src/game/lodash-global";

/**
 * The original game bundled lodash 3.6, and published solutions rely on it.
 * These cover the names that lodash 4 removed or redefined - the ones that
 * would silently break existing solutions if the shim regressed.
 */
describe("lodash 3 compatibility for player code", () => {
    const scope: Record<string, any> = {};
    installUserCodeGlobals(scope);
    const _ = scope._;

    it("provides _.max with an iteratee", () => {
        const items = [{ n: 1 }, { n: 9 }, { n: 4 }];
        expect(_.max(items, (i: { n: number }) => i.n)).toEqual({ n: 9 });
        expect(_.max([1, 9, 4])).toBe(9);
    });

    it("provides _.min with an iteratee", () => {
        const items = [{ n: 1 }, { n: 9 }];
        expect(_.min(items, (i: { n: number }) => i.n)).toEqual({ n: 1 });
        expect(_.min([3, 2])).toBe(2);
    });

    it("provides _.contains", () => {
        expect(_.contains([1, 2, 3], 2)).toBe(true);
        expect(_.contains([1, 2, 3], 5)).toBe(false);
    });

    it("provides _.pluck", () => {
        expect(_.pluck([{ a: 1 }, { a: 2 }], "a")).toEqual([1, 2]);
    });

    it("keeps lodash 3's meaning of _.rest", () => {
        expect(_.rest([1, 2, 3])).toEqual([2, 3]);
    });

    it("provides _.first as the head of the list", () => {
        expect(_.first([1, 2, 3])).toBe(1);
    });

    it("provides _.sum with and without an iteratee", () => {
        expect(_.sum([1, 2, 3])).toBe(6);
        expect(_.sum([{ n: 1 }, { n: 2 }], (i: { n: number }) => i.n)).toBe(3);
    });

    it("still provides the everyday lodash 4 functions", () => {
        expect(_.map([1, 2], (n: number) => n * 2)).toEqual([2, 4]);
        expect(_.range(3)).toEqual([0, 1, 2]);
        expect(typeof _.each).toBe("function");
    });
});
