import React from 'react'
import {Slider} from 'material-ui'
import {compose, withState, mapProps} from 'recompose'
import {Audio, View, Text, TextInput} from '../components'
import ThemeManager from 'material-ui/lib/styles/theme-manager';
import MyRawTheme from '../components/Theme.js';
import ThemeDecorator from 'material-ui/lib/styles/theme-decorator';

let Player = compose(
  ThemeDecorator(ThemeManager.getMuiTheme(MyRawTheme)),
  withState('volume', 'setVolume', 0.2),
  withState('errorTag', 'setError', 0)
)(({volume, setVolume, time, URL, setError, errorTag}) => {
  return (
    <View>
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
