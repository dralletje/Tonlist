import React from 'react'
import {renderNothing, branch} from 'recompose'

let decorator = branch(
  props => !document,
  renderNothing(),
  x => x
)

let Favicon = class Favicon extends React.Component {
  componentDidMount() {
    let head = document.getElementsByTagName('head')[0]
    let element = Object.assign(document.createElement('link'), {
      type: 'image/x-icon',
      rel: 'icon',
      href: this.props.url,
    })
    head.appendChild(element)

    this.element = element
  }

  componentDidUpdate(prevProps) {
    if (prevProps.url !== this.props.url) {
      this.element.href = currentUrl;
    }
  }

  render() {
    return null;
  }
}

export default decorator(Favicon);
