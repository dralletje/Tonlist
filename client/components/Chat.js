import React from 'react'

import {compose, withState} from 'recompose'
import {observeProps} from 'rx-recompose'

import 'bootstrap/dist/css/bootstrap.css'

import {clickable} from '../style.css'
import {Scroll, View, Text, TextInput} from '../components'

let messageId = 1
let Chat = compose(
  observeProps(props$ => ({
    send: props$.pluck('send'),
    chat: props$.pluck('messages$').distinctUntilChanged()
      .flatMapLatest(x => x)
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
      <TextInput
        onTextChange={setQuery}
        onSubmit={submit}
        value={query}
        placeholder="Kappa!"
        style={{
          width: '100%',
        }}
      />
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

export default Chat
