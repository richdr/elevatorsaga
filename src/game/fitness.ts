import { createFrameRequester } from "./util";
import { World, WorldController, type WorldOptions } from "./world";
import { getCodeObjFromCode, type UserCodeObject } from "./usercode";
import type { Challenge } from "./challenges";

export interface FitnessResult {
    error?: unknown;
    transportedPerSec?: number;
    avgWaitTime?: number;
    transportedCount?: number;
}

export interface FitnessRun {
    options: WorldOptions;
    result: FitnessResult;
}

export interface FitnessSuiteError {
    error: string;
}

export type FitnessSuiteResults = FitnessRun[] | FitnessSuiteError;

const requireNothing = () => ({
    description: "No requirement",
    evaluate: () => null,
});

export const fitnessChallenges: Challenge[] = [
    {
        options: {
            description: "Small scenario",
            floorCount: 4,
            elevatorCount: 2,
            spawnRate: 0.6,
        },
        condition: requireNothing(),
    },
    {
        options: {
            description: "Medium scenario",
            floorCount: 6,
            elevatorCount: 3,
            spawnRate: 1.5,
            elevatorCapacities: [5],
        },
        condition: requireNothing(),
    },
    {
        options: {
            description: "Large scenario",
            floorCount: 18,
            elevatorCount: 6,
            spawnRate: 1.9,
            elevatorCapacities: [8],
        },
        condition: requireNothing(),
    },
];

/** Runs a scenario headlessly, with no visualisation. */
export const calculateFitness = (
    challenge: Challenge,
    codeObj: UserCodeObject,
    stepSize: number,
    stepsToSimulate: number,
): FitnessResult => {
    const controller = new WorldController(stepSize);
    const result: FitnessResult = {};

    const world = new World(challenge.options);
    const frameRequester = createFrameRequester(stepSize);

    controller.on("usercode_error", (e) => {
        result.error = e;
    });
    world.on("stats_changed", () => {
        result.transportedPerSec = world.transportedPerSec;
        result.avgWaitTime = world.avgWaitTime;
        result.transportedCount = world.transportedCounter;
    });

    controller.start(world, codeObj, frameRequester.register, true);

    for (let stepCount = 0; stepCount < stepsToSimulate && !controller.isPaused; stepCount++) {
        frameRequester.trigger();
    }
    return result;
};

const makeAverageResult = (results: FitnessRun[]): FitnessRun => {
    const averagedResult: Record<string, number> = {};
    for (const property of Object.keys(results[0].result)) {
        const sum = results.reduce(
            (acc, r) => acc + ((r.result as Record<string, number>)[property] ?? 0),
            0,
        );
        averagedResult[property] = sum / results.length;
    }
    return { options: results[0].options, result: averagedResult };
};

export const doFitnessSuite = (codeStr: string, runCount: number): FitnessSuiteResults => {
    let codeObj: UserCodeObject;
    try {
        codeObj = getCodeObjFromCode(codeStr);
    } catch (e) {
        return { error: "" + e };
    }
    console.log("Fitness testing code", codeObj);

    let error: unknown = null;
    const testruns: FitnessRun[][] = [];
    for (let run = 0; run < runCount && !error; run++) {
        const results: FitnessRun[] = [];
        for (const challenge of fitnessChallenges) {
            const fitness = calculateFitness(challenge, codeObj, 1000.0 / 60.0, 12000);
            if (fitness.error) {
                error = fitness.error;
                break;
            }
            results.push({ options: challenge.options, result: fitness });
        }
        if (!error) {
            testruns.push(results);
        }
    }
    if (error) {
        return { error: "" + error };
    }

    // Average every property across each challenge's test runs
    return testruns[0].map((_run, n) => makeAverageResult(testruns.map((t) => t[n])));
};

/** Runs the fitness suite, in a worker when one is available. */
export const fitnessSuite = (
    codeStr: string,
    preferWorker: boolean,
    callback: (results: FitnessSuiteResults) => void,
): void => {
    if (preferWorker && typeof Worker !== "undefined") {
        try {
            const worker = new Worker(new URL("./fitness.worker.ts", import.meta.url), {
                type: "module",
            });
            worker.postMessage(codeStr);
            worker.onmessage = (msg: MessageEvent<FitnessSuiteResults>) => {
                callback(msg.data);
                worker.terminate();
            };
            return;
        } catch (e) {
            console.log("Fitness worker creation failed, falling back to normal", e);
        }
    }
    callback(doFitnessSuite(codeStr, 2));
};
