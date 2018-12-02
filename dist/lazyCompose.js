"use strict";
/**
 * Unary function type
 */
Object.defineProperty(exports, "__esModule", { value: true });
var _a;
var internalSymbol = Symbol('@sha/lazy-composition');
exports.internalSymbol = internalSymbol;
/**
 * @param args
 */
function compose() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    var length = args.length;
    var trimed = args.filter(function (f) { return f !== exports.identity; });
    if (trimed.length < args.length)
        // @ts-ignore
        return compose.apply(void 0, trimed);
    if (length === 0)
        return exports.identity;
    if (length === 1)
        return args[0];
    if (length === 2)
        return composeCache(args[0], args[1]);
    // copy all the parts to not mutate one,
    // args could be passed via apply method
    var result = compose(args[args.length - 2], args[args.length - 1]);
    for (var i = args.length - 3; i >= 0; i--) {
        // @ts-ignore
        result = compose(args[i], result);
    }
    return result;
}
exports.identity = function (value) { return value; };
/**
 * Module memory
 */
var functions = new Map();
var compositionsByHash = new Map();
var composeCache = (function () {
    var counter = 0;
    var generateFunctionHash = function (f) {
        if (f.name)
            return f.name + (counter++);
        var hash = 'f' + (counter++);
        //console.warn(`Function has no name, this could be a cause of cache memory leaks.
        //                Registered hash = ${hash} . Body `, f)
        return hash;
    };
    var getFunctionHash = function (f) {
        if (functions.has(f))
            return functions.get(f);
        var hash = generateFunctionHash(f);
        functions.set(f, hash);
        return hash;
    };
    // Recusively calcalate hash based on function name
    var getHash = function (tail, head) {
        var tailHash = isComposition(tail)
            ? tail[internalSymbol].hash
            : getFunctionHash(tail);
        var headHash = isComposition(head)
            ? head[internalSymbol].hash
            : getFunctionHash(head);
        return tailHash + ' <- ' + headHash;
    };
    return function (tail, head) {
        var _a;
        var hash = getHash(tail, head);
        var box = compositionsByHash.get(hash);
        if (!box) {
            var listStart = isComposition(tail) ? tail[internalSymbol].list : [tail];
            var listEnd = isComposition(head) ? head[internalSymbol].list : [head];
            var list = listStart.concat(listEnd);
            var meta = Object.assign({ head: head, hash: hash, tail: tail, list: list });
            var scope = (_a = { fold: foldInComposition }, _a[internalSymbol] = meta, _a);
            box = Object.assign(foldInComposition.bind(scope), scope);
            compositionsByHash.set(hash, box);
        }
        return box;
    };
})();
var isComposition = function (value) {
    return value[internalSymbol] !== undefined;
};
function foldInComposition(value) {
    // @ts-ignore
    return fold(this, value);
}
function fold(composition, value) {
    var result = value;
    var list = composition[internalSymbol].list;
    for (var i = list.length - 1; i >= 0; i--)
        result = list[i](result);
    /*
    tree recursive implementation
    let pointer: Composition<O, I> | F<O, I> | undefined = composition
    while (pointer) {
        if (isComposition(pointer)) {
            result = fold(pointer[internalSymbol].head, result)
            pointer = pointer[internalSymbol].tail
        } else {
            result = pointer(result)
            pointer = undefined
        }
    }
    */
    return result;
}
exports.fold = fold;
var cacheSymbol = Symbol('@sha/lasy-composition-cache');
exports.cacheSymbol = cacheSymbol;
var api = Object.assign(compose, (_a = {}, _a[cacheSymbol] = { compositionsByHash: compositionsByHash, functions: functions }, _a));
exports.compose = api;
exports.default = api;
