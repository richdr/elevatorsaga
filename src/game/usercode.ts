import type { ElevatorInterface } from "./interfaces";
import type { Floor } from "./floor";

/** The object a player's code evaluates to. */
export interface UserCodeObject {
    init(elevators: ElevatorInterface[], floors: Floor[]): void;
    update(dt: number, elevators: ElevatorInterface[], floors: Floor[]): void;
}

/**
 * Evaluates the player's source into a code object.
 *
 * Deliberately an indirect `eval`, so player code is evaluated in global scope
 * and can see the `_` that `installUserCodeGlobals()` puts there. The contract
 * is unchanged from the original game: an object literal with `init` and
 * `update`, optionally wrapped in parentheses.
 */
export const getCodeObjFromCode = (code: string): UserCodeObject => {
    const trimmed = code.trim();
    const source = trimmed.startsWith("{") && trimmed.endsWith("}") ? "(" + code + ")" : code;

    // `globalThis.eval` rather than a bare `eval`, so this is an *indirect* eval:
    // player code is evaluated in global scope, where `_` lives.
    const obj = globalThis.eval(source) as UserCodeObject;

    if (typeof obj?.init !== "function") {
        throw "Code must contain an init function";
    }
    if (typeof obj?.update !== "function") {
        throw "Code must contain an update function";
    }
    return obj;
};
