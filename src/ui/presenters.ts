/** Binds the simulation's events to the DOM. Was `presenters.js`, minus jQuery. */
import { clear, escapeHtml, qs, qsa, setTransformPos } from "./dom";
import {
    renderChallenge,
    renderCodeStatus,
    renderElevator,
    renderElevatorButton,
    renderFeedback,
    renderFloor,
    renderUser,
    type ChallengeViewModel,
} from "./templates";
import type { World, WorldController } from "../game/world";
import type { Challenge } from "../game/challenges";
import type { Elevator } from "../game/elevator";
import type { User } from "../game/user";

export const presentStats = (parent: HTMLElement, world: World): void => {
    const transported = qs(".transportedcounter", parent);
    const elapsed = qs(".elapsedtime", parent);
    const perSec = qs(".transportedpersec", parent);
    const avgWait = qs(".avgwaittime", parent);
    const maxWait = qs(".maxwaittime", parent);
    const moves = qs(".movecount", parent);

    world.on("stats_display_changed", () => {
        transported.textContent = String(world.transportedCounter);
        elapsed.textContent = world.elapsedTime.toFixed(0) + "s";
        perSec.textContent = world.transportedPerSec.toPrecision(3);
        avgWait.textContent = world.avgWaitTime.toFixed(1) + "s";
        maxWait.textContent = world.maxWaitTime.toFixed(1) + "s";
        moves.textContent = String(world.moveCount);
    });
    world.trigger("stats_display_changed");
};

export interface ChallengeActions {
    startStopOrRestart(): void;
}

export const presentChallenge = (
    parent: HTMLElement,
    challenge: Challenge,
    app: ChallengeActions,
    world: World,
    worldController: WorldController,
    challengeNum: number,
): void => {
    const vm: ChallengeViewModel = {
        num: challengeNum,
        description: challenge.condition.description,
        timeScale: worldController.timeScale.toFixed(0) + "x",
        runState: world.challengeEnded ? "restart" : worldController.isPaused ? "start" : "pause",
    };
    parent.replaceChildren(renderChallenge(vm));

    qs(".startstop", parent).addEventListener("click", () => app.startStopOrRestart());
    qs(".timescale_increase", parent).addEventListener("click", (e) => {
        e.preventDefault();
        if (worldController.timeScale < 40) {
            worldController.setTimeScale(Math.round(worldController.timeScale * 1.618));
        }
    });
    qs(".timescale_decrease", parent).addEventListener("click", (e) => {
        e.preventDefault();
        worldController.setTimeScale(Math.round(worldController.timeScale / 1.618));
    });
};

export const presentFeedback = (
    parent: HTMLElement,
    title: string,
    message: string,
    url: string,
): void => {
    parent.replaceChildren(renderFeedback(title, message, url));
};

/**
 * Builds the world's DOM. Sizing is not set here - the world keeps the engine's
 * fixed pixel geometry and `createWorldScaler` scales it to fit.
 */
export const presentWorld = (worldElem: HTMLElement, world: World): void => {
    for (const floor of world.floors) {
        const floorElem = renderFloor(floor.level, floor.yPosition);
        const up = qs(".up", floorElem);
        const down = qs(".down", floorElem);
        floor.on("buttonstate_change", (buttonStates) => {
            up.classList.toggle("activated", buttonStates.up !== "");
            down.classList.toggle("activated", buttonStates.down !== "");
        });
        up.addEventListener("click", () => floor.pressUpButton());
        down.addEventListener("click", () => floor.pressDownButton());
        worldElem.append(floorElem);
    }

    const floorElems = qsa(".floor", worldElem);
    if (floorElems.length) {
        qs(".down", floorElems[0]).classList.add("invisible");
        qs(".up", floorElems[floorElems.length - 1]).classList.add("invisible");
    }

    for (const elevator of world.elevators) {
        worldElem.append(setUpElevator(elevator));
    }

    world.on("new_user", (user: User) => {
        const userElem = renderUser(user.displayType, user.done ? "leaving" : "");
        user.on("new_display_state", () => {
            setTransformPos(userElem, user.worldX, user.worldY);
            if (user.done) {
                userElem.classList.add("leaving");
            }
        });
        user.on("removed", () => userElem.remove());
        worldElem.append(userElem);
    });
};

const setUpElevator = (e: Elevator): HTMLElement => {
    const elevatorElem = renderElevator(e.width);
    const buttonIndicator = qs(".buttonindicator", elevatorElem);
    // A rarely executed inner loop, so it does not need to be efficient
    buttonIndicator.innerHTML = e.buttonStates.map((_b, i) => renderElevatorButton(i)).join("");
    const buttons = Array.from(buttonIndicator.children);
    const floorIndicator = qs(".floorindicator > span", elevatorElem);
    const upIndicator = qs(".directionindicatorup .icon", elevatorElem);
    const downIndicator = qs(".directionindicatordown .icon", elevatorElem);

    elevatorElem.addEventListener("click", (event) => {
        const target = (event.target as HTMLElement).closest(".buttonpress");
        if (target) {
            e.pressFloorButton(parseInt(target.textContent ?? "0", 10));
        }
    });
    e.on("new_display_state", () => setTransformPos(elevatorElem, e.worldX, e.worldY));
    e.on("new_current_floor", (floor) => {
        floorIndicator.textContent = String(floor);
    });
    e.on("floor_buttons_changed", (states, indexChanged) => {
        buttons[indexChanged]?.classList.toggle("activated", states[indexChanged]);
    });
    e.on("indicatorstate_change", (indicatorStates) => {
        upIndicator.classList.toggle("activated", indicatorStates.up);
        downIndicator.classList.toggle("activated", indicatorStates.down);
    });
    e.trigger("new_state", e);
    e.trigger("new_display_state", e);
    e.trigger("new_current_floor", e.currentFloor);
    return elevatorElem;
};

export const presentCodeStatus = (parent: HTMLElement, error?: unknown): void => {
    let message: string | null = null;
    if (error) {
        const stack = (error as { stack?: string }).stack;
        message = escapeHtml(stack ?? error).replace(/\n/g, "<br>");
    }
    parent.replaceChildren(renderCodeStatus(message));
};

export const clearAll = clear;
