"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lazyCompose_1 = __importStar(require("./lazyCompose"));
var ramda_1 = require("ramda");
var redux_1 = require("redux");
var constant_1 = __importDefault(require("./constant"));
var cache = lazyCompose_1.default[lazyCompose_1.cacheSymbol];
var toUpper = function (value) { return value.toUpperCase(); }; // function with no name, like a anonious callback in React
var getLength = function (value) { return value.length; };
var mult7 = function (value) { return value * 7; };
var asString = function (value) { return String(value); };
var toBoolean = function (value) { return Boolean(value); };
describe('Compostion creation', function () {
    beforeAll(function () {
        cache.compositionsByHash.clear();
        cache.functions.clear();
    });
    test('Compose 1 function', function () {
        var f = lazyCompose_1.default(toUpper);
        expect(cache.compositionsByHash.size).toEqual(0);
        expect(cache.functions.size).toEqual(0);
    });
    var toUpperAsString;
    test('Compose 2 function', function () {
        toUpperAsString = lazyCompose_1.default(toUpper, asString);
        expect(cache.compositionsByHash.size).toEqual(1);
        expect(cache.functions.size).toEqual(2);
    });
    var toBooleanToUpperAsString;
    test('Compose 1  function ad one composition', function () {
        toBooleanToUpperAsString = lazyCompose_1.default(toBoolean, toUpperAsString);
        expect(cache.compositionsByHash.size).toEqual(2);
        expect(cache.functions.size).toEqual(3);
    });
    test('Compose 1 function (which already was registered) and 2 composes', function () {
        var result = lazyCompose_1.default(toBoolean, toUpperAsString, toBooleanToUpperAsString);
        expect(cache.compositionsByHash.size).toEqual(4);
        expect(cache.functions.size).toEqual(3);
    });
    test('toUpperAsString test, fold point free test', function () {
        var result = lazyCompose_1.fold(lazyCompose_1.default(toUpper, asString), 'd');
        expect(result).toEqual('D');
    });
    test('toUpperAsString test, call fold as member of the composition test', function () {
        var result = lazyCompose_1.default(toUpper, asString)('d');
        expect(result).toEqual('D');
    });
    test('Mass test', function () {
        var asStringToBoolean = lazyCompose_1.default(toBoolean, toUpper, asString);
        console.log('asStringToBoolean hash', asStringToBoolean[lazyCompose_1.internalSymbol].hash);
        var bool = asStringToBoolean('dd'); // bool is boolean - ok
        expect(bool).toEqual(true);
        var asStringToUpper = lazyCompose_1.default(toUpper, asString);
        console.log('complex example', lazyCompose_1.default(Boolean, asStringToUpper) === asStringToBoolean);
        var b1 = lazyCompose_1.default(getLength, toUpper);
        var c1 = lazyCompose_1.default(getLength, toUpper);
        expect(b1 === c1).toBeTruthy();
        var c2 = lazyCompose_1.default(asString, mult7);
        var c3 = lazyCompose_1.default(c1, c2);
        var c4 = lazyCompose_1.default(Boolean, c3);
        var a1 = lazyCompose_1.default(toUpper, asString);
        var a2 = lazyCompose_1.default(getLength, a1);
        var a3 = lazyCompose_1.default(a2, mult7);
        var a4 = lazyCompose_1.default(Boolean, a3);
        expect(a1('a')).toEqual('A');
        console.log('c3 hash', c3[lazyCompose_1.internalSymbol].hash);
        console.log('a3 hash', a3[lazyCompose_1.internalSymbol].hash);
        var resultC = c4(99);
        expect(resultC).toEqual(true);
        expect(typeof resultC).toEqual('boolean');
        var resultA = a3(315);
        expect(typeof resultA).toEqual('number');
        expect(c3 === a3).toBeTruthy(); // equals , ok
        expect(c4 === a4).toBeTruthy(); // equals , ok
        // @ts-ignore
        expect(c4 === a3).toBeFalsy(); // TS error - different types inferred
    });
    test('Performance compare to ramda and redux', function () {
        var iterations = 1000000;
        var addOne = function (value) {
            return value + 1;
        };
        var performance = function (f, name) {
            console.time(name);
            for (var i = 0; i < iterations; i++)
                f(1);
            console.timeEnd(name);
        };
        var composeExample = lazyCompose_1.default(addOne, addOne);
        var ramdaExample = ramda_1.compose(addOne, addOne);
        performance(composeExample, 'lazy-compose 2 functions');
        performance(ramdaExample, 'ramda/compose2 functions');
        var composeExample25 = lazyCompose_1.default(lazyCompose_1.default(addOne, addOne, addOne, addOne, addOne), lazyCompose_1.default(addOne, addOne, addOne, addOne, addOne), lazyCompose_1.default(addOne, addOne, addOne, addOne, addOne), lazyCompose_1.default(addOne, addOne, addOne, addOne, addOne), lazyCompose_1.default(addOne, addOne, addOne, addOne, addOne));
        var ramdaExample25 = ramda_1.compose(ramda_1.compose(addOne, addOne, addOne, addOne, addOne), ramda_1.compose(addOne, addOne, addOne, addOne, addOne), ramda_1.compose(addOne, addOne, addOne, addOne, addOne), ramda_1.compose(addOne, addOne, addOne, addOne, addOne), ramda_1.compose(addOne, addOne, addOne, addOne, addOne));
        var reduxExample25 = redux_1.compose(redux_1.compose(addOne, addOne, addOne, addOne, addOne), redux_1.compose(addOne, addOne, addOne, addOne, addOne), redux_1.compose(addOne, addOne, addOne, addOne, addOne), redux_1.compose(addOne, addOne, addOne, addOne, addOne), redux_1.compose(addOne, addOne, addOne, addOne, addOne));
        performance(composeExample25, 'lazy-compose 25 functions');
        performance(ramdaExample25, 'ramda/compose 25 functions');
        performance(reduxExample25, 'redux/compose 25 functions');
    });
    test('Test contsnt function', function () {
        var getLength = function (value) { return value.length; };
        var Foo1 = constant_1.default('Foo');
        var FooLength1 = lazyCompose_1.default(getLength, Foo1);
        var Foo2 = constant_1.default('Foo');
        var FooLength2 = lazyCompose_1.default(getLength, Foo2);
        expect(FooLength2 === FooLength2).toBeTruthy();
        expect(FooLength2({}) === FooLength2({})).toBeTruthy();
    });
    test('Identity law', function () {
        var addOne = function (value) { return value + 1; };
        var leftIdentity = lazyCompose_1.default(lazyCompose_1.identity, addOne);
        var rightIdentity = lazyCompose_1.default(addOne, lazyCompose_1.identity);
        console.log('left identity');
        expect(leftIdentity === addOne).toBeTruthy();
        console.log('right identity');
        expect(rightIdentity === addOne).toBeTruthy();
        expect(rightIdentity === leftIdentity).toBeTruthy();
        var f = lazyCompose_1.default(leftIdentity, addOne);
        var leftIdentity2 = lazyCompose_1.default(lazyCompose_1.identity, f);
        var rightIdentity2 = lazyCompose_1.default(f, lazyCompose_1.identity);
        console.log('left identity of two functions composition');
        expect(leftIdentity2 === f).toBeTruthy();
        console.log('right identity of two functions composition');
        expect(rightIdentity2 === f).toBeTruthy();
        expect(rightIdentity2 === leftIdentity2).toBeTruthy();
    });
});
