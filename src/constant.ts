import {cacheSymbol} from './lazyCompose'
const constantSymbol = Symbol('@sha/lazy-compose/constant')

const cache = new Map<any, Function>()

export default Object.assign(
     function constant<T>(value: T) {
        if (!cache.has(value))
            cache.set(value, () => value)

        return  cache.get(value) as any as (...value: any[]) => T
     },
     {[cacheSymbol]: cache},
 )

export {cache as constantCache}