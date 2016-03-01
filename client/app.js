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
    // Observable en functie om die te triggeren
    let dragSpotify$ = createEventHandler()

    dragSpotify$
    // Krijg je spotify data behorend bij een track (async, thus flatMapLatest)
    .flatMapLatest(spotifyId =>
      fetch('https://api.spotify.com/v1/tracks/' + spotifyId)
      .then(response => response.json())
    // Krijg de search results bij de spotify data (async, this flatMapLatest)
    ).flatMapLatest(spotifyData => {
      socket.emit('search', `${spotifyData.name} ${spotifyData.artists[0].name}`)
      return observableFromSocket(socket, 'search').take(1)
    })
    // Neem het eerste result
    .map(results => first(results))
    // Be sure er is een eerste result
    .filter(x => x !== undefined)
    // Speel elk ding dat het tot hier maakt
    .subscribe(song => socket.emit('play', song))

    let info$ =
      // 'info' events van de socket
      observableFromSocket(socket, 'info')
      // Elke keer dat er een nieuwe komt, Object.assign' (merge) je deze
      // met de vorige, en geef je het resultaat door
      .scan((info, newInfo) =>
        Object.assign({}, info, newInfo)
      , {})

    return {
      info: info$,
      time: (
        // Elke keer dat info changed (distinctUntilChanged)
        info$.distinctUntilChanged()
        // (Behalve de eerste keer (skip)), maak je er de current date van
        .skip(1).map(x => Date.now())
        // En log je dit (dit is alleen een side-effect)
        .do(x => console.log('Changed!!'))
      ),
      // Geef de trigger-functie van spotify drag mee
      onSpotifyDrag: Observable.just(dragSpotify$),
    }
  })
)(props => {
  let {time, info, onSpotifyDrag} = props
  // Shortcut om een event naar de socket te sturen
  let emit = event => data => () => socket.emit(event, data)

  // Shortere shortcuts
  let playSong = emit('play')
  let search = emit('search')
  let chat = emit('chat')

  // Neem events van de socket in een observable
  let chatSocket = observableFromSocket(socket, 'chat')
  let searchSocket = observableFromSocket(socket, 'search')

  let track = info && info.track
  let audience = info && info.audience

  // Maak het mogelijk het getDropped event te triggeren
  let allowDrop = (event) => {
    event.preventDefault()
  }

  // OnDropped event catcher
  let getDropped = (event) => {
    event.preventDefault()

    // Make sure it is a spotify id
    let spotifyLink = /https:\/\/open.spotify.com\/track\/([^/]{22})/
    let data = event.dataTransfer.getData('Text')
    let match = data.match(spotifyLink)

    if (match === null) {
      console.log('Invalid spotify link')
      return false
    }

    // And extract the spotify id
    onSpotifyDrag(match[1])
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
