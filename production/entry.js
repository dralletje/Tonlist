import React from 'react'
import ReactDOM from 'react-dom'
import App from '../client/app'

class RealApp extends React.Component {
  render() {
    return (
      <App />
    )
  }
}

ReactDOM.render(<RealApp />, document.querySelector('#app'))
