import React from 'react'
import Player from '../components/Player'
import {View} from '../components'


let Track = ({track, time, URL}) => {
  if (!track) {
    return (
      <View>
        Geen liedje op het moment :(
      </View>
    )
  }

  return (
    <View>
      <View style={{ display: 'flex' }}>
        <View>
          { /* Album art if we have it */ }
          { track.albumArtRef[0] &&
            <img
              src={track.albumArtRef[0].url}
              style={{ height: 150 }}
            />
          }
        </View>
        <View
          style={{
            marginLeft: 20,
            marginTop: 5,
            flex: 1,
            marginRight: 10,
          }}
        >
          <View>
            <b>{track.artist}</b><br />
            {track.title}
          </View>
          <View style={{ flex: 1 }}>
            <Player time={time} URL={URL} />
          </View>
        </View>
      </View>
    </View>
  )
}

export default Track
