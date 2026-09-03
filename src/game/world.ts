import { Observable } from "./observable";
import { Elevator } from "./elevator";
import { Floor, type UserCodeErrorHandler } from "./floor";
import { ElevatorInterface } from "./interfaces";
import { User } from "./user";
import { mapRange, randomInt } from "./util";
import type { UserCodeObject } from "./usercode";
import type { FrameRequester } from "./util";

export interface WorldOptions {
    floorHeight?: number;
    floorCount?: number;
    elevatorCount?: number;
    spawnRate?: number;
    elevatorCapacities?: number[];
    /** Only used by the fitness scenarios, for labelling results. */
    description?: string;
}

const DEFAULT_OPTIONS = {
    floorHeight: 50,
    floorCount: 4,
    elevatorCount: 2,
    spawnRate: 0.5,
} satisfies WorldOptions;

export type WorldEvents = {
    usercode_error: [e: unknown];
    stats_changed: [];
    stats_display_changed: [];
    new_user: [user: User];
};

export const createFloors = (
    floorCount: number,
    floorHeight: number,
    errorHandler: UserCodeErrorHandler,
): Floor[] =>
    mapRange(floorCount, (i) => new Floor(i, (floorCount - 1 - i) * floorHeight, errorHandler));

export const createElevators = (
    elevatorCount: number,
    floorCount: number,
    floorHeight: number,
    elevatorCapacities: number[] = [4],
): Elevator[] => {
    let currentX = 200.0;
    return mapRange(elevatorCount, (i) => {
        const elevator = new Elevator(
            2.6,
            floorCount,
            floorHeight,
            elevatorCapacities[i % elevatorCapacities.length],
        );
        // Move to the right x position
        elevator.moveTo(currentX, null);
        elevator.setFloorPosition(0);
        elevator.updateDisplayPosition();
        currentX += 20 + elevator.width;
        return elevator;
    });
};

export const createRandomUser = (): User => {
    const user = new User(randomInt(55, 100));
    if (randomInt(40) === 0) {
        user.displayType = "child";
    } else if (randomInt(1) === 0) {
        user.displayType = "female";
    } else {
        user.displayType = "male";
    }
    return user;
};

export const spawnUserRandomly = (floorCount: number, floors: Floor[]): User => {
    const user = createRandomUser();
    user.moveTo(105 + randomInt(40), 0);
    const currentFloor = randomInt(1) === 0 ? 0 : randomInt(floorCount - 1);
    let destinationFloor: number;
    if (currentFloor === 0) {
        // Definitely going up
        destinationFloor = randomInt(1, floorCount - 1);
    } else if (randomInt(10) === 0) {
        // Usually going down, but sometimes not
        destinationFloor = (currentFloor + randomInt(1, floorCount - 1)) % floorCount;
    } else {
        destinationFloor = 0;
    }
    user.appearOnFloor(floors[currentFloor], destinationFloor);
    return user;
};

/** The simulated building: floors, elevators, and the people using them. */
export class World extends Observable<WorldEvents> {
    readonly floorHeight: number;
    floors: Floor[];
    elevators: Elevator[];
    elevatorInterfaces: ElevatorInterface[];
    users: User[] = [];

    transportedCounter = 0;
    transportedPerSec = 0.0;
    moveCount = 0;
    elapsedTime = 0.0;
    maxWaitTime = 0.0;
    avgWaitTime = 0.0;
    challengeEnded = false;

    private readonly spawnRate: number;
    private readonly floorCount: number;
    private elapsedSinceSpawn: number;

    constructor(options: WorldOptions = {}) {
        super();
        const opts = { ...DEFAULT_OPTIONS, ...options };
        this.floorHeight = opts.floorHeight;
        this.floorCount = opts.floorCount;
        this.spawnRate = opts.spawnRate;
        this.elapsedSinceSpawn = 1.001 / opts.spawnRate;

        const handleUserCodeError: UserCodeErrorHandler = (e) => {
            this.trigger("usercode_error", e);
        };

        this.floors = createFloors(opts.floorCount, this.floorHeight, handleUserCodeError);
        this.elevators = createElevators(
            opts.elevatorCount,
            opts.floorCount,
            this.floorHeight,
            opts.elevatorCapacities,
        );
        this.elevatorInterfaces = this.elevators.map(
            (e) => new ElevatorInterface(e, opts.floorCount, handleUserCodeError),
        );

        // One shared handler instance per event, not one per subscriber: the emitter's
        // re-entrancy guard lives on the function object, and the original relied on it.
        const onElevAvailability = (e: Elevator) => this.handleElevAvailability(e);
        for (const elevator of this.elevators) {
            elevator.on("entrance_available", onElevAvailability);
        }

        // This makes elevators "re-arrive" at a floor if someone presses an appropriate
        // button there before the elevator has left.
        const onButtonRepressing = (eventName: string, f: Floor) =>
            this.handleButtonRepressing(eventName, f);
        for (const floor of this.floors) {
            floor.on("up_button_pressed down_button_pressed", onButtonRepressing);
        }
    }

    private recalculateStats(): void {
        this.transportedPerSec = this.transportedCounter / this.elapsedTime;
        // TODO: Optimize this loop?
        this.moveCount = this.elevators.reduce((sum, elevator) => sum + elevator.moveCount, 0);
        this.trigger("stats_changed");
    }

    private registerUser(user: User): void {
        this.users.push(user);
        user.updateDisplayPosition(true);
        user.spawnTimestamp = this.elapsedTime;
        this.trigger("new_user", user);
        user.on("exited_elevator", () => {
            this.transportedCounter++;
            this.maxWaitTime = Math.max(
                this.maxWaitTime,
                this.elapsedTime - user.spawnTimestamp,
            );
            this.avgWaitTime =
                (this.avgWaitTime * (this.transportedCounter - 1) +
                    (this.elapsedTime - user.spawnTimestamp)) /
                this.transportedCounter;
            this.recalculateStats();
        });
        user.updateDisplayPosition(true);
    }

    private handleElevAvailability(elevator: Elevator): void {
        // Regular loops, for memory and performance reasons.
        // Notify floors first, because overflowing users will press buttons again.
        for (let i = 0, len = this.floors.length; i < len; ++i) {
            if (elevator.currentFloor === i) {
                this.floors[i].elevatorAvailable(elevator);
            }
        }
        for (let users = this.users, i = 0, len = users.length; i < len; ++i) {
            const user = users[i];
            if (user.currentFloor === elevator.currentFloor) {
                user.elevatorAvailable(elevator, this.floors[elevator.currentFloor]);
            }
        }
    }

    private handleButtonRepressing(eventName: string, floor: Floor): void {
        // Randomize the iteration order, or we tend to fill up the first elevator
        for (
            let i = 0, len = this.elevators.length, offset = randomInt(len - 1);
            i < len;
            ++i
        ) {
            const elevIndex = (i + offset) % len;
            const elevator = this.elevators[elevIndex];
            if (
                (eventName === "up_button_pressed" && elevator.goingUpIndicator) ||
                (eventName === "down_button_pressed" && elevator.goingDownIndicator)
            ) {
                // Heading in the right direction, so check for suitability
                if (
                    elevator.currentFloor === floor.level &&
                    elevator.isOnAFloor() &&
                    !elevator.isMoving &&
                    !elevator.isFull()
                ) {
                    // Potentially suitable to get into. Use the interface queue so the
                    // action is queued rather than applied directly.
                    this.elevatorInterfaces[elevIndex].goToFloor(floor.level, true);
                    return;
                }
            }
        }
    }

    update(dt: number): void {
        this.elapsedTime += dt;
        this.elapsedSinceSpawn += dt;
        while (this.elapsedSinceSpawn > 1.0 / this.spawnRate) {
            this.elapsedSinceSpawn -= 1.0 / this.spawnRate;
            this.registerUser(spawnUserRandomly(this.floorCount, this.floors));
        }

        // Regular for loops, for performance and memory friendliness
        for (let i = 0, len = this.elevators.length; i < len; ++i) {
            const e = this.elevators[i];
            e.update(dt);
            e.updateElevatorMovement(dt);
        }
        for (let users = this.users, i = 0, len = users.length; i < len; ++i) {
            const u = users[i];
            u.update(dt);
            this.maxWaitTime = Math.max(this.maxWaitTime, this.elapsedTime - u.spawnTimestamp);
        }

        for (let users = this.users, i = users.length - 1; i >= 0; i--) {
            if (users[i].removeMe) {
                users.splice(i, 1);
            }
        }

        this.recalculateStats();
    }

    updateDisplayPositions(): void {
        for (let i = 0, len = this.elevators.length; i < len; ++i) {
            this.elevators[i].updateDisplayPosition();
        }
        for (let users = this.users, i = 0, len = users.length; i < len; ++i) {
            users[i].updateDisplayPosition();
        }
    }

    unWind(): void {
        const everything: { off: (events: string) => unknown }[] = [
            ...this.elevators,
            ...this.elevatorInterfaces,
            ...this.users,
            ...this.floors,
            this,
        ];
        for (const obj of everything) {
            obj.off("*");
        }
        this.challengeEnded = true;
        this.elevators = [];
        this.elevatorInterfaces = [];
        this.users = [];
        this.floors = [];
    }

    init(): void {
        // Checking the destination queue is what triggers the initial idle events
        for (const elevatorInterface of this.elevatorInterfaces) {
            elevatorInterface.checkDestinationQueue();
        }
    }
}

/** Minimum surface the controller needs. Kept narrow so tests can fake it. */
export interface SimulationWorld {
    challengeEnded: boolean;
    elevatorInterfaces?: ElevatorInterface[];
    floors?: Floor[];
    on(events: string, fn: (...args: any[]) => void): unknown;
    trigger(event: string, ...args: any[]): unknown;
    update(dt: number): void;
    init(): void;
    updateDisplayPositions(): void;
}

export type WorldControllerEvents = {
    usercode_error: [e: unknown];
    timescale_changed: [];
};

/** Drives a world forward in time, and isolates the page from errors in player code. */
export class WorldController extends Observable<WorldControllerEvents> {
    timeScale = 1.0;
    isPaused = true;

    private readonly dtMax: number;

    constructor(dtMax: number) {
        super();
        this.dtMax = dtMax;
    }

    start(
        world: SimulationWorld,
        codeObj: UserCodeObject,
        animationFrameRequester: FrameRequester,
        autoStart?: boolean,
    ): void {
        this.isPaused = true;
        let lastT: number | null = null;
        let firstUpdate = true;
        world.on("usercode_error", (e: unknown) => this.handleUserCodeError(e));

        const updater = (t: number): void => {
            if (!this.isPaused && !world.challengeEnded && lastT !== null) {
                if (firstUpdate) {
                    firstUpdate = false;
                    // Deferring the first evaluation of player code until the game is
                    // unpaused stops an infinite loop in it from breaking the page
                    // permanently.
                    try {
                        codeObj.init(world.elevatorInterfaces!, world.floors!);
                        world.init();
                    } catch (e) {
                        this.handleUserCodeError(e);
                    }
                }

                const dt = t - lastT;
                let scaledDt = dt * 0.001 * this.timeScale;
                // Limit to prevent unhealthy substepping
                scaledDt = Math.min(scaledDt, this.dtMax * 3 * this.timeScale);
                try {
                    codeObj.update(scaledDt, world.elevatorInterfaces!, world.floors!);
                } catch (e) {
                    this.handleUserCodeError(e);
                }
                while (scaledDt > 0.0 && !world.challengeEnded) {
                    world.update(Math.min(this.dtMax, scaledDt));
                    scaledDt -= this.dtMax;
                }
                world.updateDisplayPositions();
                // TODO: Trigger less often, for performance reasons
                world.trigger("stats_display_changed");
            }
            lastT = t;
            if (!world.challengeEnded) {
                animationFrameRequester(updater);
            }
        };

        if (autoStart) {
            this.setPaused(false);
        }
        animationFrameRequester(updater);
    }

    handleUserCodeError(e: unknown): void {
        this.setPaused(true);
        console.log("Usercode error on update", e);
        this.trigger("usercode_error", e);
    }

    setPaused(paused: boolean): void {
        this.isPaused = paused;
        this.trigger("timescale_changed");
    }

    setTimeScale(timeScale: number): void {
        this.timeScale = timeScale;
        this.trigger("timescale_changed");
    }
}

export const createWorldController = (dtMax: number): WorldController => new WorldController(dtMax);
