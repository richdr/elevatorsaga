import { Observable } from "./observable";
import type { Elevator } from "./elevator";
import type { UserCodeErrorHandler } from "./floor";
import { createBoolPassthroughFunction, epsilonEquals, limitNumber } from "./util";

export type ElevatorInterfaceEvents = {
    /** The elevator has no more queued destinations. */
    idle: [];
    /** Someone inside the elevator pressed a floor button. */
    floor_button_pressed: [floorNum: number];
    /** The elevator is about to pass a floor without stopping. */
    passing_floor: [floorNum: number, direction: "up" | "down"];
    /** The elevator stopped at a floor. */
    stopped_at_floor: [floorNum: number];
};

const rethrow: UserCodeErrorHandler = (e) => {
    throw e;
};

/**
 * The facade player code programs against.
 *
 * It hides the physical elevator behind something harder to misuse, and adds
 * the destination queue, so that solutions can be written without async logic.
 */
export class ElevatorInterface extends Observable<ElevatorInterfaceEvents> {
    destinationQueue: number[] = [];

    private readonly elevator: Elevator;
    private readonly floorCount: number;
    private readonly errorHandler: UserCodeErrorHandler;

    constructor(elevator: Elevator, floorCount: number, errorHandler: UserCodeErrorHandler = rethrow) {
        super();
        this.elevator = elevator;
        this.floorCount = floorCount;
        this.errorHandler = errorHandler;

        this.goingUpIndicator = createBoolPassthroughFunction(this, elevator, "goingUpIndicator");
        this.goingDownIndicator = createBoolPassthroughFunction(
            this,
            elevator,
            "goingDownIndicator",
        );

        elevator.on("stopped", (position) => {
            if (
                this.destinationQueue.length &&
                epsilonEquals(this.destinationQueue[0], position)
            ) {
                // Reached the destination, so remove the element at the front of the queue
                this.destinationQueue = this.destinationQueue.slice(1);
                if (elevator.isOnAFloor()) {
                    elevator.wait(1, () => {
                        this.checkDestinationQueue();
                    });
                } else {
                    this.checkDestinationQueue();
                }
            }
        });

        elevator.on("passing_floor", (floorNum, direction) => {
            this.tryTrigger("passing_floor", floorNum, direction);
        });
        elevator.on("stopped_at_floor", (floorNum) => {
            this.tryTrigger("stopped_at_floor", floorNum);
        });
        elevator.on("floor_button_pressed", (floorNum) => {
            this.tryTrigger("floor_button_pressed", floorNum);
        });
    }

    /** Triggers an event, funnelling any error thrown by player code to the handler. */
    private tryTrigger(event: string, ...args: any[]): void {
        try {
            this.trigger(event, ...args);
        } catch (e) {
            this.errorHandler(e);
        }
    }

    checkDestinationQueue(): void {
        if (!this.elevator.isBusy()) {
            if (this.destinationQueue.length) {
                this.elevator.goToFloor(this.destinationQueue[0]);
            } else {
                this.tryTrigger("idle");
            }
        }
    }

    /** Queues a floor to travel to. `forceNow` jumps the queue. */
    goToFloor(floorNum: number, forceNow?: boolean): void {
        const target = limitNumber(Number(floorNum), 0, this.floorCount - 1);
        // Auto-prevent immediately duplicate destinations
        if (this.destinationQueue.length) {
            const adjacentElement = forceNow
                ? this.destinationQueue[0]
                : this.destinationQueue[this.destinationQueue.length - 1];
            if (epsilonEquals(target, adjacentElement)) {
                return;
            }
        }
        if (forceNow) {
            this.destinationQueue.unshift(target);
        } else {
            this.destinationQueue.push(target);
        }
        this.checkDestinationQueue();
    }

    /** Clears the queue and brings the elevator to a halt at the nearest floor. */
    stop(): void {
        this.destinationQueue = [];
        if (!this.elevator.isBusy()) {
            this.elevator.goToFloor(this.elevator.getExactFutureFloorIfStopped());
        }
    }

    /** @deprecated Undocumented, will be removed. Use {@link getPressedFloors}. */
    getFirstPressedFloor(): number {
        return this.elevator.getFirstPressedFloor();
    }

    getPressedFloors(): number[] {
        return this.elevator.getPressedFloors();
    }

    currentFloor(): number {
        return this.elevator.currentFloor;
    }

    maxPassengerCount(): number {
        return this.elevator.maxUsers;
    }

    /** 0 is empty, 1 is full. */
    loadFactor(): number {
        return this.elevator.getLoadFactor();
    }

    destinationDirection(): "stopped" | "up" | "down" {
        if (this.elevator.destinationY === this.elevator.y) {
            return "stopped";
        }
        return this.elevator.destinationY > this.elevator.y ? "down" : "up";
    }

    /** Getter, or chainable setter, for the up indicator lamp. */
    goingUpIndicator!: {
        (): boolean;
        (val: boolean): ElevatorInterface;
    };

    /** Getter, or chainable setter, for the down indicator lamp. */
    goingDownIndicator!: {
        (): boolean;
        (val: boolean): ElevatorInterface;
    };
}
