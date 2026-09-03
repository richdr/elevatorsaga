/** Small numeric and simulation helpers. Was `base.js`. */

export const limitNumber = (num: number, min: number, max: number): number =>
    Math.min(max, Math.max(num, min));

export const epsilonEquals = (a: number, b: number): boolean => Math.abs(a - b) < 0.00000001;

export const deprecationWarning = (name: string): void => {
    console.warn("You are using a deprecated feature scheduled for removal: " + name);
};

/** v² = u² + 2a·d, solved for d. */
export const distanceNeededToAchieveSpeed = (
    currentSpeed: number,
    targetSpeed: number,
    acceleration: number,
): number => (Math.pow(targetSpeed, 2) - Math.pow(currentSpeed, 2)) / (2 * acceleration);

/** v² = u² + 2a·d, solved for a. */
export const accelerationNeededToAchieveChangeDistance = (
    currentSpeed: number,
    targetSpeed: number,
    distance: number,
): number => 0.5 * ((Math.pow(targetSpeed, 2) - Math.pow(currentSpeed, 2)) / distance);

export type FrameRequester = (cb: (t: number) => void) => void;

export interface FakeFrameRequester {
    currentT: number;
    register: FrameRequester;
    trigger: () => void;
}

/** Fake frame requester, used by the tests and by headless fitness simulations. */
export const createFrameRequester = (timeStep: number): FakeFrameRequester => {
    let currentCb: ((t: number) => void) | null = null;
    const requester: FakeFrameRequester = {
        currentT: 0.0,
        register: (cb) => {
            currentCb = cb;
        },
        trigger: () => {
            requester.currentT += timeStep;
            if (currentCb !== null) {
                currentCb(requester.currentT);
            }
        },
    };
    return requester;
};

/**
 * Turns a boolean property on `obj` into a jQuery-style getter/setter that
 * returns `owner` when used as a setter, so calls can be chained.
 */
export const createBoolPassthroughFunction = <T>(
    owner: T,
    obj: { trigger: (event: string, ...args: any[]) => unknown } & Record<string, any>,
    objPropertyName: string,
) => {
    function passthrough(): boolean;
    function passthrough(val: boolean): T;
    function passthrough(val?: boolean): boolean | T {
        if (typeof val !== "undefined") {
            obj[objPropertyName] = val ? true : false;
            obj.trigger("change:" + objPropertyName, obj[objPropertyName]);
            return owner;
        }
        return obj[objPropertyName];
    }
    return passthrough;
};

/** Inclusive integer in [0, max] or [min, max]. Matches lodash 3's `_.random`. */
export function randomInt(max: number): number;
export function randomInt(min: number, max: number): number;
export function randomInt(a: number, b?: number): number {
    const min = b === undefined ? 0 : a;
    const max = b === undefined ? a : b;
    return min + Math.floor(Math.random() * (max - min + 1));
}

/** `[0, 1, ..., n-1]` mapped through `fn`. Replaces `_.map(_.range(n), fn)`. */
export const mapRange = <T>(n: number, fn: (i: number) => T): T[] =>
    Array.from({ length: n }, (_unused, i) => fn(i));
