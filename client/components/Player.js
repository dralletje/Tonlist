import React from 'react'
import {Slider} from 'material-ui'
import {compose, withState, mapProps} from 'recompose'
import {Audio, View, Text, TextInput} from '../components'
import ThemeManager from 'material-ui/lib/styles/theme-manager';
import MyRawTheme from '../components/Theme.js';
import ThemeDecorator from 'material-ui/lib/styles/theme-decorator';

let bounds = (min, max, value) => {
  return Math.min(max, Math.max(min, value))
}

let Player = compose(
  ThemeDecorator(ThemeManager.getMuiTheme(MyRawTheme)),
  withState('volume', 'setVolume', 0.2),
  withState('errorTag', 'setError', 0)
)(({volume, setVolume, time, URL, setError, errorTag}) => {
  let onWheel = e => {
    let {deltaY} = e
    let x = bounds(0, 1, volume - (deltaY / 100))
    setVolume(x)
  }

  return (
    <View onWheel={onWheel}>
      <Audio
        volume={volume}
        src={`${URL}${time}${errorTag.toString()}.mp3`}
        onError={() => setError(errorTag + 1)}
        autoPlay
      />

      <Slider
        value={volume}
        onChange={(e, value) => setVolume(value)}
        style={{
          marginBottom: 24
        }}
      />
    </View>
  )
})

export default Player
