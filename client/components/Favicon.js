import React from 'react'
import {renderNothing, branch} from 'recompose'

// Als er geen `document` is, heeft een favicon ook geen zin
let decorator = branch(
  props => !document,
  renderNothing(),
  x => x
)


let Favicon = class Favicon extends React.Component {
  componentDidMount() {
    // Create  a `link` element with `href` set
    let element = Object.assign(document.createElement('link'), {
      type: 'image/x-icon',
      rel: 'icon',
      href: this.props.url,
    })

    // Get the head element
    let head = document.getElementsByTagName('head')[0]
    // And append my beautiful `link` element to it
    head.appendChild(element)

    // Save it so we can alter it in `componentDidUpdate`
    this.element = element
  }

  // Update the href on the `link` element when nessecarry
  componentDidUpdate(prevProps) {
    if (prevProps.url !== this.props.url) {
      this.element.href = this.props.url
    }
  }

  // Render niets want ja, je doet alleen favicon shit
  render() {
    return null;
  }
}

export default decorator(Favicon);
