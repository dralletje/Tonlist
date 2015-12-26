import React from 'react'
import {compose, withState, mapProps} from 'recompose'

import {clickable, btntje} from '../style.css'
import {Audio, View, Text, TextInput} from '../components'

import 'bootstrap/dist/css/bootstrap.css'

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
          <button type="button" className="btn btn-primary btn-lg btn-block btn btn-danger vol" >
              Harder
                { numberVolume >= 1 && '(Hij is al op z\'n hardst)'}
          </button>
        </View>
        <View className={clickable} onClick={() => setVolumeX(Math.max(numberVolume*100 - 10, 0))}>
          <button type="button" className="btn btn-primary btn-lg btn-block btn-success vol" >
              Zachter
               { numberVolume <= 0 && '(Hij is al op z\'n zachts)'}
             </button>
        </View>
      </View>
    </View>
  )
})

export default Player
