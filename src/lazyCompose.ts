/**
 * Unary function type
 */

type Hash = string

type F<R, T> = (value: T) => R

const internalSymbol = Symbol('@sha/lazy-composition')

/**
 * Composition defined by Input - <I> the first function input value
 * and output <O>, the last function return type
 */
type Composition<O, I> = {
    fold: F<O, I>
    [internalSymbol]: {
        list: [F<O, any>, ...F<any, any>[]],
        tail: Part<O, any>
        head: Part<any, I>
        hash: string
    }
} & F<O, I>


/**
 * Part of a composition could be unary function or other compositions
 */
type Part<O, I> = F<O, I> | Composition<O, I>

function compose<R, T1>(
    p1: Part<R, T1>,
): Part<R, T1>

function compose<R, T1, T2>(
    p1: Part<R, T1>,
    p2: Part<T1, T2>,
): Composition<R, T2>

function compose<R, T1, T2, T3>(
    p1: Part<R, T1>,
    p2: Part<T1, T2>,
    p3: Part<T2, T3>,
): Composition<R, T3>

function compose<R, T1, T2, T3, T4>(
    p1: Part<R, T1>,
    p2: Part<T1, T2>,
    p3: Part<T2, T3>,
    p4: Part<T3, T4>,
): Composition<R, T4>

function compose<R, T1, T2, T3, T4>(
    p1: Part<R, T1>,
    p2: Part<T1, T2>,
    p3: Part<T2, T3>,
    p4: Part<T3, T4>,
): Composition<R, T4>

function compose<R, T1, T2, T3, T4, T5>(
    p1: Part<R, T1>,
    p2: Part<T1, T2>,
    p3: Part<T2, T3>,
    p4: Part<T3, T4>,
    p5: Part<T4, T5>,
): Composition<R, T5>
/**
 * @param args
 */

function compose(...args: Part<any, any>[]) {
    const length = args.length

    const trimed = args.filter( f => f !== identity)
    if (trimed.length < args.length)
        // @ts-ignore
        return compose(...trimed)

    if (length === 0)
        return identity

    if (length === 1)
        return args[0]

    if (length === 2)
        return composeCache(args[0], args[1])

    // copy all the parts to not mutate one,
    // args could be passed via apply method

    let result = compose(args[args.length - 2], args[args.length - 1])

    for (let i = args.length - 3; i >= 0; i--)
        // @ts-ignore
        result = compose(args[i], result)

    return result

}

export const identity = <T = any>(value: T) => value

/**
 * Module memory
 */
const functions = new Map<Function, Hash>()

const compositionsByHash = new Map<string, Composition<any, any>>()

const composeCache = (() => {

        let counter = 0
        const generateFunctionHash = (f: Function): Hash => {
            if (f.name)
                return f.name + (counter++)

            const hash = 'f' + (counter++)
            // console.warn(`Function has no name, this could be a cause of cache memory leaks.
            //                Registered hash = ${hash} . Body `, f)
            return hash
        }

        const getFunctionHash = (f: Function): Hash => {
            if (functions.has(f))
                return functions.get(f)!

            const hash = generateFunctionHash(f)
            functions.set(f, hash)
            return hash
        }

        // Recusively calcalate hash based on function name
        const getHash = (tail: Composition<any, any> | F<any, any>, head: Composition<any, any> | F<any, any>) => {
            const tailHash = isComposition(tail)
                ? tail[internalSymbol].hash
                : getFunctionHash(tail)
            const headHash = isComposition(head)
                ? head[internalSymbol].hash
                : getFunctionHash(head)

            return tailHash + ' <- ' + headHash
        }


        return (tail, head) => {
            const hash = getHash(tail, head)
            let box = compositionsByHash.get(hash)
            if (!box) {
                const listStart = isComposition(tail) ? tail[internalSymbol].list : [tail]
                const listEnd = isComposition(head) ? head[internalSymbol].list : [head]
                const list = listStart.concat(listEnd)
                const meta = Object.assign({head, hash, tail, list})
                const scope = {fold: foldInComposition, [internalSymbol]: meta}
                box = Object.assign(foldInComposition.bind(scope), scope)
                compositionsByHash.set(hash, box!)
            }
            return box
        }
    }

)()

const isComposition = <O, I>(value: F<O, I> | Composition<O, I>): value is Composition<O, I> =>
    value[internalSymbol] !== undefined

function foldInComposition(value) {
    // @ts-ignore
    return fold(this, value)
}

function fold<O, I>(composition: Composition<O, I>, value: I): O {
    let result: any = value

    const list = composition[internalSymbol].list
    for (let i = list.length - 1; i >= 0 ; i--)
        result = list[i](result)


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

    return result as O
}


const cacheSymbol = Symbol('@sha/lasy-composition-cache')

const api = Object.assign(compose, {[cacheSymbol]: {compositionsByHash, functions}})

export {fold, api as compose, internalSymbol, cacheSymbol}

export default api
