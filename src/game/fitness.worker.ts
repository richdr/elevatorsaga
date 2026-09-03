/// <reference lib="webworker" />
import { doFitnessSuite } from "./fitness";
import { installUserCodeGlobals } from "./lodash-global";

installUserCodeGlobals();

self.onmessage = (msg: MessageEvent<string>) => {
    // The message is player code that should be fitness-tested
    const results = doFitnessSuite(msg.data, 6);
    self.postMessage(results);
};
