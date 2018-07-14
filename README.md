# React advance design pattern

## 1. compond component

```
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

```
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

```
const defaultValue = 'light'
const ThemeContext = React.createContext(defaultValue)
```

2.  Defines a Provier

```
<ThemeContext.Provider value={this.state}>
  {this.props.children}
</ThemeContext.Provider>
```

3.  Create a consumer and consume the data

```
<ThemeContext.Consumer>
  {contextValue => <div>The current theme is: {contextValue}</div>}
</ThemeContext.Consumer>
```

The problem we try to solve is in the last pattern, the child components should be the direct child from its parent, and it will failed for this:

```
<Toggle onToggle={onToggle}>
  <Toggle.On>The button is on</Toggle.On>
  <Toggle.Off>The button is off</Toggle.Off>
  <div>
    <Toggle.Button />
  </div>
</Toggle>
```

In order to make it work, we can modify the Compond component pattern with the context api.

```
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
