import React from 'react'
import {mobilebutton} from './style.css'

import {RaisedButton} from 'material-ui'

export let View = 'div'
export let Text = 'span'

// Maybe make this use material ui textfield? @Jelmar
export let TextInput = ({onSubmit, onTextChange, ...props}) =>
  <input
    {...props}
    type="text"
    // Call onTextChange with the value on change
    onChange={e => {
      onTextChange && onTextChange(e.target.value)
    }}
    // Call onSubmit when enter is pressed
    onKeyPress={e => {
      e.which === 13 && onSubmit && onSubmit()
    }}
  />

export class Audio extends React.Component {
  componentWillReceiveProps(nextProps) {
    // Update volume on the element when receiving new props
    if (this.audio) {
      this.audio.volume = nextProps.volume
    }
  }

  shouldComponentUpdate(nextProps) {
    // Only update when `src` changes
    let prevProps = this.props
    return nextProps.src !== prevProps.src
  }

  render() {
    return (
      <View>
        <audio ref={(x) => this.audio = x} {...this.props}>
          <Text>Your browser does not support the audio element.</Text>
        </audio>

        { /* Button for mobile where autoplay does not work */ }
        <View className={mobilebutton}>
          <RaisedButton
            onMouseDown={() => this.audio.play()}
            label="Klik hier als je op je mobiel zit!"
            fullWidth={true}
            backgroundColor="#55799d"
            labelColor="#131b21"
          />
        </View>
      </View>
    )
  }
}

export class Scroll extends React.Component {
  componentWillUpdate() {
    // Gather info
    let el = this.element
    let scrollHeight = el.scrollHeight - el.offsetHeight
    this.scrollHeightSaved = scrollHeight
  }

  componentDidUpdate() {
    let el = this.element
    let prevScrollHeight = this.scrollHeightSaved
    let scrollHeight = el.scrollHeight - el.offsetHeight
    el.scrollTop = this.props.scrollTo(prevScrollHeight, el.scrollTop, scrollHeight)
  }

  render() {
    let Tag = this.props.tag || View
    return (
      <Tag {...this.props} ref={x => this.element = x} />
    )
  }
}
