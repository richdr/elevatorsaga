/**
 * The code samples shown to players.
 *
 * Modern JavaScript: `const`/`let`, arrow functions, method shorthand and
 * native array methods. The original samples were ES5 and leaned on lodash,
 * which every browser that can run this game has not needed for a decade.
 *
 * Note that `_` is still available to player code - see `lodash-global.ts` -
 * so solutions written against the original still work. We just no longer
 * teach it.
 */

/** The starting solution shown to new players. */
export const DEFAULT_CODE = `{
    init(elevators, floors) {
        const elevator = elevators[0]; // Let's use the first elevator

        // Whenever the elevator is idle (has no more queued destinations) ...
        elevator.on("idle", () => {
            // let's go to all the floors (or did we forget one?)
            elevator.goToFloor(0);
            elevator.goToFloor(1);
        });
    },

    update(dt, elevators, floors) {
        // We normally don't need to do anything here
    },
}`;

/** A rough-and-ready solution, loaded with the `devtest` URL parameter. */
export const DEVTEST_CODE = `{
    init(elevators, floors) {
        // Pick whichever elevator looks least busy for a pickup on this floor.
        const scoreFor = (elevator, floorNum) => {
            const queued = elevator.destinationQueue.length;
            const load = elevator.loadFactor();
            return (
                (elevator.destinationQueue.includes(floorNum) ? 4 : 0) -
                queued * queued -
                load * load * 3
            );
        };

        const bestElevatorFor = (floorNum) =>
            elevators.reduce((best, elevator) =>
                scoreFor(elevator, floorNum) > scoreFor(best, floorNum) ? elevator : best,
            );

        for (const floor of floors) {
            floor.on("up_button_pressed down_button_pressed", () => {
                const elevator = bestElevatorFor(floor.floorNum());
                if (!elevator.destinationQueue.includes(floor.floorNum())) {
                    elevator.goToFloor(floor.floorNum());
                }
            });
        }

        for (const elevator of elevators) {
            elevator.on("floor_button_pressed", (floorNum) => {
                elevator.goToFloor(floorNum);
            });
            elevator.on("idle", () => {
                elevator.goToFloor(0);
            });
        }
    },

    update(dt, elevators, floors) {},
}`;
