import React from 'react'
import {Observable} from 'rx'

import {TextField} from 'material-ui'

import ThemeManager from 'material-ui/lib/styles/theme-manager';
import MyRawTheme from '../components/Theme.js';
import ThemeDecorator from 'material-ui/lib/styles/theme-decorator';

import {compose} from 'recompose'
import {observeProps, createEventHandler} from 'rx-recompose'

import {clickable} from '../style.css'
import {View} from '../components'

let Search = compose(
  // ASDFGHJKL:
  ThemeDecorator(ThemeManager.getMuiTheme(MyRawTheme))
,
  observeProps(props$ => {
    // Create search query observable
    let setQuery = createEventHandler()
    let query$ = setQuery.share()

    query$
    // Only search for songs that are not only spaces 😂
    .filter(x => x.trim() !== '')
    // Only every 300 ms
    .debounce(300)
    // Get the `doSearch` method from props
    .withLatestFrom(props$.pluck('doSearch'), (query, doSearch) => doSearch(query))
    // Search for the query
    .subscribe(func => {
      func()
    })

    return {
      // Pass down function to set the query
      setQuery: Observable.just(setQuery),
      // Pass down the current query value
      query: query$.startWith(''),
      // Pass down force-search function when pressing enter
      doSearch: props$.pluck('doSearch'),
      // Function to start playing song when clicked on
      playSong: props$.pluck('playSong'),

      // Searchresults to display
      searchResults:
        Observable.merge(
          // Results from the search
          props$.pluck('results$') // Get results observable
          .distinctUntilChanged() // Only when unique
          .flatMapLatest(x => x) // Morph into the results$
          .startWith([]) // And set off with a empty array
        ,
          query$
          // When query is only spaces
          .filter(x => x.trim() === '')
          // Reset the results to empty array
          .map(() => [])
        ),
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
      underlineStyle={{borderWidth: 2}}
    />

    <View>
      { /* List all the results */ }
      { searchResults.map(result =>
          <View
            key={result.nid}
            className={clickable}
            // On click, reset the query and play the song!
            onClick={() => {
              playSong(result)()
              setQuery('')
            }}
            // Same as setting the text, but more compact
            children={`${result.title} - ${result.artist}`}
          />
      )}
    </View>
  </View>
))

export default Search
