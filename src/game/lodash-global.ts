/**
 * Exposes `_` to player code.
 *
 * The game itself no longer uses lodash, but the original bundled lodash 3.6
 * and published solutions lean on it heavily — `_.each`, `_.max(list, fn)`,
 * `_.contains`. Dropping it would silently break every solution in the wiki.
 *
 * We ship lodash 4 (maintained) plus the handful of lodash 3 names that were
 * removed or changed meaning in 4. Only the compatibility layer is documented
 * here; everything else comes straight from lodash 4.
 */
import * as lodash from "lodash-es";

type AnyFn = (...args: any[]) => any;
type Lodash3 = typeof lodash & Record<string, AnyFn>;

const compat = (): Lodash3 => {
    const _ = { ...lodash } as Lodash3;

    // Renamed in lodash 4.
    _.contains = lodash.includes;
    _.include = lodash.includes;
    _.any = lodash.some;
    _.all = lodash.every;
    _.select = lodash.filter;
    _.detect = lodash.find;
    _.foldl = lodash.reduce;
    _.inject = lodash.reduce;
    _.foldr = lodash.reduceRight;
    _.collect = lodash.map;
    _.unique = lodash.uniq;
    _.pluck = (collection: any, path: any) => lodash.map(collection, path);
    _.indexBy = lodash.keyBy;
    _.pairs = lodash.toPairs;
    _.object = lodash.fromPairs;
    _.where = (collection: any, source: any) => lodash.filter(collection, lodash.matches(source));
    _.findWhere = (collection: any, source: any) => lodash.find(collection, lodash.matches(source));
    _.sortByAll = lodash.sortBy;
    _.trunc = lodash.truncate;

    // `_.rest` means something else entirely in lodash 4 (it wraps a function),
    // so it has to be replaced rather than aliased.
    _.rest = lodash.tail as AnyFn;

    // lodash 4 split the iteratee forms of these into separate functions.
    _.max = (collection: any, iteratee?: any) =>
        iteratee === undefined ? lodash.max(collection) : lodash.maxBy(collection, iteratee);
    _.min = (collection: any, iteratee?: any) =>
        iteratee === undefined ? lodash.min(collection) : lodash.minBy(collection, iteratee);
    _.sum = (collection: any, iteratee?: any) =>
        iteratee === undefined ? lodash.sum(collection) : lodash.sumBy(collection, iteratee);
    _.pick = (object: any, ...rest: any[]) =>
        typeof rest[0] === "function"
            ? lodash.pickBy(object, rest[0])
            : (lodash.pick as AnyFn)(object, ...rest);
    _.omit = (object: any, ...rest: any[]) =>
        typeof rest[0] === "function"
            ? lodash.omitBy(object, rest[0])
            : (lodash.omit as AnyFn)(object, ...rest);

    return _;
};

/** Installs `_` as a global so evaluated player code can use it. */
export const installUserCodeGlobals = (
    scope: Record<string, unknown> = globalThis as any,
): void => {
    if (!scope._) {
        scope._ = compat();
    }
};
