import React from 'react'
import io from 'socket.io-client'
import {mapProps, compose, withState} from 'recompose'
import {observeProps, createEventHandler} from 'rx-recompose'

//bootstrap import ¯\_(ツ)_/¯
import {} from './components/css/bootstrap.css'
import {} from './components/css/bootstrap.min.css'

//added new header
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
    <div>
    <div className="container">
      <div className="row">
      <div className="col-md-8">
      <img src={header} className="header"/>
    </div>
    <div className="col-md-4">
      <div className="listeners">
        { audience &&
        <div className= "text-primary">
          { audience === 1
            ? `Je bent de enige luisteraar :')`
            : `Er zijn ${audience} andere luisteraars!`
          }
        </div>
      }
      </div>
    </div>
  </div>
  </div>
      <div className="container">
        <div className="row">
          <div className="col-md-6">
              <div className="text-primary">
                <div className="input-forms">
              <Search playSong={playSong} doSearch={search} results$={searchSocket}/>
              </div>
            </div>
        </div>
        <div className="col-md-3">
          <div className="input-forms">
            { !track
              ? (
                <div className="text-primary">
                  Geen liedje op het moment :(
                </div>
              ) : (
                          <div className ="text-primary">
                          <b>{track.artist}</b><br />
                          {track.title}
                          </div>
              )
            }
          </div>
        </div>
          <div className="col-md-3">
            <div className="text-primary">
              <div className="input-forms">
                <Player time={time} URL={URL}/>
                </div>
          </div>
          </div>
      </div>
    </div>
    <div className="container">
      <div className="row">
        <div className="col-md-12">
      <div className="chat">
        <div className="text-primary">
          <div className="input-forms">
        <Chat send={chat} messages$={chatSocket} />
        </div>
      </div>
    </div>
    </div>
    </div>
    </div>
  </div>
  )
})
