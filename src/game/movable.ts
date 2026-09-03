import { Observable } from "./observable";

export const linearInterpolate = (value0: number, value1: number, x: number): number =>
    value0 + (value1 - value0) * x;

export const powInterpolate = (value0: number, value1: number, x: number, a: number): number =>
    value0 +
    ((value1 - value0) * Math.pow(x, a)) / (Math.pow(x, a) + Math.pow(1 - x, a));

export const coolInterpolate = (value0: number, value1: number, x: number): number =>
    powInterpolate(value0, value1, x, 1.3);

export type Interpolator = (value0: number, value1: number, x: number) => number;

const DEFAULT_INTERPOLATOR: Interpolator = coolInterpolate;

/** Scratch storage, reused to keep the per-frame allocation count down. */
const tmpPosStorage: [number, number] = [0, 0];

export type MovableEvents = {
    new_state: [movable: Movable];
    new_display_state: [movable: Movable];
    removed: [];
};

/** Something with a position that can be animated, and optionally parented to another. */
export class Movable<E extends Record<string, any[]> = MovableEvents> extends Observable<E> {
    x = 0.0;
    y = 0.0;
    parent: Movable<any> | null = null;
    worldX = 0.0;
    worldY = 0.0;
    currentTask: ((dt: number) => void) | null = null;

    constructor() {
        super();
        this.trigger("new_state", this as any);
    }

    updateDisplayPosition(forceTrigger?: boolean): void {
        this.getWorldPosition(tmpPosStorage);
        const oldX = this.worldX;
        const oldY = this.worldY;
        this.worldX = tmpPosStorage[0];
        this.worldY = tmpPosStorage[1];
        if (oldX !== this.worldX || oldY !== this.worldY || forceTrigger === true) {
            this.trigger("new_display_state", this as any);
        }
    }

    moveTo(newX: number | null, newY: number | null): void {
        if (newX !== null) {
            this.x = newX;
        }
        if (newY !== null) {
            this.y = newY;
        }
        this.trigger("new_state", this as any);
    }

    moveToFast(newX: number, newY: number): void {
        this.x = newX;
        this.y = newY;
        this.trigger("new_state", this as any);
    }

    isBusy(): boolean {
        return this.currentTask !== null;
    }

    makeSureNotBusy(): void {
        if (this.isBusy()) {
            console.error("Attempt to use movable while it was busy", this);
            throw { message: "Object is busy - you should use callback", obj: this };
        }
    }

    wait(millis: number, cb?: () => void): void {
        this.makeSureNotBusy();
        let timeSpent = 0.0;
        this.currentTask = (dt) => {
            timeSpent += dt;
            if (timeSpent > millis) {
                this.currentTask = null;
                cb?.();
            }
        };
    }

    moveToOverTime(
        newX: number | null,
        newY: number | null,
        timeToSpend: number,
        interpolator?: Interpolator,
        cb?: () => void,
    ): void {
        this.makeSureNotBusy();
        const destX = newX === null ? this.x : newX;
        const destY = newY === null ? this.y : newY;
        const interpolate = interpolator ?? DEFAULT_INTERPOLATOR;
        const origX = this.x;
        const origY = this.y;
        let timeSpent = 0.0;
        this.currentTask = (dt) => {
            timeSpent = Math.min(timeToSpend, timeSpent + dt);
            if (timeSpent === timeToSpend) {
                this.moveToFast(destX, destY);
                this.currentTask = null;
                cb?.();
            } else {
                const factor = timeSpent / timeToSpend;
                this.moveToFast(
                    interpolate(origX, destX, factor),
                    interpolate(origY, destY, factor),
                );
            }
        };
    }

    update(dt: number): void {
        this.currentTask?.(dt);
    }

    getWorldPosition(storage: [number, number]): void {
        let resultX = this.x;
        let resultY = this.y;
        let currentParent = this.parent;
        while (currentParent !== null) {
            resultX += currentParent.x;
            resultY += currentParent.y;
            currentParent = currentParent.parent;
        }
        storage[0] = resultX;
        storage[1] = resultY;
    }

    setParent(movableParent: Movable<any> | null): void {
        const objWorld: [number, number] = [0, 0];
        if (movableParent === null) {
            if (this.parent !== null) {
                this.getWorldPosition(objWorld);
                this.parent = null;
                this.moveToFast(objWorld[0], objWorld[1]);
            }
        } else {
            this.getWorldPosition(objWorld);
            const parentWorld: [number, number] = [0, 0];
            movableParent.getWorldPosition(parentWorld);
            this.parent = movableParent;
            this.moveToFast(objWorld[0] - parentWorld[0], objWorld[1] - parentWorld[1]);
        }
    }
}
