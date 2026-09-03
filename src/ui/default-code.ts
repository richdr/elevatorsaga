/** The starting solution shown to new players. */
export const DEFAULT_CODE = `{
    init: function(elevators, floors) {
        var elevator = elevators[0]; // Let's use the first elevator

        // Whenever the elevator is idle (has no more queued destinations) ...
        elevator.on("idle", function() {
            // let's go to all the floors (or did we forget one?)
            elevator.goToFloor(0);
            elevator.goToFloor(1);
        });
    },
    update: function(dt, elevators, floors) {
        // We normally don't need to do anything here
    }
}`;

/** A rough-and-ready solution, loaded with the `devtest` URL parameter. */
export const DEVTEST_CODE = `{
    init: function(elevators, floors) {
        var selectElevatorForFloorPickup = function(floorNum) {
            return _.max(elevators, function(e) {
                return (_.contains(e.destinationQueue, floorNum) ? 4 : 0) +
                    (-e.destinationQueue.length*e.destinationQueue.length) +
                    (-e.loadFactor()*e.loadFactor() * 3);
            });
        };

        _.each(floors, function(floor) {
            floor.on("down_button_pressed up_button_pressed", function() {
                var elevator = selectElevatorForFloorPickup(floor.level);
                if(!_.contains(elevator.destinationQueue, floor.level)) {
                    elevator.goToFloor(floor.level);
                }
            });
        });
        _.each(elevators, function(elevator) {
            elevator.on("floor_button_pressed", function(floorNum) {
                elevator.goToFloor(floorNum);
            });
            elevator.on("idle", function() {
                elevator.goToFloor(0);
            });
        });
    },
    update: function(dt, elevators, floors) {
    }
}`;
