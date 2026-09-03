import "@fontsource/oswald/300.css";
import "@fontsource/oswald/400.css";
import "@fontsource/oswald/700.css";
import "./styles/style.css";

import { World, WorldController } from "./game/world";
import { challenges } from "./game/challenges";
import { installUserCodeGlobals } from "./game/lodash-global";
import { CodeEditor } from "./ui/editor";
import {
    clearAll,
    presentChallenge,
    presentCodeStatus,
    presentFeedback,
    presentStats,
    presentWorld,
} from "./ui/presenters";
import { createParamsUrl, onRoute, type RouteParams } from "./ui/router";
import { qs, qsa } from "./ui/dom";

const TIMESCALE_KEY = "elevatorTimeScale";

installUserCodeGlobals();

const worldElem = qs(".innerworld");
const statsElem = qs(".statscontainer");
const feedbackElem = qs(".feedbackcontainer");
const challengeElem = qs(".challenge");
const codeStatusElem = qs(".codestatus");
const saveMessageElem = qs("#save_message");

const editor = new CodeEditor(qs("#code"));

const worldController = new WorldController(1.0 / 60.0);
worldController.on("usercode_error", (e) => {
    console.log("World raised code error", e);
    editor.trigger("usercode_error", e);
});

let params: RouteParams = {};
let world: World | undefined;
let currentChallengeIndex = 0;

const app = {
    startStopOrRestart(): void {
        if (world?.challengeEnded) {
            startChallenge(currentChallengeIndex);
        } else {
            worldController.setPaused(!worldController.isPaused);
        }
    },
};

const startChallenge = (challengeIndex: number, autoStart?: boolean): void => {
    world?.unWind();
    currentChallengeIndex = challengeIndex;
    const challenge = challenges[challengeIndex];
    world = new World(challenge.options);

    clearAll(worldElem, feedbackElem);
    presentStats(statsElem, world);
    presentChallenge(challengeElem, challenge, app, world, worldController, challengeIndex + 1);
    presentWorld(worldElem, world);

    world.on("stats_changed", () => {
        const challengeStatus = challenge.condition.evaluate(world!);
        if (challengeStatus !== null) {
            world!.challengeEnded = true;
            worldController.setPaused(true);
            if (challengeStatus) {
                presentFeedback(
                    feedbackElem,
                    "Success!",
                    "Challenge completed",
                    createParamsUrl(params, { challenge: String(challengeIndex + 2) }),
                );
            } else {
                presentFeedback(
                    feedbackElem,
                    "Challenge failed",
                    "Maybe your program needs an improvement?",
                    "",
                );
            }
        }
    });

    const codeObj = editor.getCodeObj();
    if (codeObj) {
        worldController.start(world, codeObj, window.requestAnimationFrame, autoStart);
    }
};

qs("#button_apply").addEventListener("click", () => editor.trigger("apply_code"));
qs("#button_save").addEventListener("click", () => {
    editor.save();
    editor.focus();
});
qs("#button_reset").addEventListener("click", () => {
    if (confirm("Do you really want to reset to the default implementation?")) {
        editor.reset();
    }
    editor.focus();
});
qs("#button_resetundo").addEventListener("click", () => {
    if (confirm("Do you want to bring back the code as before the last reset?")) {
        editor.undoReset();
    }
    editor.focus();
});

// Registered once, not per challenge: the controller outlives every world.
worldController.on("timescale_changed", () => {
    localStorage.setItem(TIMESCALE_KEY, String(worldController.timeScale));
    if (world) {
        presentChallenge(
            challengeElem,
            challenges[currentChallengeIndex],
            app,
            world,
            worldController,
            currentChallengeIndex + 1,
        );
    }
});

editor.on("apply_code", () => startChallenge(currentChallengeIndex, true));
editor.on("code_success", () => presentCodeStatus(codeStatusElem));
editor.on("usercode_error", (error) => presentCodeStatus(codeStatusElem, error));
editor.on("saved", (at: Date) => {
    saveMessageElem.textContent = "Code saved " + at.toTimeString();
});

const makeDemoFullscreen = (): void => {
    for (const child of qsa(".container > *")) {
        if (!child.classList.contains("world")) {
            child.style.visibility = "hidden";
        }
    }
    document.body.classList.add("fullscreen-demo");
};

onRoute((routeParams) => {
    params = routeParams;
    let requestedChallenge = 0;
    let autoStart = false;
    let timeScale = parseFloat(localStorage.getItem(TIMESCALE_KEY) ?? "") || 2.0;

    for (const [key, val] of Object.entries(params)) {
        if (key === "challenge") {
            requestedChallenge = parseInt(val, 10) - 1;
            if (requestedChallenge < 0 || requestedChallenge >= challenges.length) {
                console.log("Invalid challenge index", requestedChallenge);
                console.log("Defaulting to first challenge");
                requestedChallenge = 0;
            }
        } else if (key === "autostart") {
            autoStart = val !== "false";
        } else if (key === "timescale") {
            timeScale = parseFloat(val);
        } else if (key === "devtest") {
            editor.setDevTestCode();
        } else if (key === "fullscreen") {
            makeDemoFullscreen();
        }
    }
    worldController.setTimeScale(timeScale);
    startChallenge(requestedChallenge, autoStart);
});
