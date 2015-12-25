import React from 'react'
import {compose, withState, mapProps} from 'recompose'

import {clickable} from '../style.css'
import {Audio, View, Text, TextInput} from '../components'

let Player = compose(
  withState('volume', 'setVolume', '10'),
  withState('errorTag', 'setError', 0)
)(({volume, setVolume, time, URL, setError, errorTag}) => {
  let volumeFix = volume.replace(/,/g, '.')

  let numberVolume =
    Number.isNaN(Number(volumeFix))
    ? 0 : Number(volumeFix) / 100

  let setVolumeX = num => setVolume(String(num))

  return (
    <View>
      <Audio
        volume={numberVolume}
        src={`${URL}${time}${errorTag.toString()}.mp3`}
        onError={() => setError(errorTag + 1)}
        autoPlay
      />

      <TextInput
        style={{width: 30}}
        onTextChange={setVolume}
        value={volume}
      />%

      <View>
        <View className={clickable} onClick={() => setVolumeX(Math.min(numberVolume*100 + 10, 100))}>
          HARDER { numberVolume >= 1 && '(Nog harder heeft geen zin srry)'}
        </View>
        <View className={clickable} onClick={() => setVolumeX(Math.max(numberVolume*100 - 10, 0))}>
          ZACHTER { numberVolume <= 0 && '(Hij is al op z\'n zachts)'}
        </View>
      </View>
    </View>
  )
})

export default Player
