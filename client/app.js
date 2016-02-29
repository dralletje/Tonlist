import React from 'react'
import 'whatwg-fetch'
import io from 'socket.io-client'
import {mapProps, compose, withState} from 'recompose'
import {observeProps, createEventHandler} from 'rx-recompose'

import 'bootstrap/dist/css/bootstrap.css'
import header from './tonlist-monochrome1.png'
import background from './assets/mountains1.jpg'
import favicon from './assets/favicon.png'

import {clickable, box, headerimage, listeners} from './style.css'

import {Scroll, Audio, View, Text, TextInput} from './components'
import Search from './components/Search'
import Chat from './components/Chat'
import Player from './components/Player'
import Favicon from './components/Favicon'

let URL = 'http://web.dral.eu:3040/'

let socket = io(URL)

let observableFromSocket = (socket, event) =>
  Rx.Observable.create(observer => {
    let listener = value => observer.onNext(value)
    socket.on(event, listener)

    return () => socket.removeListener(listener)
  })

let Background = ({url, style}) => {
  let fullstyle = Object.assign({
    backgroundImage: `url('${url}')`,
    backgroundSize: 'cover',
    position: 'absolute',
    top: 0, bottom: 0,
    left: 0, right: 0,
  }, style)

  return (
    <View style={fullstyle} />
  )
}

let Track = ({track, time, URL}) => (
  <View>
    { !track
      ? (
        <View>
          Geen liedje op het moment :(
        </View>
      ) : (
        <View style={{ display: 'flex' }}>
          <View>
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

  let updateMusic = function(data) {
    var spotifyId = data.slice(31);
    fetch('https://api.spotify.com/v1/tracks/'+spotifyId)
    .then(function(response) {
      if (response.status !== 200) {
          console.log('Failed to GET. Status Code: ' +
            response.status);
          return;
        }
        response.json().then(function(data) {
            let artist = data.artists[0].name;
            let track = data.name;
            console.log(artist);
            console.log(track);
            search(track + " " + artist)();
            var subscription = searchSocket.forEach(function(e) {
              console.log(e[0]);
              playSong(e[0])();
              subscription.dispose();
            })
            //playSong(result)();
        });
    });
  }

  let allowDrop = function(e) {
    e.preventDefault();
  }

  let getDropped = function(e) {
    e.preventDefault();
    var data = e.dataTransfer.getData("Text");
    if (data.slice(8,20) !== "open.spotify") {
      console.log("Invalid spotify link");
      return false;
    }
    updateMusic(data);
  }

  return (
    <View
      className="container"
      onDragOver={allowDrop}
      onDrop={getDropped}
      >
      <Background
        url={background}
        style={{ WebkitFilter: 'blur(8px)' }}
      />
      <Favicon url={favicon} />

      <View className="row">
        <View className="col-sm-6">
          <View className={headerimage}>
            <img src={header} className="img-responsive"/>
          </View>
        </View>
        <View className="col-sm-3 col-sm-offset-3">
          <View className={listeners}>
            { !audience || audience === 1
              ? `Je bent de enige luisteraar :')`
              : `Er zijn ${audience - 1} andere luisteraars!`
            }
          </View>
        </View>
      </View>

      <View className="row">
        <Box className="col-sm-6">
          <Search playSong={playSong} doSearch={search} results$={searchSocket} />
        </Box>

        <Box className="col-sm-6">
          <Track track={track} time={time} URL={URL} />
        </Box>
      </View>

      <View className="row">
        <Box className="col-sm-12">
          <Chat send={chat} messages$={chatSocket} />
        </Box>
      </View>
    </View>
  )
})
