import React from 'react'
import {Slider} from 'material-ui'
import {compose, withState} from 'recompose'
import {Audio, View} from '../components'
import ThemeManager from 'material-ui/lib/styles/theme-manager';
import MyRawTheme from '../components/Theme.js';
import ThemeDecorator from 'material-ui/lib/styles/theme-decorator';

// Make sure value is in between two given
let bounds = (min, max, value) => {
  return Math.min(max, Math.max(min, value))
}

let Player = compose(
  // Get the theme (but this should go to app.js)
  ThemeDecorator(ThemeManager.getMuiTheme(MyRawTheme))
,
  // Make state to get value
  withState('volume', 'setVolume', 0.2)
,
  // errorTag to refresh on error
  withState('errorTag', 'setError', 0)
)(({volume, setVolume, time, URL, setError, errorTag}) => {
  // Event to change volume on mouse wheel
  let onWheel = e => {
    e.preventDefault()
    let {deltaY} = e
    // Calculate volume change
    let difference = -((deltaY > 0 ? 1 : -1) * 0.01)
    // Make sure it is in bounds
    let x = bounds(0, 1, volume + difference)
    // Update it
    setVolume(x)
  }

  return (
    <View onWheel={onWheel}>
      <Audio
        // Need not explain
        volume={volume}

        // Set source to the url, the timestamp and maybe the error that may have occured
        // (So it refreshes when an error occurs)
        src={`${URL}${time}${errorTag.toString()}.mp3`}

        // Increase the errorTag, so it will refresh
        onError={() => setError(errorTag + 1)}

        // Start playing on desktop
        autoPlay
      />

      <Slider
        // Keep value in sync with volume
        value={volume}
        onChange={(e, value) => setVolume(value)}

        style={{marginBottom: 24}}
      />
    </View>
  )
})

export default Player
