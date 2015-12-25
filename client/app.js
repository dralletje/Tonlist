import React from 'react'
import io from 'socket.io-client'
import {mapProps, compose, withState} from 'recompose'
import {observeProps, createEventHandler} from 'rx-recompose'

import 'bootstrap/dist/css/bootstrap.css'
import header from './tonlist-volcano.png'

import {clickable, box} from './style.css'

import {Scroll, Audio, View, Text, TextInput} from './components'
import Search from './components/Search'
import Chat from './components/Chat'
import Player from './components/Player'

let URL = 'http://web.dral.eu:3040/'

let socket = io(URL)

let observableFromSocket = (socket, event) =>
  Rx.Observable.create(observer => {
    let listener = value => observer.onNext(value)
    socket.on(event, listener)

    return () => socket.removeListener(listener)
  })

let Track = ({track}) => (
  <View>
    { !track
      ? (
        <View>
          Geen liedje op het moment :(
        </View>
      ) : (
        <View>
          <b>{track.artist}</b><br />
          {track.title}
          { track.albumArtRef[0] &&
            <img
              src={track.albumArtRef[0].url}
              style={{
                width: '80%',
              }}
            />
          }
        </View>
      )
    }
  </View>
)

let Box = props => (
  <View {...props}>
    <View className={`${box}`}>
      { props.children }
    </View>
  </View>
)

export default compose(
  observeProps(props$ => {
    let info$ =
      observableFromSocket(socket, 'info')
      .scan((info, newInfo) =>
        Object.assign({}, info, newInfo)
      , {})
    return {
      info: info$,
      time: info$.distinctUntilChanged()
        .skip(1).map(x => Date.now())
        .do(x => console.log('Changed!!')),
    }
  })
)(props => {
  let {time, info} = props
  let emit = event => data => () => socket.emit(event, data)

  let playSong = emit('play')
  let search = emit('search')
  let chat = emit('chat')

  let chatSocket = observableFromSocket(socket, 'chat')
  let searchSocket = observableFromSocket(socket, 'search')

  let track = info && info.track
  let audience = info && info.audience

  return (
    <View className="container">
      <View className="row">
        <View className="col-md-9">
          <img src={header} className="header-image"/>
        </View>
        <View className="col-md-3">
          <View className="listeners">
          { audience &&
            <View className={box}>
              { audience === 1
                ? `Je bent de enige luisteraar :')`
                : `Er zijn ${audience} andere luisteraars!`
              }
          </View>
          }
          </View>
        </View>
      </View>

      <View className="row">
        <Box className="col-md-6">
          <Search playSong={playSong} doSearch={search} results$={searchSocket} />
        </Box>

        <Box className="col-md-3">
          <Track track={track} />
        </Box>

        <Box className="col-md-3">
          <Player time={time} URL={URL} />
        </Box>
      </View>

      <View className="row">
        <Box className="col-md-12">
          <Chat send={chat} messages$={chatSocket} />
        </Box>
      </View>
    </View>
  )
})
