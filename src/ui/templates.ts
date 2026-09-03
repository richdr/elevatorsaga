/**
 * Render functions for the game's DOM, replacing the `riot.render` string
 * templates that used to live in `<script type="text/template">` blocks in
 * index.html. Same markup and class names, but typed and in one place.
 */
import { html, escapeHtml } from "./dom";
import { icon, type IconName } from "./icons";
import type { UserDisplayType } from "../game/user";

const DISPLAY_TYPE_ICONS: Record<UserDisplayType, IconName> = {
    male: "male",
    female: "female",
    child: "child",
};

export const renderUser = (displayType: UserDisplayType, state: string): HTMLElement =>
    html(`<span class="movable user ${state}">${icon(DISPLAY_TYPE_ICONS[displayType])}</span>`);

export const renderFloor = (level: number, yPosition: number): HTMLElement =>
    html(`
        <div class="floor" style="top: ${yPosition}px">
            <span class="floornumber">${level}</span>
            <span class="buttonindicator">
                <button class="iconbutton up" type="button" aria-label="Call elevator going up">${icon("arrowCircleUp")}</button>
                <button class="iconbutton down" type="button" aria-label="Call elevator going down">${icon("arrowCircleDown")}</button>
            </span>
        </div>
    `);

export const renderElevator = (width: number): HTMLElement =>
    html(`
        <div class="elevator movable" style="width: ${width}px">
            <span class="directionindicator directionindicatorup">${icon("arrowCircleUp", "up activated")}</span>
            <span class="floorindicator"><span></span></span>
            <span class="directionindicator directionindicatordown">${icon("arrowCircleDown", "down activated")}</span>
            <span class="buttonindicator"></span>
        </div>
    `);

export const renderElevatorButton = (floorNum: number): string =>
    `<span class="buttonpress">${floorNum}</span>`;

export const renderFeedback = (title: string, message: string, url: string): HTMLElement =>
    html(`
        <div class="feedback">
            <h2 class="emphasis-color">${escapeHtml(title)}</h2>
            <p class="emphasis-color">${escapeHtml(message)}</p>
            ${
                url
                    ? `<a href="${escapeHtml(url)}" class="emphasis-color">Next challenge ${icon("caretRight", "blink")}</a>`
                    : ""
            }
        </div>
    `);

export interface ChallengeViewModel {
    num: number;
    description: string;
    timeScale: string;
    startButtonText: string;
    startButtonIsRestart: boolean;
}

export const renderChallenge = (vm: ChallengeViewModel): HTMLElement =>
    html(`
        <div class="challengebar">
            <h2 class="challengetitle">Challenge #${vm.num}: ${vm.description}</h2>
            <div class="challengecontrols">
                <button class="startstop unselectable" type="button">${
                    vm.startButtonIsRestart ? icon("repeat") + " " : ""
                }${escapeHtml(vm.startButtonText)}</button>
                <div class="timescale">
                    <button class="iconbutton timescale_decrease unselectable" type="button" aria-label="Slow down">${icon("minusSquare")}</button>
                    <span class="emphasis-color timescale_value">${escapeHtml(vm.timeScale)}</span>
                    <button class="iconbutton timescale_increase unselectable" type="button" aria-label="Speed up">${icon("plusSquare")}</button>
                </div>
            </div>
        </div>
    `);

export const renderCodeStatus = (errorMessage: string | null): HTMLElement =>
    html(`
        <p class="error" style="display: ${errorMessage ? "block" : "none"}">
            ${icon("warning", "error-color")} There is a problem with your code: ${errorMessage ?? ""}
        </p>
    `);
