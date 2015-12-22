import PlayMusic from 'playmusic'
import Promise from 'bluebird'
import http from 'https'

import login from './login.json'

let getMusic = creds => {
  let pm = Promise.promisifyAll(new PlayMusic())
  return pm.initAsync(creds).then(() => pm)
}

let fetch = url => (
  new Promise(finishRequest => {
    http.request(url, req => {
      finishRequest({
        buffer: () => (
          new Promise((yell, cry) => {
            let data = []
            req.on('readable', () => {
              let localdata = req.read()
              if (!localdata) {
                yell(Buffer.concat(data))
              } else {
                data.push(localdata)
              }
            }).on('error', err => {
              cry(err)
            })
          })
        )
      })
    }).end()
  })
)

let createMusic = () => {
  return getMusic(login)
  .then(pm => {
    return {
      search: query =>
        pm.searchAsync(query, 5)
        .then(data =>
          data.entries
          .filter(x => x.type === '1')
          .map(x => x.track)
        ),
      download: track =>
        pm.getStreamUrlAsync(track.nid)
        .then(url => fetch(url).then(x => x.buffer())),
    }
  })
}

export default () => {
  return createMusic().then(music => {
    let currentSong = null

    return {
      track: () =>
        currentSong === null
        ? null
        : currentSong.track,
      getSong: () => {
        if (!currentSong) {
          return {
            track: null,
            data: new Buffer([]),
          }
        } else {
          let seconds = (Date.now() - currentSong.startDate)
          let offset = Math.round(seconds * currentSong.speed)

          return {
            track: currentSong,
            data: currentSong.data.slice(offset),
          }
        }
      },
      play: track =>
        music.download(track)
        .then(data => {
          currentSong = {
            data, track,
            startDate: Date.now(),
            speed: track.estimatedSize / track.durationMillis,
          }
          return currentSong
        }),
      music,
    }
  })
}
