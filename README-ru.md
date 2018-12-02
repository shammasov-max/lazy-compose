Давайте пофантазируем на тему композиции функций, а так же проясним смысл пайплайн/компоуз оператора. 
Можно рассматривать функцию compose как чистую функцию, которая зависит только от аргументов.
Таким образов композируя одни и те же функции в одинаковом порядке мы должны получить идентичную функцию, но в JavaScript мире это не так. Любой вызов compose - возвращает новую функцию, это приводит к созданию всё новых и новых функций в памяти, а так же к вопросам их мемоизации, сравнения и отладки.
Надо что-то делать.
### Мотивация
1. Получить ассоциативную идентичность:
Очень желательно не создавать новых объектов и переиспользовать предыдущие результаты. Одна из проблем React разработчика – реализация shallowCompare, работающая с результатом композиции функций.
Популярные реализации композиции не обладают идентичностью возвращаемого значения.
Частично вопрос идентичности композиций можно решить мемоизацией аргументов. Однако остаётся вопрос ассоциативной идентичности:
```javascript
import {memoize} from 'ramda'
const memoCompose = memoize(compose)
memoCompose(a, b) === memoCompose(a, b) 
// да, аргументы одинаковые
memoCompose(memoCompose(a, b), c) === memoCompose(a, memoCompose(b, c)) 
// нет, мемоизация не помогает так как аргументы разные
```
2. Упростить отладку композиции:
Конечно же, использование tap функций помогает отладку функций имеющих единственное выражение в теле. Однако, желательно иметь как можно более "плоский" стек вызовов, для отладки и дебага.  
3. Избавиться от оверхеда связанного с рекурсией:
 Рекурсивная реализация функциональной композиции имеет оверхед, создавая новые элементы в стеке вызовов. При вызове композиции 5-ти и более функции это хорошо заметно. А используя функциональные подходы в разработке необходимо выстраивать композиции из десятков очень простых функций. 

### Решение
Сделать моноид ( или полугруппоид с поддержкой спецификации категории) в терминах fantasy-land:

```typescript
import compose, {identity} from 'lazy-compose'
import {add} from 'ramda'

const a = add(1)
const b = add(2)
const c = add(3)
test('Laws', () => {
    compose(a, compose(b, c)) === compose(compose(a, b), c) // ассоциативность

    compose(a, identity) === a  //right identity
    compose(identity, a) === a  //left identity
}

```

### Варианыт использования

1. Полезно в мемоизации составных композиций при работе с редаксом. Например для redux/mapStateToProps и 
reselect.

2. Композиция линз.
Можно переиспользовать создавать и линзы строго эквивалентные линзы сфокусированные в одно и то же место.
    ```typescript
    import {lensProp, memoize} from 'ramda'
    import compose from 'lazy-compose'
    
    const constantLens = memoize(lensProp)
    const lensA = constantLens('a')
    const lensB = constantLens('b')
    const lensC = constantLens('c')
    const lensAB = compose(lensB, lensA)
    
    console.log(
        compose(lensC, lensAB) === compose(lensC, lensB, lensA)
    )
        
    ```


3. Мемоизированные коллбэки, с возможностью композиции вплоть до конечной функции отправки события.
В этом примере в элементы списка будет передаваться один и тот же коллбэк.
    
    ```jsx
    import {compose, constant} from './src/lazyCompose'
    // constant - returns the same memoized function for each argrum
    // just like React.useCallback
    import {compose, constant} from 'lazy-compose'
    
    const List = ({dispatch, data}) =>
        data.map( id =>
            <Button
                key={id}
                onClick={compose(dispatch, makeAction, contsant(id))}
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


4. Ленивая композиция React компонентов без создания компонентов высшего порядка. В данном случае ленивая композиция будет сворачивать массив функций, без создания дополнительных замыканий. Данный вопрос волнует многих разработчиков использующих библиотеку recompose

    ```jsx
    import {memoize, mergeRight} from 'ramda'
    import {constant, compose} from './src/lazyCompose'
    
    const defaultProps = memoize(mergeRight)
    
    const withState = memoize( defaultState =>
        props => {
            const [state, setState] = React.useState(defaultState)
            return {...props, state, setState}
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
    )

    ```


5. Монады и аппликативы (в терминах fantasy-land) со строгой эквивалентностью через кэшироваие результата композиции. Если внутри конструктора типа обращаться к словарю разнее созданных объектов, получится следующее:

```
    type Info = {
          age?: number
    }

    type User = {
          info?: Info   
    }

    const mayBeAge = LazyMaybe<Info>.of(identity)
          .map(getAge)
          .contramap(getInfo)

    const age = mayBeAge.ap(data)

    const maybeAge2 =  LazyMaybe<User>.of(compose(getAge, getInfo))
    
    console.log(maybeAge === maybeAge2)  
    // создав эквивалентные объекты, мы можем мемоизировать их вместе
    // переиспользовать как один объект и бонусом получить короткий стек вызовов
```

Давно использую такой подход.
Можете попробовать: ```npm i lazy-compose``` .

                                                 


