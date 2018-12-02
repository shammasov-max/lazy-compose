"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _a;
var constantSymbol = Symbol('@sha/lazy-compose/constant');
var cache = new Map();
exports.default = Object.assign(function constant(value) {
    if (!cache.has(value))
        cache.set(value, function () { return value; });
    return cache.get(value);
}, (_a = {}, _a[constantSymbol] = cache, _a));
