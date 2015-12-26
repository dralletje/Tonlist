import React from 'react'
import 'bootstrap/dist/css/bootstrap.css'

export let View = 'div'
export let Text = 'span'
export let TextInput = (props) =>
  <input
    {...props}
    type="text"
    onChange={e => {
      props.onTextChange && props.onTextChange(e.target.value)
    }}
    onKeyPress={e => {
      e.which === 13 && props.onSubmit && props.onSubmit()
    }}
  />

export class Audio extends React.Component {
  componentDidUpdate(prevProps) {
    let nextProps = this.props
    if (this.audio) {
      this.audio.volume = nextProps.volume
    }
  }

  render() {
    return (
      <div>
        <audio ref={(x) => this.audio = x} {...this.props}>
          <Text>Your browser does not support the audio element.</Text>
        </audio>
        <div className="visible-xs visible-sm">
        <button type="button" className="btn btn-primary btn-lg btn-block btn btn-info vol" onClick={() => this.audio.play()}>Ik zit op mijn mobiel!</button>
        </div>
      </div>
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
