import { Movable, type MovableEvents } from "./movable";
import type { User } from "./user";
import {
    accelerationNeededToAchieveChangeDistance,
    deprecationWarning,
    distanceNeededToAchieveSpeed,
    epsilonEquals,
    limitNumber,
    mapRange,
    randomInt,
} from "./util";

export interface IndicatorStates {
    up: boolean;
    down: boolean;
}

interface UserSlot {
    pos: [number, number];
    user: User | null;
}

export type ElevatorEvents = MovableEvents & {
    stopped: [exactFloor: number];
    stopped_at_floor: [floorNum: number];
    passing_floor: [floorNum: number, direction: "up" | "down"];
    floor_button_pressed: [floorNum: number];
    floor_buttons_changed: [states: boolean[], indexChanged: number];
    new_current_floor: [floorNum: number];
    exit_available: [floorNum: number, elevator: Elevator];
    entrance_available: [elevator: Elevator];
    indicatorstate_change: [states: IndicatorStates];
    "change:goingUpIndicator": [value: boolean];
    "change:goingDownIndicator": [value: boolean];
};

/** The physical elevator. Player code talks to `ElevatorInterface`, not to this. */
export class Elevator extends Movable<ElevatorEvents> {
    readonly ACCELERATION: number;
    readonly DECELERATION: number;
    readonly MAXSPEED: number;
    readonly floorCount: number;
    readonly floorHeight: number;
    readonly maxUsers: number;
    readonly width: number;
    readonly userSlots: UserSlot[];

    destinationY: number;
    velocityY = 0.0;
    /** Needed when going to the same floor again, so the events get re-raised. */
    isMoving = false;
    goingUpIndicator = true;
    goingDownIndicator = true;
    currentFloor = 0;
    previousTruncFutureFloorIfStopped = 0;
    buttonStates: boolean[];
    moveCount = 0;
    removed = false;

    constructor(
        speedFloorsPerSec: number,
        floorCount: number,
        floorHeight: number,
        maxUsers?: number,
    ) {
        super();
        this.ACCELERATION = floorHeight * 2.1;
        this.DECELERATION = floorHeight * 2.6;
        this.MAXSPEED = floorHeight * speedFloorsPerSec;
        this.floorCount = floorCount;
        this.floorHeight = floorHeight;
        this.maxUsers = maxUsers || 4;
        this.buttonStates = mapRange(floorCount, () => false);
        this.userSlots = mapRange(this.maxUsers, (i) => ({
            pos: [2 + i * 10, 30] as [number, number],
            user: null,
        }));
        this.width = this.maxUsers * 10;
        this.destinationY = this.getYPosOfFloor(this.currentFloor);

        this.on("new_state", () => this.handleNewState());

        const indicatorChanged = () => {
            this.trigger("indicatorstate_change", {
                up: this.goingUpIndicator,
                down: this.goingDownIndicator,
            });
        };
        this.on("change:goingUpIndicator", indicatorChanged);
        this.on("change:goingDownIndicator", indicatorChanged);
    }

    setFloorPosition(floor: number): void {
        const destination = this.getYPosOfFloor(floor);
        this.currentFloor = floor;
        this.previousTruncFutureFloorIfStopped = floor;
        this.moveTo(null, destination);
    }

    /** Returns the slot position taken, or false when the elevator is full. */
    userEntering(user: User): [number, number] | false {
        const randomOffset = randomInt(this.userSlots.length - 1);
        for (let i = 0; i < this.userSlots.length; i++) {
            const slot = this.userSlots[(i + randomOffset) % this.userSlots.length];
            if (slot.user === null) {
                slot.user = user;
                return slot.pos;
            }
        }
        return false;
    }

    pressFloorButton(floorNumber: number): void {
        const floorNum = limitNumber(floorNumber, 0, this.floorCount - 1);
        const prev = this.buttonStates[floorNum];
        this.buttonStates[floorNum] = true;
        if (!prev) {
            this.trigger("floor_button_pressed", floorNum);
            this.trigger("floor_buttons_changed", this.buttonStates, floorNum);
        }
    }

    userExiting(user: User): void {
        for (const slot of this.userSlots) {
            if (slot.user === user) {
                slot.user = null;
            }
        }
    }

    updateElevatorMovement(dt: number): void {
        if (this.isBusy()) {
            // TODO: Consider if having a nonzero velocity here should throw an error.
            return;
        }

        // Make sure we're not speeding
        this.velocityY = limitNumber(this.velocityY, -this.MAXSPEED, this.MAXSPEED);

        this.moveTo(null, this.y + this.velocityY * dt);

        const destinationDiff = this.destinationY - this.y;
        const directionSign = Math.sign(destinationDiff);
        const velocitySign = Math.sign(this.velocityY);
        let acceleration = 0.0;
        if (destinationDiff !== 0.0) {
            if (directionSign === velocitySign) {
                // Moving in the correct direction
                const distanceNeededToStop = distanceNeededToAchieveSpeed(
                    this.velocityY,
                    0.0,
                    this.DECELERATION,
                );
                if (distanceNeededToStop * 1.05 < -Math.abs(destinationDiff)) {
                    // Slow down. Allow a factor of extra braking, so that overshoot
                    // is recovered from smoothly.
                    const requiredDeceleration = accelerationNeededToAchieveChangeDistance(
                        this.velocityY,
                        0.0,
                        destinationDiff,
                    );
                    const deceleration = Math.min(
                        this.DECELERATION * 1.1,
                        Math.abs(requiredDeceleration),
                    );
                    this.velocityY -= directionSign * deceleration * dt;
                } else {
                    // Speed up, or hold max speed
                    acceleration = Math.min(Math.abs(destinationDiff * 5), this.ACCELERATION);
                    this.velocityY += directionSign * acceleration * dt;
                }
            } else if (velocitySign === 0) {
                // Standing still - should accelerate
                acceleration = Math.min(Math.abs(destinationDiff * 5), this.ACCELERATION);
                this.velocityY += directionSign * acceleration * dt;
            } else {
                // Moving the wrong way - decelerate as hard as possible
                this.velocityY -= velocitySign * this.DECELERATION * dt;
                // Don't change direction within this time step; let the standstill
                // logic handle it on the next one.
                if (Math.sign(this.velocityY) !== velocitySign) {
                    this.velocityY = 0.0;
                }
            }
        }

        if (this.isMoving && Math.abs(destinationDiff) < 0.5 && Math.abs(this.velocityY) < 3) {
            // Snap to destination and stop
            this.moveTo(null, this.destinationY);
            this.velocityY = 0.0;
            this.isMoving = false;
            this.handleDestinationArrival();
        }
    }

    handleDestinationArrival(): void {
        this.trigger("stopped", this.getExactCurrentFloor());

        if (this.isOnAFloor()) {
            this.buttonStates[this.currentFloor] = false;
            this.trigger("floor_buttons_changed", this.buttonStates, this.currentFloor);
            this.trigger("stopped_at_floor", this.currentFloor);
            // Users must be allowed off first, so that new ones can enter on the same floor
            this.trigger("exit_available", this.currentFloor, this);
            this.trigger("entrance_available", this);
        }
    }

    goToFloor(floor: number): void {
        this.makeSureNotBusy();
        this.isMoving = true;
        this.destinationY = this.getYPosOfFloor(floor);
    }

    /** @deprecated Use {@link getPressedFloors}. */
    getFirstPressedFloor(): number {
        deprecationWarning("getFirstPressedFloor");
        for (let i = 0; i < this.buttonStates.length; i++) {
            if (this.buttonStates[i]) {
                return i;
            }
        }
        return 0;
    }

    getPressedFloors(): number[] {
        const arr: number[] = [];
        for (let i = 0; i < this.buttonStates.length; i++) {
            if (this.buttonStates[i]) {
                arr.push(i);
            }
        }
        return arr;
    }

    isSuitableForTravelBetween(fromFloorNum: number, toFloorNum: number): boolean {
        if (fromFloorNum > toFloorNum) {
            return this.goingDownIndicator;
        }
        if (fromFloorNum < toFloorNum) {
            return this.goingUpIndicator;
        }
        return true;
    }

    getYPosOfFloor(floorNum: number): number {
        return (this.floorCount - 1) * this.floorHeight - floorNum * this.floorHeight;
    }

    getExactFloorOfYPos(y: number): number {
        return ((this.floorCount - 1) * this.floorHeight - y) / this.floorHeight;
    }

    getExactCurrentFloor(): number {
        return this.getExactFloorOfYPos(this.y);
    }

    getDestinationFloor(): number {
        return this.getExactFloorOfYPos(this.destinationY);
    }

    getRoundedCurrentFloor(): number {
        return Math.round(this.getExactCurrentFloor());
    }

    getExactFutureFloorIfStopped(): number {
        const distanceNeededToStop = distanceNeededToAchieveSpeed(
            this.velocityY,
            0.0,
            this.DECELERATION,
        );
        return this.getExactFloorOfYPos(this.y - Math.sign(this.velocityY) * distanceNeededToStop);
    }

    isApproachingFloor(floorNum: number): boolean {
        const floorYPos = this.getYPosOfFloor(floorNum);
        const elevToFloor = floorYPos - this.y;
        return this.velocityY !== 0.0 && Math.sign(this.velocityY) === Math.sign(elevToFloor);
    }

    isOnAFloor(): boolean {
        return epsilonEquals(this.getExactCurrentFloor(), this.getRoundedCurrentFloor());
    }

    getLoadFactor(): number {
        const load = this.userSlots.reduce(
            (sum, slot) => sum + (slot.user ? slot.user.weight : 0),
            0,
        );
        return load / (this.maxUsers * 100);
    }

    isFull(): boolean {
        return this.userSlots.every((slot) => slot.user !== null);
    }

    isEmpty(): boolean {
        return this.userSlots.every((slot) => slot.user === null);
    }

    handleNewState(): void {
        // Recalculate the floor number etc
        const currentFloor = this.getRoundedCurrentFloor();
        if (currentFloor !== this.currentFloor) {
            this.moveCount++;
            this.currentFloor = currentFloor;
            this.trigger("new_current_floor", this.currentFloor);
        }

        // Check whether we are about to pass a floor
        const futureTruncFloorIfStopped = Math.trunc(this.getExactFutureFloorIfStopped());
        if (futureTruncFloorIfStopped !== this.previousTruncFutureFloorIfStopped) {
            // Somewhat ugly: a formally correct solution would iterate and emit events
            // for every passed floor, since the elevator could in theory be moving fast
            // enough to pass more than one floor in a single update. Overkill in practice.
            const floorBeingPassed = Math.round(this.getExactFutureFloorIfStopped());

            // Never emit passing_floor for the destination floor - we're not going to
            // pass it, at least not intentionally.
            if (
                this.getDestinationFloor() !== floorBeingPassed &&
                this.isApproachingFloor(floorBeingPassed)
            ) {
                const direction = this.velocityY > 0.0 ? "down" : "up";
                this.trigger("passing_floor", floorBeingPassed, direction);
            }
        }
        this.previousTruncFutureFloorIfStopped = futureTruncFloorIfStopped;
    }
}
