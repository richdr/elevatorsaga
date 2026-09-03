import { Observable } from "./observable";
import type { Elevator } from "./elevator";

export interface ButtonStates {
    up: string;
    down: string;
}

export type FloorEvents = {
    /** A floor call button changed state. */
    buttonstate_change: [buttonStates: ButtonStates];
    /** Someone on this floor wants to go up. */
    up_button_pressed: [floor: Floor];
    /** Someone on this floor wants to go down. */
    down_button_pressed: [floor: Floor];
};

export type UserCodeErrorHandler = (e: unknown) => void;

const rethrow: UserCodeErrorHandler = (e) => {
    throw e;
};

/** A floor of the building, as exposed to player code. */
export class Floor extends Observable<FloorEvents> {
    readonly level: number;
    readonly yPosition: number;
    readonly buttonStates: ButtonStates = { up: "", down: "" };

    private readonly errorHandler: UserCodeErrorHandler;

    constructor(level: number, yPosition: number, errorHandler: UserCodeErrorHandler = rethrow) {
        super();
        this.level = level;
        this.yPosition = yPosition;
        this.errorHandler = errorHandler;
    }

    /** Triggers an event, funnelling any error thrown by player code to the handler. */
    private tryTrigger(event: string, ...args: any[]): void {
        try {
            this.trigger(event, ...args);
        } catch (e) {
            this.errorHandler(e);
        }
    }

    pressUpButton(): void {
        const prev = this.buttonStates.up;
        this.buttonStates.up = "activated";
        if (prev !== this.buttonStates.up) {
            this.tryTrigger("buttonstate_change", this.buttonStates);
            this.tryTrigger("up_button_pressed", this);
        }
    }

    pressDownButton(): void {
        const prev = this.buttonStates.down;
        this.buttonStates.down = "activated";
        if (prev !== this.buttonStates.down) {
            this.tryTrigger("buttonstate_change", this.buttonStates);
            this.tryTrigger("down_button_pressed", this);
        }
    }

    elevatorAvailable(elevator: Elevator): void {
        if (elevator.goingUpIndicator && this.buttonStates.up) {
            this.buttonStates.up = "";
            this.tryTrigger("buttonstate_change", this.buttonStates);
        }
        if (elevator.goingDownIndicator && this.buttonStates.down) {
            this.buttonStates.down = "";
            this.tryTrigger("buttonstate_change", this.buttonStates);
        }
    }

    getSpawnPosY(): number {
        return this.yPosition + 30;
    }

    /** The floor's number. Part of the player-facing API. */
    floorNum(): number {
        return this.level;
    }
}
