import type { World, WorldOptions } from "./world";

export interface ChallengeCondition {
    description: string;
    /** `true` = passed, `false` = failed, `null` = still undecided. */
    evaluate(world: World): boolean | null;
}

export interface Challenge {
    options: WorldOptions;
    condition: ChallengeCondition;
}

const em = (value: string | number): string => `<span class='emphasis-color'>${value}</span>`;

export const requireUserCountWithinTime = (
    userCount: number,
    timeLimit: number,
): ChallengeCondition => ({
    description: `Transport ${em(userCount)} people in ${em(timeLimit.toFixed(0))} seconds or less`,
    evaluate(world) {
        if (world.elapsedTime >= timeLimit || world.transportedCounter >= userCount) {
            return world.elapsedTime <= timeLimit && world.transportedCounter >= userCount;
        }
        return null;
    },
});

export const requireUserCountWithMaxWaitTime = (
    userCount: number,
    maxWaitTime: number,
): ChallengeCondition => ({
    description: `Transport ${em(userCount)} people and let no one wait more than ${em(
        maxWaitTime.toFixed(1),
    )} seconds`,
    evaluate(world) {
        if (world.maxWaitTime >= maxWaitTime || world.transportedCounter >= userCount) {
            return world.maxWaitTime <= maxWaitTime && world.transportedCounter >= userCount;
        }
        return null;
    },
});

export const requireUserCountWithinTimeWithMaxWaitTime = (
    userCount: number,
    timeLimit: number,
    maxWaitTime: number,
): ChallengeCondition => ({
    description: `Transport ${em(userCount)} people in ${em(
        timeLimit.toFixed(0),
    )} seconds or less and let no one wait more than ${em(maxWaitTime.toFixed(1))} seconds`,
    evaluate(world) {
        if (
            world.elapsedTime >= timeLimit ||
            world.maxWaitTime >= maxWaitTime ||
            world.transportedCounter >= userCount
        ) {
            return (
                world.elapsedTime <= timeLimit &&
                world.maxWaitTime <= maxWaitTime &&
                world.transportedCounter >= userCount
            );
        }
        return null;
    },
});

export const requireUserCountWithinMoves = (
    userCount: number,
    moveLimit: number,
): ChallengeCondition => ({
    description: `Transport ${em(userCount)} people using ${em(moveLimit)} elevator moves or less`,
    evaluate(world) {
        if (world.moveCount >= moveLimit || world.transportedCounter >= userCount) {
            return world.moveCount <= moveLimit && world.transportedCounter >= userCount;
        }
        return null;
    },
});

export const requireDemo = (): ChallengeCondition => ({
    description: "Perpetual demo",
    evaluate: () => null,
});

export const challenges: Challenge[] = [
    {
        options: { floorCount: 3, elevatorCount: 1, spawnRate: 0.3 },
        condition: requireUserCountWithinTime(15, 60),
    },
    {
        options: { floorCount: 5, elevatorCount: 1, spawnRate: 0.4 },
        condition: requireUserCountWithinTime(20, 60),
    },
    {
        options: { floorCount: 5, elevatorCount: 1, spawnRate: 0.5, elevatorCapacities: [6] },
        condition: requireUserCountWithinTime(23, 60),
    },
    {
        options: { floorCount: 8, elevatorCount: 2, spawnRate: 0.6 },
        condition: requireUserCountWithinTime(28, 60),
    },
    {
        options: { floorCount: 6, elevatorCount: 4, spawnRate: 1.7 },
        condition: requireUserCountWithinTime(100, 68),
    },
    {
        options: { floorCount: 4, elevatorCount: 2, spawnRate: 0.8 },
        condition: requireUserCountWithinMoves(40, 60),
    },
    {
        options: { floorCount: 3, elevatorCount: 3, spawnRate: 3.0 },
        condition: requireUserCountWithinMoves(100, 63),
    },
    {
        options: { floorCount: 6, elevatorCount: 2, spawnRate: 0.4, elevatorCapacities: [5] },
        condition: requireUserCountWithMaxWaitTime(50, 21),
    },
    {
        options: { floorCount: 7, elevatorCount: 3, spawnRate: 0.6 },
        condition: requireUserCountWithMaxWaitTime(50, 20),
    },
    {
        options: { floorCount: 13, elevatorCount: 2, spawnRate: 1.1, elevatorCapacities: [4, 10] },
        condition: requireUserCountWithinTime(50, 70),
    },
    {
        options: { floorCount: 9, elevatorCount: 5, spawnRate: 1.1 },
        condition: requireUserCountWithMaxWaitTime(60, 19),
    },
    {
        options: { floorCount: 9, elevatorCount: 5, spawnRate: 1.1 },
        condition: requireUserCountWithMaxWaitTime(80, 17),
    },
    {
        options: { floorCount: 9, elevatorCount: 5, spawnRate: 1.1, elevatorCapacities: [5] },
        condition: requireUserCountWithMaxWaitTime(100, 15),
    },
    {
        options: { floorCount: 9, elevatorCount: 5, spawnRate: 1.0, elevatorCapacities: [6] },
        condition: requireUserCountWithMaxWaitTime(110, 15),
    },
    {
        options: { floorCount: 8, elevatorCount: 6, spawnRate: 0.9 },
        condition: requireUserCountWithMaxWaitTime(120, 14),
    },
    {
        options: { floorCount: 12, elevatorCount: 4, spawnRate: 1.4, elevatorCapacities: [5, 10] },
        condition: requireUserCountWithinTime(70, 80),
    },
    {
        options: { floorCount: 21, elevatorCount: 5, spawnRate: 1.9, elevatorCapacities: [10] },
        condition: requireUserCountWithinTime(110, 80),
    },
    {
        options: { floorCount: 21, elevatorCount: 8, spawnRate: 1.5, elevatorCapacities: [6, 8] },
        condition: requireUserCountWithinTimeWithMaxWaitTime(2675, 1800, 45),
    },
    {
        options: { floorCount: 21, elevatorCount: 8, spawnRate: 1.5, elevatorCapacities: [6, 8] },
        condition: requireDemo(),
    },
];
