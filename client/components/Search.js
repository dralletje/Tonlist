import React from 'react'
import {Observable} from 'rx'

import {compose, withState} from 'recompose'
import {observeProps, createEventHandler} from 'rx-recompose'

import {clickable} from '../style.css'
import {View, Text, TextInput} from '../components'

let Search = compose(
  observeProps(props$ => {
    let setQuery = createEventHandler()
    let query$ = setQuery.share()

    // Search for songs!
    query$
      .filter(x => x !== '')
      .throttle(300)
      .withLatestFrom(props$.pluck('doSearch'), (a,b) => [a,b])
      .subscribe(([query, doSearch]) => {
        doSearch(query)()
      })

    return {
      setQuery: Observable.just(setQuery),
      query: query$.startWith(''),

      doSearch: props$.pluck('doSearch'),
      playSong: props$.pluck('playSong'),

      searchResults: props$.pluck('results$')
        .distinctUntilChanged()
        .flatMapLatest(x => x).startWith([]),
    }
  })
)(({query, setQuery, searchResults, playSong, doSearch}) => (
  <View>
    <TextInput
      placeholder="Search for a song! :D"
      onTextChange={setQuery}
      value={query}
      onSubmit={doSearch(query)}
      style={{
        width: '100%',
      }}
    />

    <View>
      { searchResults.map(result =>
          <View className={clickable} key={result.nid} onClick={playSong(result)}>
            {result.title} - {result.artist}
          </View>
      )}
    </View>
  </View>
))

export default Search
