import React from 'react'
import {Observable} from 'rx'

import {TextField} from 'material-ui'

import ThemeManager from 'material-ui/lib/styles/theme-manager';
import MyRawTheme from '../components/Theme.js';
import ThemeDecorator from 'material-ui/lib/styles/theme-decorator';

import {compose, withState} from 'recompose'
import {observeProps, createEventHandler} from 'rx-recompose'

import {clickable} from '../style.css'
import {View, Text, TextInput} from '../components'

let Search = compose(
  ThemeDecorator(ThemeManager.getMuiTheme(MyRawTheme)),
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

      searchResults:
        Observable.merge(
          props$.pluck('results$')
            .distinctUntilChanged()
            .flatMapLatest(x => x).startWith([]),
          query$
            .filter(x => x === '')
            .map(() => [])
        )
    }
  })
)(({query, setQuery, searchResults, playSong, doSearch}) => (
  <View>
    <TextField
      hintText="Search for a song! :D"
      onChange={(e,value) => setQuery(e.target.value)}
      value={query}
      onEnterKeyDown={doSearch(query)}
      fullWidth={true}
      underlineStyle={{
        borderWidth: 2
      }}
    />

    <View>
      { searchResults.map(result =>
          <View
            className={clickable}
            key={result.nid}
            onClick={() => {
              playSong(result)()
              setQuery('')
            }}
          >
            {result.title} - {result.artist}
          </View>
      )}
    </View>
  </View>
))

export default Search
