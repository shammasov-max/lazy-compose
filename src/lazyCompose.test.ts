import {default as compose, fold, internalSymbol, cacheSymbol, identity} from './lazyCompose'
import {compose as composeRamda} from 'ramda'
import {compose as reduxCompose} from 'redux'
import constant from './constant'

const cache = compose[cacheSymbol]

const toUpper = (value: string) => value.toUpperCase()// function with no name, like a anonious callback in React
const getLength = (value: string) => value.length
const mult7 = (value: number) => value * 7
const asString = (value: any) => String(value)
const toBoolean = (value: any) => Boolean(value)

describe('Compostion creation', () => {

    beforeAll(() => {
        cache.compositionsByHash.clear()
        cache.functions.clear()
    })

    test('Compose 1 function', () => {
            const f = compose(toUpper)
            expect(cache.compositionsByHash.size).toEqual(0)
            expect(cache.functions.size).toEqual(0)
        },
    )

    let toUpperAsString: any
    test('Compose 2 function', () => {
            toUpperAsString = compose(toUpper, asString)
            expect(cache.compositionsByHash.size).toEqual(1)
            expect(cache.functions.size).toEqual(2)
        },
    )

    let toBooleanToUpperAsString: any
    test('Compose 1  function ad one composition', () => {
            toBooleanToUpperAsString = compose(toBoolean, toUpperAsString)
            expect(cache.compositionsByHash.size).toEqual(2)
            expect(cache.functions.size).toEqual(3)
        },
    )
    test('Compose 1 function (which already was registered) and 2 composes', () => {
        const result = compose(toBoolean, toUpperAsString, toBooleanToUpperAsString)
        expect(cache.compositionsByHash.size).toEqual(4)
        expect(cache.functions.size).toEqual(3)

    })

    test('toUpperAsString test, fold point free test', () => {
        const result = fold(compose(toUpper, asString), 'd')
        expect(result).toEqual('D')
    })
    test('toUpperAsString test, call fold as member of the composition test', () => {
        const result = compose(toUpper, asString)('d')
        expect(result).toEqual('D')
    })
    test('Mass test', () => {

        const asStringToBoolean = compose(toBoolean, toUpper, asString)
        console.log('asStringToBoolean hash', asStringToBoolean[internalSymbol].hash)
        const bool = asStringToBoolean('dd') // bool is boolean - ok

        expect(bool).toEqual(true)
        const asStringToUpper = compose(toUpper, asString)
        console.log('complex example', compose(Boolean, asStringToUpper) === asStringToBoolean)

        const b1 = compose(getLength, toUpper)
        const c1 = compose(getLength, toUpper)
        expect(b1 === c1).toBeTruthy()

        const c2 = compose(asString, mult7)
        const c3 = compose(c1, c2)
        const c4 = compose(Boolean, c3)

        const a1 = compose(toUpper, asString)
        const a2 = compose(getLength, a1)
        const a3 = compose(a2, mult7)
        const a4 = compose(Boolean, a3)


        expect(a1('a')).toEqual('A')
        console.log('c3 hash', c3[internalSymbol].hash)
        console.log('a3 hash', a3[internalSymbol].hash)

        const resultC = c4(99)
        expect(resultC).toEqual(true)
        expect(typeof resultC).toEqual('boolean')

        const resultA = a3(315)
        expect(typeof resultA).toEqual('number')

        expect(c3 === a3).toBeTruthy() // equals , ok
        expect(c4 === a4).toBeTruthy() // equals , ok

        // @ts-ignore
        expect(c4 === a3).toBeFalsy() // TS error - different types inferred

    })

    test('Performance compare to ramda and redux', () => {
        const iterations = 1000000

        const addOne = (value: number) =>
            value + 1

        const performance = (f, name) => {
            console.time(name)
            for (let i = 0; i < iterations; i++)
                f(1)
            console.timeEnd(name)
        }


        const composeExample = compose(addOne, addOne)
        const ramdaExample = composeRamda(addOne, addOne)

        performance(composeExample, 'lazy-compose 2 functions')
        performance(ramdaExample, 'ramda/compose2 functions')


        const composeExample25 = compose(
            compose(addOne, addOne, addOne, addOne, addOne),
            compose(addOne, addOne, addOne, addOne, addOne),
            compose(addOne, addOne, addOne, addOne, addOne),
            compose(addOne, addOne, addOne, addOne, addOne),
            compose(addOne, addOne, addOne, addOne, addOne),
        )
        const ramdaExample25 = composeRamda(
            composeRamda(addOne, addOne, addOne, addOne, addOne),
            composeRamda(addOne, addOne, addOne, addOne, addOne),
            composeRamda(addOne, addOne, addOne, addOne, addOne),
            composeRamda(addOne, addOne, addOne, addOne, addOne),
            composeRamda(addOne, addOne, addOne, addOne, addOne),
        )
        const reduxExample25 = reduxCompose(
            reduxCompose(addOne, addOne, addOne, addOne, addOne),
            reduxCompose(addOne, addOne, addOne, addOne, addOne),
            reduxCompose(addOne, addOne, addOne, addOne, addOne),
            reduxCompose(addOne, addOne, addOne, addOne, addOne),
            reduxCompose(addOne, addOne, addOne, addOne, addOne),
        )

        performance(composeExample25, 'lazy-compose 25 functions')
        performance(ramdaExample25, 'ramda/compose 25 functions')
        performance(reduxExample25, 'redux/compose 25 functions')
    })

    test('Test contsnt function', () => {

        const getLength = (value: string) => value.length

        const Foo1 = constant('Foo')
        const FooLength1 = compose(getLength, Foo1)

        const Foo2 = constant('Foo')
        const FooLength2 = compose(getLength, Foo2)

        expect(FooLength2 === FooLength2).toBeTruthy()

        expect(FooLength2({}) === FooLength2({})).toBeTruthy()

    })

    test('Identity law', () => {
        const addOne = value => value + 1

        const leftIdentity = compose(identity, addOne)
        const rightIdentity = compose(addOne, identity)

        console.log('left identity')
        expect(leftIdentity === addOne).toBeTruthy()

        console.log('right identity')
        expect(rightIdentity === addOne).toBeTruthy()
        expect(rightIdentity === leftIdentity).toBeTruthy()


        const f = compose(leftIdentity, addOne)
        const leftIdentity2 = compose(identity, f)
        const rightIdentity2 = compose(f, identity)

        console.log('left identity of two functions composition')
        expect(leftIdentity2 === f).toBeTruthy()

        console.log('right identity of two functions composition')
        expect(rightIdentity2 === f).toBeTruthy()
        expect(rightIdentity2 === leftIdentity2).toBeTruthy()


    })
})
