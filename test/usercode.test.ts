import { describe, expect, it } from "vitest";
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
     */
    describe("the shipped samples", () => {
        it("the default sample parses and runs", () => {
            const codeObj = getCodeObjFromCode(DEFAULT_CODE);
            const result = calculateFitness(fitnessChallenges[0], codeObj, 1000.0 / 60.0, 4000);
            expect(result.error).toBeUndefined();
            // Two floors served by one elevator still moves people.
            expect(result.transportedCount).toBeGreaterThan(0);
        });

        it("the devtest sample parses and transports people", () => {
            const codeObj = getCodeObjFromCode(DEVTEST_CODE);
            const result = calculateFitness(fitnessChallenges[1], codeObj, 1000.0 / 60.0, 4000);
            expect(result.error).toBeUndefined();
            expect(result.transportedCount).toBeGreaterThan(10);
        });
    });
});
