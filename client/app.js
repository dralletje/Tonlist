import React from 'react'
import io from 'socket.io-client'
import {mapProps, compose, withState} from 'recompose'
import Rx from 'rx'
import {observeProps, createEventHandler} from 'rx-recompose'
import {mapValues} from 'lodash'

import header from './tonlist.png'

let socket = io('http://web.dral.eu:3040')

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
    let Tag = this.props.tag || 'div'
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
  <div>
    <input onChange={e => setQuery(e.target.value)} value={query} />
    <button onClick={doSearch(query)}>Search</button>

    <ul>
      { searchResults.map(result =>
          <li key={result.nid} onClick={playSong(result)}>
            {result.title} - {result.artist}
          </li>
      )}
    </ul>
  </div>
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
)(({query, setQuery, chat, send}) => (
  <div>
    <input onChange={e => setQuery(e.target.value)} value={query} />
    <button onClick={() => send(query)() && setQuery('')}>CHAT!!!2</button>

    <Scroll
      style={{height: 200, overflow: 'auto'}}
      id="chat"
      scrollTo={(h,s,c) => h === s ? c : s}
    >
      { chat.map(message =>
          <span key={message.id}>
            <b>{message.username}:</b> {message.message}<br />
          </span>
      )}
    </Scroll>
  </div>
))


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

  let track = info && info.track

  return (
    <div>
      <img src={header} />

      { !track
        ? (
          <div>
            Geen liedje op het moment :(
          </div>
        ) : (
          <div>
            <b>{track.artist}</b><br />
            {track.title}
          </div>
        )
      }

      <audio src={`http://localhost:3040/${props.time}.mp3`} autoPlay>
        <p>Your browser does not support the audio element.</p>
      </audio>

      <Search playSong={playSong} doSearch={search} />
      <Chat send={chat} />
    </div>
  )
})
