import React from 'react'

import {compose, withState, lifecycle} from 'recompose'
import {observeProps} from 'rx-recompose'

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
  withState('query', 'setQuery', ''),
  withState('emotes', 'setEmotes', null),
  lifecycle(x => {
    fetch('https://twitchemotes.com/api_cache/v2/global.json')
    .then(x => x.json())
    .then(x.props.setEmotes)
    .catch(() => alert('DOOD VERDERF AAAAAHHHHHHH'))
  }, () => {})
)(({query, setQuery, chat, send, emotes}) => {
  let emoteKeys = emotes && Object.keys(emotes.emotes)
  let getEmote = (username) => {
    if (emotes === null) {
      return null
    } else {
      let x = username.charCodeAt(0) - 728
      let key = emoteKeys[x]
      let emote = emotes.emotes[key]
      let url = emotes.template.small.replace('{image_id}', emote.image_id)
      return <img src={url} />
    }
  }
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
      <Text className={clickable} onClick={submit}>
        Druk gewoon op enter als je je bericht wilt sturen???!!!!
      </Text>

      <Scroll
        style={{maxHeight: 200, overflow: 'auto'}}
        id="chat"
        scrollTo={(h,s,c) => h === s ? c : s}
      >
        { chat.map(message =>
            <Text key={message.id}>
              {getEmote(message.username)}
              <Text style={{fontWeight:'bold'}}>: </Text>
              {message.message}<br />
            </Text>
        )}
      </Scroll>
    </View>
  )
})

export default Chat
