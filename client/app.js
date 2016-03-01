import React from 'react'
import 'whatwg-fetch'
import io from 'socket.io-client'
import {compose} from 'recompose'
import {observeProps, createEventHandler} from 'rx-recompose'
import {Observable} from 'rx'

import 'bootstrap/dist/css/bootstrap.css'
import header from './assets/tonlist-monochrome1.png'
import background from './assets/mountains1.jpg'
import favicon from './assets/favicon.png'

import {box, headerimage, listeners} from './style.css'

import {View} from './components'
import Search from './components/Search'
import Chat from './components/Chat'
import Favicon from './components/Favicon'
import Track from './components/Track'

let URL = 'http://web.dral.eu:3040/'

let socket = io(URL)

let first = xs => xs[0]

let observableFromSocket = (sock, event) =>
  Observable.create(observer => {
    let listener = value => observer.onNext(value)
    sock.on(event, listener)

    return () => sock.removeListener(listener)
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
      time: (
        info$.distinctUntilChanged()
        .skip(1).map(x => Date.now())
        .do(x => console.log('Changed!!'))
      ),
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

  let playSpotify = function(data) {
    search(data.name + ' ' + data.artists[0].name)();
    var subscription = searchSocket.forEach(results => {
      if (first(results)) {
        playSong(first(results))();
        subscription.dispose();
      }
    })
  }

  let updateMusic = (spotifyId) => {
    fetch('https://api.spotify.com/v1/tracks/' + spotifyId)
    .then(response => response.json())
    .then(data => playSpotify(data))
  }

  let allowDrop = (event) => {
    event.preventDefault();
  }

  let getDropped = (event) => {
    event.preventDefault()
    var data = event.dataTransfer.getData('Text')
    if (data.slice(8,20) !== 'open.spotify') {
      console.log('Invalid spotify link')
      return false
    }
    // Slice is Spotify ID
    updateMusic(data.slice(31))
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
