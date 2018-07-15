// state reducer

import React from 'react'
import {Switch} from '../switch'

const callAll = (...fns) => (...args) =>
  fns.forEach(fn => fn && fn(...args))

// Render props allow users to be in control over the UI based on state.
// State reducers allow users to be in control over logic based on actions.
// This idea is similar to redux, but only coincidentally.
//
// The basic idea is that any time there's an internal change in state, we
// first call a stateReducer prop with the current state and the changes.
// Whatever is returned is what we use in our setState call.
// This allows users of the component to return the changes they received
// or to modify the changes as they need.
//
// What this means for our implementation is that we can create a single
// function that does all the work before calling setState. Then we can
// replace all calls to setState with that function.
//
// Learn more about the state reducers pattern here:
// https://blog.kentcdodds.com/b40316cfac57

class Toggle extends React.Component {
  static defaultProps = {
    initialOn: false,
    onReset: () => {},
    stateReducer: (state, changes) => changes,
  }
  initialState = {on: this.props.initialOn}
  state = this.initialState

  // internalSetState = (changes, callback) => {
  //   this.setState(currentState => {
  //     const changesObject =
  //       typeof changes === 'function' ? changes(currentState) : changes

  //     const reducedChanges =
  //       this.props.stateReducer(currentState, changesObject) || {}

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

// Don't make changes to the Usage component. It's here to show you how your
// component is intended to be used and is used in the tests.
// You can make all the tests pass by updating the Toggle component.
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
Usage.title = 'State Reducers'

export {Toggle, Usage as default}

/* eslint
"no-unused-vars": [
  "warn",
  {
    "argsIgnorePattern": "^_.+|^ignore.+",
    "varsIgnorePattern": "^_.+|^ignore.+",
    "args": "after-used"
  }
]
 */
