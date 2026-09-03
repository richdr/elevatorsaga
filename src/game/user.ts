import { Movable, linearInterpolate, type MovableEvents } from "./movable";
import type { Elevator } from "./elevator";
import type { Floor } from "./floor";

export type UserDisplayType = "male" | "female" | "child";

export type UserEvents = Omit<MovableEvents, "new_state" | "new_display_state"> & {
    new_state: [movable?: Movable];
    new_display_state: [movable?: Movable];
    entered_elevator: [elevator: Elevator];
    exited_elevator: [elevator: Elevator];
};

/** A person waiting for, riding in, or leaving an elevator. */
export class User extends Movable<UserEvents> {
    readonly weight: number;
    currentFloor = 0;
    destinationFloor = 0;
    done = false;
    removeMe = false;
    displayType: UserDisplayType = "male";
    /** World time at which this user appeared. Set by the world when registered. */
    spawnTimestamp = 0;

    private exitAvailableHandler: ((floorNum: number, elevator: Elevator) => void) | null = null;

    constructor(weight: number) {
        super();
        this.weight = weight;
    }

    appearOnFloor(floor: Floor, destinationFloorNum: number): void {
        const floorPosY = floor.getSpawnPosY();
        this.currentFloor = floor.level;
        this.destinationFloor = destinationFloorNum;
        this.moveTo(null, floorPosY);
        this.pressFloorButton(floor);
    }

    pressFloorButton(floor: Floor): void {
        if (this.destinationFloor < this.currentFloor) {
            floor.pressDownButton();
        } else {
            floor.pressUpButton();
        }
    }

    handleExit(_floorNum: number, elevator: Elevator): void {
        if (elevator.currentFloor !== this.destinationFloor) {
            return;
        }
        elevator.userExiting(this);
        this.currentFloor = elevator.currentFloor;
        this.setParent(null);
        const destination = this.x + 100;
        this.done = true;
        this.trigger("exited_elevator", elevator);
        this.trigger("new_state");
        this.trigger("new_display_state");
        this.moveToOverTime(destination, null, 1 + Math.random() * 0.5, linearInterpolate, () => {
            this.removeMe = true;
            this.trigger("removed");
            this.off("*");
        });

        if (this.exitAvailableHandler) {
            elevator.off("exit_available", this.exitAvailableHandler);
        }
    }

    elevatorAvailable(elevator: Elevator, floor: Floor): void {
        if (this.done || this.parent !== null || this.isBusy()) {
            return;
        }

        if (!elevator.isSuitableForTravelBetween(this.currentFloor, this.destinationFloor)) {
            // Not suitable for travel - don't use this elevator
            return;
        }

        const pos = elevator.userEntering(this);
        if (pos) {
            this.setParent(elevator);
            this.trigger("entered_elevator", elevator);
            this.moveToOverTime(pos[0], pos[1], 1, undefined, () => {
                elevator.pressFloorButton(this.destinationFloor);
            });
            this.exitAvailableHandler = (_floorNum, elev) =>
                this.handleExit(elev.currentFloor, elev);
            elevator.on("exit_available", this.exitAvailableHandler);
        } else {
            this.pressFloorButton(floor);
        }
    }
}
