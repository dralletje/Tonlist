import React from 'react'
import {compose, withState} from 'recompose'

import {clickable} from '../style.css'
import {Audio, View, Text} from '../components'

let Player = compose(
  withState('volume', 'setVolume', 0.1)
)(({volume, setVolume, time, URL}) => (
  <View>
    <Audio volume={volume} src={`${URL}${time}.mp3`} autoPlay />

    <View>
      {volume}
      <View className={clickable} onClick={() => setVolume(Math.min(volume + 0.1, 1))}>
        HARDER { volume === 1 && '(Nog harder heeft geen zin srry)'}
      </View>
      <View className={clickable} onClick={() => setVolume(Math.max(volume - 0.1, 0))}>
        ZACHTER { volume === 0 && '(Hij is al op z\'n zachts)'}
      </View>
    </View>
  </View>
))

export default Player
