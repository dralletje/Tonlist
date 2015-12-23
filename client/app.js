import React from 'react'
import io from 'socket.io-client'
import {mapProps, compose, withState} from 'recompose'
import Rx from 'rx'
import {observeProps, createEventHandler} from 'rx-recompose'
import {mapValues} from 'lodash'

import header from './tonlist.png'

import {clickable, box} from './style.css'

let View = 'div'
let Text = 'span'
let TextInput = ({onTextChange, onSubmit}) =>
  <input
    type="text"
    onChange={e => {
      onTextChange && onTextChange(e.target.value)
    }}
    onKeyPress={e => {
      e.which === 13 && onSubmit && onSubmit()
    }}
  />

let URL = 'http://web.dral.eu:3040/'

let socket = io(URL)

let observableFromSocket = (socket, event) =>
  Rx.Observable.create(observer => {
    let listener = value => observer.onNext(value)
    socket.on(event, listener)

    return () => socket.removeListener(listener)
  })

let scrollid = 1
class Scroll extends React.Component {
  constructor(props) {
    super(props)
    this.id = scrollid
    scrollid = scrollid + 1
  }

  componentWillUpdate() {
    // Gather info
    let el = document.querySelector('#scroll' + this.id)
    let scrollHeight = el.scrollHeight - el.offsetHeight
    this.scrollHeightSaved = scrollHeight
  }

  componentDidUpdate() {
    let el = document.querySelector('#scroll' + this.id)
    let prevScrollHeight = this.scrollHeightSaved
    let scrollHeight = el.scrollHeight - el.offsetHeight
    el.scrollTop = this.props.scrollTo(prevScrollHeight, el.scrollTop, scrollHeight)
  }

  render() {
    let Tag = this.props.tag || View
    return (
      <Tag {...this.props} id={'scroll' + this.id} />
    )
  }
}

let Search = compose(
  observeProps(props$ => ({
    doSearch: props$.pluck('doSearch'),
    playSong: props$.pluck('playSong'),
    searchResults: observableFromSocket(socket, 'search').startWith([]),
  })),
  withState('query', 'setQuery', '')
)(({query, setQuery, searchResults, playSong, doSearch}) => (
  <View>
    <TextInput onTextChange={setQuery} value={query} onSubmit={doSearch(query)} />
    <Text className={clickable} onClick={doSearch(query)}>Search</Text>

    <View>
      { searchResults.map(result =>
          <View className={clickable} key={result.nid} onClick={playSong(result)}>
            {result.title} - {result.artist}
          </View>
      )}
    </View>
  </View>
))

let messageId = 1
let Chat = compose(
  observeProps(props$ => ({
    send: props$.pluck('send'),
    chat: observableFromSocket(socket, 'chat')
      .scan((messages, message) =>
        [Object.assign({}, message, {
          id: messageId++,
        })].concat(messages.slice(0, 50))
      , []).startWith([])
      .map(xs => xs.slice().reverse()),
  })),
  withState('query', 'setQuery', '')
)(({query, setQuery, chat, send}) => {
  let submit = () => send(query)() && setQuery('')
  return (
    <View>
      <TextInput onTextChange={setQuery} onSubmit={submit} value={query} />
      <Text className={clickable} onClick={submit}>
        CHAT!!!2
      </Text>

      <Scroll
        style={{maxHeight: 200, overflow: 'auto'}}
        id="chat"
        scrollTo={(h,s,c) => h === s ? c : s}
      >
        { chat.map(message =>
            <Text key={message.id}>
              <Text style={{fontWeight: 'bold'}}>
                {message.username}:
              </Text> {message.message}<br />
            </Text>
        )}
      </Scroll>
    </View>
  )
})

class Audio extends React.Component {
  componentDidUpdate() {
    if (this.audio) {
      this.audio.volume = this.props.volume
    }
  }

  render() {
    return (
      <audio ref={(x) => this.audio = x} {...this.props}>
        <Text>Your browser does not support the audio element.</Text>
      </audio>
    )
  }
}

let Player = compose(
  withState('volume', 'setVolume', 0.1)
)(({volume, setVolume, time}) => {
  console.log(volume)
  return (
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
  )
})

let App = compose(
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

  let track = info && info.track

  return (
    <View>
      <img src={header} />

      <View className={box}>
        { !track
          ? (
            <View>
              Geen liedje op het moment :(
            </View>
          ) : (
            <View>
              <b>{track.artist}</b><br />
              {track.title}
            </View>
          )
        }
      </View>

      <View className={box}>
        <Player time={time} />
      </View>

      <View className={box}>
        <Search playSong={playSong} doSearch={search} />
      </View>

      <View className={box}>
        <Chat send={chat} />
      </View>
    </View>
  )
})

export default class extends React.Component {
  render() {
    return (
      <App />
    )
  }
}
