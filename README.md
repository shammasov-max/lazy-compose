Referential transparent lazy composition.

### Abstract 
Композиция функций это чистая функция, которая зависит только от аргументов.
Таким образов композируя одни и те же функции в одинаковом порядке мы должны получить идентичную фукнцию.

### Motivation 

Частично вопрос идентичности композиций можно решить 
мемоизацией аргументов.
Однако популярные реализации композиции функций не решают 
вопроса ассоциативной идентичности композиции.

кроме этого, рекурсивная реализация функциональной композиции создаёт оверхед при создании дополнительных элементов стека вызовов.
При вызове композиции 5-ти и более функции это хорошо заметно.

### Solution 
Create monoid (or Semigroppoid & Category) in terms of fantasy-land for function composition.
Laws:


```typescript
import compose, {identity} from './src/lazyCompose'
import {add} from 'ramda'
const a = add(1)
const b = add(2)
const c = add(3)
compose(a, compose(b, c)) === compose(compose(a, b), c) // associativity

compose(a, identity) === a  //right identity
compose(identity, a) === a  //left identity

```

### Use cases 

1. Advantages of using with redux mapStateToProps and selectors. 
Because composition of same function returns the same function

2. Lens composition. 
You can create the same lenses by different composition ways.
You can calculate lenses on a fly with result function equality.
In this example I memoize lens constructor to return the same 
functions for same arguments
    ```typescript
    import {lensProp, memoize} from 'ramda'
    import compose from './src/lazyCompose'
    
    const constantLens = memoize(lensProp)
    const lensA = constantLens('a')
    const lensB = constantLens('b')
    const lensC = constantLens('c')
    const lensAB = compose(lensB, lensA)
    
    console.log(
        compose(lensC, lensAB) === compose(lensC, lensB, lensA)
    )
        
    ```


3. Memoized react callbacks directly composable with dispatch. 
In the following example elements of the list will not rerender with out changing id
    
    ```jsx
    import {compose, constant} from './src/lazyCompose'
    // constant - returns the same memoized function for each argrum
    // just like React.useCallback
    import {compose, constant} from './src/lazyComposition'
    
    const List = ({dispatch, data}) =>
        data.map( id =>
            <Button
                key={id}
                onClick={compose(dispatch, makeAction, contsant(id)) 
            />
        )
        
    const Button = React.memo( props => 
        <button {...props} />
    )
        
    const makeAction = payload => ({
        type: 'onClick',
        payload,
    })
    
    ```


4. Lazy composition of react components with no extra HOCs. 
lazy composition folds plain list of functions, with no additional closures
    
    ```jsx
    import {memoize, mergeRight} from 'ramda'
    import {constant, compose} from './src/lazyComposition'
    
    
    const defaultProps = memoize(mergeRight)
    
    const withState = memoize( defaultState =>
        props => {
            const [state, setState] = React.useState(defaultState)
            rturn {...props, state, setState}
        }
    )

    const Component = ({value, label, ...props)) => 
        <label {...props}>{label} : {value}</label>    
        
    const withCounter = compose(  
        ({setState, state, ...props}) => ({
            ...props
            value: state,
            onClick: compose(setState,  constant(state + 1))
        }),
        withState(0),
    )   
    const Counter = compose(
        Component, 
        withCounter,
        defaultProps({label: 'Clicks'}),
    }

    ```


5. Lazy Monads, where map - is a  binary lazy composition, 
with possibility of strict equality implementation



