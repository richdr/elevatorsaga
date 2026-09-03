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
import { qs } from "./ui/dom";
import {
    createViewToggle,
    createWorldScaler,
    installHints,
    installKeyboardInset,
    type WorldMetrics,
} from "./ui/layout";
import { installSymbolBar } from "./ui/symbolbar";
import { installHelpSheet } from "./ui/helpsheet";

const TIMESCALE_KEY = "elevatorTimeScale";

/** Horizontal room the original reserved for the world, in engine pixels. */
const MIN_WORLD_WIDTH = 938;

/** Space past the rightmost elevator for people leaving it. */
const WALK_OUT_ROOM = 140;

installUserCodeGlobals();

const worldElem = qs(".innerworld");
const worldViewport = qs(".worldviewport");
const worldSizerElem = qs(".worldsizer");
const worldScalerElem = qs(".worldscaler");
const worldPane = qs(".pane-world");
const statsElem = qs(".statscontainer");
const feedbackElem = qs(".feedbackcontainer");
const challengeElem = qs(".challenge");
const codeStatusElem = qs(".codestatus");
const saveMessageElem = qs("#save_message");

const editor = new CodeEditor(qs("#code"));
const view = createViewToggle();
const worldScaler = createWorldScaler(
    worldViewport,
    worldSizerElem,
    worldScalerElem,
    worldPane,
    statsElem,
);

installSymbolBar(editor);
installHelpSheet();
installHints();
installKeyboardInset();

// The world is only measurable once it is on screen, so re-fit when it appears.
view.onChange(() => worldScaler.refresh());

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
        // Watching is the point of pressing start.
        view.set("world");
    },
};

/**
 * The world's coordinate space. The original hardcoded 938px; this widens to
 * whatever the elevators actually need, so a future challenge with more or
 * wider elevators cannot run off the edge.
 */
const measureWorld = (w: World): WorldMetrics => {
    const rightmost = Math.max(0, ...w.elevators.map((e) => e.x + e.width));
    return {
        width: Math.max(MIN_WORLD_WIDTH, rightmost + 20),
        // Room for the people who walk out of the rightmost elevator: `handleExit`
        // sends them 100px further, and they need a little space after that.
        tightWidth: Math.min(MIN_WORLD_WIDTH, rightmost + WALK_OUT_ROOM),
        height: w.floors.length * w.floorHeight,
    };
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
    worldScaler.setMetrics(measureWorld(world));

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

editor.on("apply_code", () => {
    // Applying means "run it" - show the run.
    view.set("world");
    startChallenge(currentChallengeIndex, true);
});
editor.on("code_success", () => presentCodeStatus(codeStatusElem));
editor.on("usercode_error", (error) => {
    presentCodeStatus(codeStatusElem, error);
    // The error is only actionable next to the code that caused it.
    view.set("code");
});
editor.on("saved", (at: Date) => {
    saveMessageElem.textContent = "Saved " + at.toLocaleTimeString();
});

const makeDemoFullscreen = (): void => {
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
