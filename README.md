# React advance design pattern

## 1. compond component

```jsx
import React from 'react'
import {Switch} from '../switch'

class Toggle extends React.Component {
  static On = ({on, children}) => (on ? children : null)
  static Off = ({on, children}) => (on ? null : children)
  static Button = ({on, toggle}) => (
    <Switch on={on} onClick={toggle} />
  )

  state = {on: false}
  toggle = () =>
    this.setState(
      ({on}) => ({on: !on}),
      () => this.props.onToggle(this.state.on),
    )
  render() {
    return React.Children.map(this.props.children, childElem => {
      return React.cloneElement(childElem, {
        on: this.state.on,
        toggle: this.toggle,
      })
    })
  }
}
```

To use:

```jsx
<Toggle onToggle={onToggle}>
  <Toggle.On>The button is on</Toggle.On>
  <Toggle.Off>The button is off</Toggle.Off>
  <Toggle.Button />
</Toggle>
```

This design pattern allows you to define inner component and pass the props into it. And you can use the parent component's state and props to control the inner component.

1.  `React.cloneElement` is a top level api, it allow you to clone an exsiting element and pass the props (modified props) into it.

2.  `React.Children.map` allows you map over an array of react elements OR a single React elements. it works just like the Array.prototype.map method.

## 2. Flexable Compond Component

- Quick Demo to the context api

1.  Defines a context with the default value. The default value will work if the `Consumer` is not inside a provider, and you will get the default value

```jsx
const defaultValue = 'light'
const ThemeContext = React.createContext(defaultValue)
```

2.  Defines a Provier

```jsx
<ThemeContext.Provider value={this.state}>
  {this.props.children}
</ThemeContext.Provider>
```

3.  Create a consumer and consume the data

```jsx
<ThemeContext.Consumer>
  {contextValue => <div>The current theme is: {contextValue}</div>}
</ThemeContext.Consumer>
```

The problem we try to solve is in the last pattern, the child components should be the direct child from its parent, and it will failed for this:

```jsx
<Toggle onToggle={onToggle}>
  <Toggle.On>The button is on</Toggle.On>
  <Toggle.Off>The button is off</Toggle.Off>
  <div>
    <Toggle.Button />
  </div>
</Toggle>
```

In order to make it work, we can modify the Compond component pattern with the context api.

```jsx
import React from 'react'
import {Switch} from '../switch'

const ToggleContext = React.createContext({
  on: false,
  toggle: () => {},
})

class Toggle extends React.Component {
  static On = props => {
    return (
      <ToggleContext.Consumer>
        {val => (val.on ? props.children : null)}
      </ToggleContext.Consumer>
    )
  }

  static Off = props => {
    return (
      <ToggleContext.Consumer>
        {val => (val.on ? null : props.children)}
      </ToggleContext.Consumer>
    )
  }

  static Button = props => {
    return (
      <ToggleContext.Consumer>
        {val => (
          <Switch on={val.on} onClick={val.toggle} {...props} />
        )}
      </ToggleContext.Consumer>
    )
  }

  toggle = () =>
    this.setState(
      ({on}) => ({on: !on}),
      () => this.props.onToggle(this.state.on),
    )
  state = {on: false, toggle: this.toggle}
  render() {
    return (
      <ToggleContext.Provider value={this.state}>
        {this.props.children}
      </ToggleContext.Provider>
    )
  }
}
```

In addition, the reason we put toggle inside the state is because every time the value on the context changes, both of the provider and the consumer will trigger re-render, and if we pass the state into the context value, it will prevent a lot of useless renderings.

## 3. Render Props

```jsx
class Toggle extends React.Component {
  state = {on: false}
  toggle = () =>
    this.setState(
      ({on}) => ({on: !on}),
      () => {
        this.props.onToggle(this.state.on)
      },
    )
  render() {
    const {on} = this.state

    return this.props.children({
      on,
      toggle: this.toggle,
    })
  }
}
```

To use:

```jsx
<Toggle onToggle={onToggle}>
  {({on, toggle}) => (
    <div>
      {on ? 'The button is on' : 'The button is off'}
      <Switch on={on} onClick={toggle} />
      <hr />
      <button aria-label="custom-button" onClick={toggle}>
        {on ? 'on' : 'off'}
      </button>
    </div>
  )}
</Toggle>
```

This pattern allows us to provide the view inside the child of the component. Here, the Toggle component takes a children, which is a render function which just identical to a functional component, the render function take data that provided by the parent and render out the view.

Notice here, children can take either an array of react elements or one single element/renderfunction.

## 4. Props Collection

In the above example, when the parent component (`<Toggle/>`) renders its child, it always expect the user to pass in an object which contains an "on" and an "toggle" properties, and that sometimes could be really messy, what if we need to pass 10 or 20 properties? We have to type them in the Toggle component as well as the usage component. To tackle that, we have to use Props Collection pattern

```jsx
class Toggle extends React.Component {
  state = {on: false}
  toggle = () =>
    this.setState(
      ({on}) => ({on: !on}),
      () => this.props.onToggle(this.state.on),
    )
  getStateAndHelpers() {
    return {
      on: this.state.on,

      togglerProps: {
        'aria-pressed': this.state.on,
        onClick: this.toggle,
      },
    }
  }
  render() {
    return this.props.children(this.getStateAndHelpers())
  }
}
```

To use:

```jsx
<Toggle onToggle={onToggle}>
  {({on, togglerProps}) => (
    <div>
      <Switch on={on} {...togglerProps} />
      <hr />
      <button aria-label="custom-button" {...togglerProps}>
        {on ? 'on' : 'off'}
      </button>
    </div>
  )}
</Toggle>
```

Here, in Toggle component, we have a map function, which maps all the props and extract the ones we need in the correct format. Notice here the `getStateAndHelpers` function can also deal with computed properties, which is very handy.

## 5. Prop Getter

In the previous example, what if we provide our own onClick handler and want both of the handlers to work? like this:

```jsx
<Toggle onToggle={onToggle}>
  {({on, getTogglerProps}) => (
    <div>
      <Switch {...getTogglerProps({on})} />
      <hr />
      <button
        {...getTogglerProps({
          'aria-label': 'custom-button',
          onClick: () => console.log('onButtonClick'), // <= we want this work
          id: 'custom-button-id',
        })}
      >
        {on ? 'on' : 'off'}
      </button>
    </div>
  )}
</Toggle>
```

Since the render props pattern returns an object from the `getStateAndHelpers`, the onClick method will not be able to passed in.

```jsx
const callAll = (...fns) => (...args) =>
  fns.forEach(fn => fn && fn(...args))

class Toggle extends React.Component {
  state = {on: false}
  toggle = () =>
    this.setState(
      ({on}) => ({on: !on}),
      () => this.props.onToggle(this.state.on),
    )

  getStateAndHelpers() {
    return {
      on: this.state.on,
      getTogglerProps: ({onClick, ...props}) => ({
        ...props,
        onClick: callAll(onClick, this.toggle),
      }),
      'aria-expanded': this.state.on,
    }
  }
  render() {
    return this.props.children(this.getStateAndHelpers())
  }
}
```

Insead of returning an object of props, we return back the `getTogglerProps` which is a function, and this function will return an object so that we can modify the data before it returns to the user.

## 6. State Initializers

If we need a default or initial value for the state which come from the props, we can use the state initializer pattern

```jsx
const callAll = (...fns) => (...args) =>
  fns.forEach(fn => fn && fn(...args))

class Toggle extends React.Component {
  static defaultProps = {
    initialOn: false,
  }

  initialState = {on: this.props.initialOn}

  state = this.initialState

  reset = defaultOn => {
    this.setState(this.initialState, this.props.onReset(defaultOn))
  }
  toggle = () =>
    this.setState(
      ({on}) => ({on: !on}),
      () => this.props.onToggle(this.state.on),
    )
  getTogglerProps = ({onClick, ...props} = {}) => {
    return {
      'aria-pressed': this.state.on,
      onClick: callAll(onClick, this.toggle),
      ...props,
    }
  }
  getStateAndHelpers() {
    return {
      on: this.state.on,
      toggle: this.toggle,
      reset: this.reset,
      getTogglerProps: this.getTogglerProps,
    }
  }
  render() {
    return this.props.children(this.getStateAndHelpers())
  }
}
```

Here we extract the default state into a static property, and use that property to reset the state values.

To use:

```jsx
function Usage({
  initialOn = false,
  onToggle = (...args) => console.log('onToggle', ...args),
  onReset = (...args) => console.log('onReset', ...args),
}) {
  return (
    <Toggle
      initialOn={initialOn}
      onToggle={onToggle}
      onReset={onReset}
    >
      {({getTogglerProps, on, reset}) => (
        <div>
          <Switch {...getTogglerProps({on})} />
          <hr />
          <button onClick={() => reset(initialOn)}>Reset</button>
        </div>
      )}
    </Toggle>
  )
}
```

## 7. State Reducer Pattern

Sometimes, we want to have some addtional logic during the `setState` from the parent compnent, so we can use state reducer pattern to solve it.

State Reducer is a function, it will be passed to the component when we use it, and it takes two parameters, the first is the current state, and the second is the updated state, for instance:

```jsx
toggleStateReducer = (state, changes) => {
  if (this.state.timesClicked >= 4) {
    return {...changes, on: false}
  }
  return changes
}
```

Here, if the timesClicked is equal or greater than 4, instead of return the changed state, it overwrite the `on` property to `false`.

```jsx
class Toggle extends React.Component {
  static defaultProps = {
    initialOn: false,
    onReset: () => {},
    stateReducer: (state, changes) => changes,
  }
  initialState = {on: this.props.initialOn}
  state = this.initialState

  // internalSetState = (changes, callback) => {
  //   this.setState(state => {
  //     const changesObject =
  //       typeof changes === 'function' ? changes(state) : changes

  //     const reducedChanges =
  //       this.props.stateReducer(state, changesObject) || {}

  //     return Object.keys(reducedChanges).length
  //       ? reducedChanges
  //       : null
  //   }, callback)
  // }

  // advanced implementation, strip off the multiple variable assignments,
  // works exactly the same functionality
  internalSetState = (changes, callback) => {
    this.setState(currentState => {
      return [changes]
        .map(c => (typeof c === 'function' ? c(currentState) : c))
        .map(c => this.props.stateReducer(currentState, c) || {})
        .map(c => (Object.keys(c).length > 0 ? c : null))[0]
    }, callback)
  }

  reset = () =>
    this.internalSetState(this.initialState, () =>
      this.props.onReset(this.state.on),
    )

  toggle = () => {
    this.internalSetState(
      state => ({on: !state.on}),
      () => this.props.onToggle(this.state.on),
    )
  }

  getTogglerProps = ({onClick, ...props} = {}) => ({
    onClick: callAll(onClick, this.toggle),
    'aria-pressed': this.state.on,
    ...props,
  })
  getStateAndHelpers() {
    return {
      on: this.state.on,
      toggle: this.toggle,
      reset: this.reset,
      getTogglerProps: this.getTogglerProps,
    }
  }
  render() {
    return this.props.children(this.getStateAndHelpers())
  }
}
```

Noticed we have an `internalSetState` method on the component, this will served as the `setState` in the normal component with addional logics. Here, it does the following things:

1.  get the new state after changes and store it into `changesObject`, if the changes is an update function, like this:
    `this.setState(currentState => ({on: !currentState.on}))`, it will call it with the current state,
    or if the changes is an object, like this: `this.setState({on: !this.state.on})`, it will simply return the changes as the result.
2.  call the stateReducer function with `changesObject`, and store the value into `reducedChanges`.
3.  return the value back with some edge checkings.
4.  the `callback` that passed to the `internalSetState` will get called during the original setState.

Here, we created the `internalSetState` which exposes the same API as the `setState` method. And later on, when we need to `setState`, we call the `internalSetState` instead like this:

```jsx
toggle = () => {
  this.internalSetState(
    state => ({on: !state.on}), // change function
    () => this.props.onToggle(this.state.on), // callback
  )
}
```

To use:

```jsx
class Usage extends React.Component {
  static defaultProps = {
    onToggle: (...args) => console.log('onToggle', ...args),
    onReset: (...args) => console.log('onReset', ...args),
  }
  initialState = {timesClicked: 0}
  state = this.initialState
  handleToggle = (...args) => {
    this.setState(({timesClicked}) => ({
      timesClicked: timesClicked + 1,
    }))
    this.props.onToggle(...args)
  }
  handleReset = (...args) => {
    this.setState(this.initialState)
    this.props.onReset(...args)
  }
  // this is the stateReducer function that will be passed into <Toggle /> component
  toggleStateReducer = (state, changes) => {
    if (this.state.timesClicked >= 4) {
      return {...changes, on: false}
    }
    return changes
  }
  render() {
    const {timesClicked} = this.state
    return (
      <Toggle
        stateReducer={this.toggleStateReducer}
        onToggle={this.handleToggle}
        onReset={this.handleReset}
      >
        {toggle => (
          <div>
            <Switch
              {...toggle.getTogglerProps({
                on: toggle.on,
              })}
            />
            {timesClicked > 4 ? (
              <div data-testid="notice">
                Whoa, you clicked too much!
                <br />
              </div>
            ) : timesClicked > 0 ? (
              <div data-testid="click-count">
                Click count: {timesClicked}
              </div>
            ) : null}
            <button onClick={toggle.reset}>Reset</button>
          </div>
        )}
      </Toggle>
    )
  }
}
```

## 8. State Reducer Pattern with Types

In the above example, the user of the Toggle component has very little knowledge about what was going on with the state reducer. To improve this, we can add type properties to give the user more infomation about the state reducer, and also allows the user to add addtional logic. StateChangeTypes are strings or enums looks like this:

```jsx
static stateChangeTypes = {
  toggle: 'toggle',
  reset: 'reset',
}
```

And we can provide types from the usage of the component by passing into the reducers like this:

```jsx
toggleStateReducer = (state, changes) => {
  if (changes.type === 'forced') {
    return changes
  }
  if (this.state.timesClicked >= 4) {
    return {...changes, on: false}
  }
  return changes
}

<button onClick={() => toggle({type: 'forced'})}>
  Force Toggle
</button>
```

### Here is how it works:

```jsx
class Toggle extends React.Component {
  static stateChangeTypes = {
    toggle: 'toggle',
    reset: 'reset',
  }
  static defaultProps = {
    initialOn: false,
    onReset: () => {},
    stateReducer: (state, changes) => changes,
  }
  initialState = {on: this.props.initialOn}
  state = this.initialState
  internalSetState(changes, callback) {
    this.setState(state => {
      const changesObject =
        typeof changes === 'function' ? changes(state) : changes

      const reducedChanges =
        this.props.stateReducer(state, changesObject) || {}
      // strip out the type to prevent useless rerender
      const {type: ignoredTypes, ...remainingChanges} = reducedChanges

      return Object.keys(remainingChanges).length
        ? remainingChanges
        : null
    }, callback)
  }
  reset = () =>
    this.internalSetState(
      {...this.initialState, type: Toggle.stateChangeTypes.reset},
      () => this.props.onReset(this.state.on),
    )
  toggle = ({type = Toggle.stateChangeTypes.toggle} = {}) =>
    this.internalSetState(
      ({on}) => ({on: !on, type}), // append the type
      () => this.props.onToggle(this.state.on),
    )
  getTogglerProps = ({onClick, ...props} = {}) => ({
    onClick: callAll(onClick, () => this.toggle()),
    'aria-pressed': this.state.on,
    ...props,
  })
  getStateAndHelpers() {
    return {
      on: this.state.on,
      toggle: this.toggle,
      reset: this.reset,
      getTogglerProps: this.getTogglerProps,
    }
  }
  render() {
    return this.props.children(this.getStateAndHelpers())
  }
}
```

To use:

```jsx
class Usage extends React.Component {
  static defaultProps = {
    onToggle: (...args) => console.log('onToggle', ...args),
    onReset: (...args) => console.log('onReset', ...args),
  }
  initialState = {timesClicked: 0}
  state = this.initialState
  handleToggle = (...args) => {
    this.setState(({timesClicked}) => ({
      timesClicked: timesClicked + 1,
    }))
    this.props.onToggle(...args)
  }
  handleReset = (...args) => {
    this.setState(this.initialState)
    this.props.onReset(...args)
  }
  toggleStateReducer = (state, changes) => {
    if (changes.type === 'forced') {
      return changes
    }
    if (this.state.timesClicked >= 4) {
      return {...changes, on: false}
    }
    return changes
  }
  render() {
    const {timesClicked} = this.state
    return (
      <Toggle
        stateReducer={this.toggleStateReducer}
        onToggle={this.handleToggle}
        onReset={this.handleReset}
        ref={this.props.toggleRef}
      >
        {({on, toggle, reset, getTogglerProps}) => (
          <div>
            <Switch
              {...getTogglerProps({
                on: on,
              })}
            />
            {timesClicked > 4 ? (
              <div data-testid="notice">
                Whoa, you clicked too much!
                <br />
                <button onClick={() => toggle({type: 'forced'})}>
                  Force Toggle
                </button>
                <br />
              </div>
            ) : timesClicked > 0 ? (
              <div data-testid="click-count">
                Click count: {timesClicked}
              </div>
            ) : null}
            <button onClick={reset}>Reset</button>
          </div>
        )}
      </Toggle>
    )
  }
}
```

## 9. Controlled Props

In most of the ui component libriaries, we always see for the input, it's a `controlled` component, what it means is the data or the state is actually come from the props instead of its own state, and also when we use it, we need to provide an update function to modify its state or value.

For instance:

```jsx
<Input type="text" value={inputValue} onChange={onChangeFunc} />
```

Here we are trying to implement it in a more flexable way.

```jsx
class Toggle extends React.Component {
  state = {on: false}

  isControlled = prop => {
    return this.props[prop] !== undefined
  }

  getState = prop => {
    if (this.isControlled(prop)) {
      return this.props[prop]
    }
    return this.state[prop]
  }

  toggle = () => {
    if (this.isControlled('on')) {
      this.props.onToggle(!this.getState('on'))
    } else {
      this.setState(
        ({on}) => ({on: !on}),
        () => {
          this.props.onToggle(this.getState('on'))
        },
      )
    }
  }

  render() {
    const on = this.getState('on')
    return <Switch on={on} onClick={this.toggle} />
  }
}
```

1.  The `isControlled` method is to find out whether the component has a value provided from its props
2.  The `getState` method is grab the property on the state if the component is not controlled, otherwise get the value from its props
3.  Then we modify its value, we always need to figure out if the component is a controlled component or not.

To Use:

```jsx
class Usage extends React.Component {
  state = {bothOn: false} // this is the source of truth
  handleToggle = on => {
    this.setState({bothOn: on})
  }
  render() {
    const {bothOn} = this.state
    return (
      <div>
        <Toggle on={bothOn} onToggle={this.handleToggle} />
        <Toggle on={bothOn} onToggle={this.handleToggle} />
      </div>
    )
  }
}
```
