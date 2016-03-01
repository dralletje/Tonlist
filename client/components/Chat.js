import React from 'react'

import {compose, withState, lifecycle} from 'recompose'
import {observeProps} from 'rx-recompose'

import {TextField} from 'material-ui'
import ThemeManager from 'material-ui/lib/styles/theme-manager';
import MyRawTheme from '../components/Theme.js';
import ThemeDecorator from 'material-ui/lib/styles/theme-decorator';

import {Scroll, View, Text} from '../components'

// Neem een n aantal elementen aan hete einde van de array
let takeLast = (xs, n) => (
  xs.slice(
    Math.max(xs.length - 50, 0)
  ,
    xs.length
  )
)

// MessageID zodat je elke message een ID kan geven
let messageId = 1

let Chat = compose(
  // Plaats het thema in de 'context' (Magie)
  // @ Jelmar, dit kan beter in app.js - Michiel
  ThemeDecorator(ThemeManager.getMuiTheme(MyRawTheme))
,
  observeProps(props$ => ({
    // Pak de 'send' value uit de props
    send: props$.pluck('send'),
    // Pak de messages$ observables uit de props
    chat: (
      props$.pluck('messages$')
      // Wacht tot hij veranderd
      .distinctUntilChanged()
      // 'Wordt' die messages observable (vanaf nu zijn de items dan ook messages)
      .flatMapLatest(x => x)
      // Voeg een messageId toe
      .map(message => {
        return {
          ...message,
          id: messageId++,
        }
      })
      // Voor elke message die aankomt, plak hem vast aan de andere messages
      // En pak de laatste 50, zodat er niet te veel messages komen
      .scan((messages, message) =>
        takeLast(messages.concat([message]), 50)
      , [])
      // Start met een lege array, zodat je iets hebt
      .startWith([])
    ),
  }))
,
  // Maak een state prop voor de searchQuery
  withState('query', 'setQuery', '')
,
  // Maak een plek om de emotes op te slaan
  withState('emotes', 'setEmotes', null)
,
  // Wanneer het component 'opstart'
  lifecycle(component => {
    // Pak je alle emotes van deze site
    fetch('https://twitchemotes.com/api_cache/v2/global.json').then(x => x.json())
    // En sla wat je krijgt op in de emotes state
    .then(result => component.props.setEmotes(result))
    // En als het mis gaat ASDFGHJKL:
    .catch(() => alert('DOOD VERDERF AAAAAHHHHHHH'))
  }, null)
)(({query, setQuery, chat, send, emotes}) => {
  // Emotes als een array in plaats van object
  let emotesArray = emotes && (
    Object.keys(emotes.emotes)
    .map(key => emotes.emotes[key])
  )

  // Component van username naar emote
  let Emote = ({username}) => {
    // Alleen als er emotes ZIJN though
    if (emotes === null) {
      return null
    } else {
      // Verander het unicode character (die beginnen op 728)
      let x = username.charCodeAt(0) - 728
      // Krijg de emote op die index (we gebruiken de array hier meer als map)
      let emote = emotesArray[x]
      // Plaats de emote in de url
      let url = emotes.template.small.replace('{image_id}', emote.image_id)
      // En return een prachtig plaaaatjeeeeee
      return <img src={url} />
    }
  }

  // Functie om de query naar de server te sturen en lokaal te resetten
  let submit = () => send(query)() && setQuery('')

  return (
    <View>
      <TextField
        onEnterKeyDown={submit}
        value={query}
        onChange={e => setQuery(e.target.value)}
        hintText="Kappa!"
        type="text"
        fullWidth={true}
        underlineStyle={{borderWidth: 2}}
      />

      { /* Scroll component die op de 'bottom' blijft wanneer er nieuwe items zijn */ }
      <Scroll
        style={{maxHeight: 200, overflow: 'auto'}}
        id="chat"
        scrollTo={(h,s,c) => h === s ? c : s}
      >
        { /* Elke message => EMOTE: TEXT */ }
        { chat.map(message =>
            <Text key={message.id}>
              <Emote username={message.username} />
              <Text style={{fontWeight:'bold'}}>: </Text>
              {message.message}<br />
            </Text>
        )}
      </Scroll>
    </View>
  )
})

export default Chat
