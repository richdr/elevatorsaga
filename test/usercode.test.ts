import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getCodeObjFromCode } from "../src/game/usercode";
import { installUserCodeGlobals } from "../src/game/lodash-global";
import { DEFAULT_CODE, DEVTEST_CODE } from "../src/ui/default-code";
import { calculateFitness, fitnessChallenges } from "../src/game/fitness";

installUserCodeGlobals();

describe("player code", () => {
    describe("modern JavaScript", () => {
        it("accepts method shorthand", () => {
            const obj = getCodeObjFromCode(`{
                init(elevators, floors) {},
                update(dt, elevators, floors) {},
            }`);
            expect(typeof obj.init).toBe("function");
            expect(typeof obj.update).toBe("function");
        });

        it("accepts arrow functions, const and template literals", () => {
            const obj = getCodeObjFromCode(`{
                init(elevators, floors) {
                    const first = elevators[0];
                    const label = \`floors: \${floors.length}\`;
                    first.on("idle", () => label);
                },
                update: (dt, elevators, floors) => {},
            }`);
            expect(typeof obj.init).toBe("function");
        });

        it("accepts destructuring, spread and classes", () => {
            const obj = getCodeObjFromCode(`{
                init([first, ...rest], floors) {
                    class Plan {
                        constructor(n) { this.n = n; }
                    }
                    const { length } = floors;
                    return new Plan(length + rest.length + (first ? 1 : 0));
                },
                update() {},
            }`);
            expect(typeof obj.init).toBe("function");
        });

        it("still accepts the original ES5-with-lodash style", () => {
            const obj = getCodeObjFromCode(`{
                init: function(elevators, floors) {
                    var best = _.max(elevators, function(e) { return -e.loadFactor(); });
                    _.each(floors, function(f) { return f.floorNum(); });
                    return best;
                },
                update: function(dt, elevators, floors) {}
            }`);
            expect(typeof obj.init).toBe("function");
        });
    });

    /**
     * The samples are strings, so a syntax error or a wrong method name in them
     * would otherwise ship silently. These run them against the real simulation.
     *
     * The simulation spawns people at random, so `Math.random` is replaced with
     * a seeded generator for the duration. Without it these assertions are a
     * coin toss: the default sample only drives one elevator between floors 0
     * and 1 of a four-floor building, so it transports a median of 3 people and
     * **nobody at all in 6% of runs** - which is exactly how it failed in CI
     * after passing locally.
     */
    describe("the shipped samples", () => {
        /** mulberry32 - small, fast, and good enough to make a run repeatable. */
        const seeded = (seed: number) => () => {
            seed = (seed + 0x6d2b79f5) | 0;
            let t = seed;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };

        const realRandom = Math.random;
        beforeEach(() => {
            Math.random = seeded(1);
        });
        afterEach(() => {
            Math.random = realRandom;
        });

        it("the default sample runs and moves people", () => {
            const codeObj = getCodeObjFromCode(DEFAULT_CODE);
            const result = calculateFitness(fitnessChallenges[0], codeObj, 1000.0 / 60.0, 4000);
            expect(result.error).toBeUndefined();
            // 9 with this seed. Asserted as a floor rather than an equality, so
            // an unrelated engine tweak does not fail the build.
            expect(result.transportedCount).toBeGreaterThanOrEqual(1);
        });

        it("the devtest sample transports people efficiently", () => {
            const codeObj = getCodeObjFromCode(DEVTEST_CODE);
            const result = calculateFitness(fitnessChallenges[1], codeObj, 1000.0 / 60.0, 4000);
            expect(result.error).toBeUndefined();
            // 71 with this seed - it serves every floor, so it should be far
            // ahead of the default sample rather than merely nonzero.
            expect(result.transportedCount).toBeGreaterThan(20);
        });
    });
});
