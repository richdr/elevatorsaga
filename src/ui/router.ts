/**
 * Hash-based routing, replacing `riot.route`. The URL format is unchanged:
 * `#challenge=3,autostart=true,timescale=4`.
 */
export type RouteParams = Record<string, string>;

const parseHash = (hash: string): RouteParams => {
    const path = hash.replace(/^#/, "");
    const params: RouteParams = {};
    for (const part of path.split(",")) {
        const match = part.match(/(\w+)=(\w+$)/);
        if (match) {
            params[match[1]] = match[2];
        }
    }
    return params;
};

/** Calls back immediately with the current params, and again on every change. */
export const onRoute = (cb: (params: RouteParams) => void): void => {
    const handle = () => cb(parseHash(window.location.hash));
    window.addEventListener("hashchange", handle);
    handle();
};

export const createParamsUrl = (current: RouteParams, overrides: RouteParams): string =>
    "#" +
    Object.entries({ ...current, ...overrides })
        .map(([key, val]) => `${key}=${val}`)
        .join(",");
