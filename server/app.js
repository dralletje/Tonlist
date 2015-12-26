import createPlayer from './play'
import SocketIO from 'socket.io'
import http from 'http'

let seconds = () => Math.round(Date.now() / 1000)
let log = message => console.log(`[${seconds()}] ${message}`)

createPlayer().then(player => {
  let app = http.createServer((req, res) => {
    // Block favicon
    if (req.url === '/favicon.ico') {
      return res.end("NO!")
    }

    // Every other url will result in the playing song
    log(`Song is requested, going for it!`)
    let {data} = player.getSong()
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
    })
    res.end(data)

    //player.stream(res)
  }).listen(3040)

  let io = SocketIO(app)

  io.on('connection', socket => {
    io.emit('info', {
      audience: Object.keys(io.sockets.connected).length,
    })

    let max = 839
    let min = 728
    let IP = socket.request.connection.remoteAddress

    socket.username =
      IP === '80.100.200.124' // Jonas, aka, G
      ? 'G' : String.fromCharCode(Math.floor(Math.random()*(max-min+1)+min))

    socket.emit('info', {
      track: player.track(),
      audience: Object.keys(io.sockets.connected).length,
      history: player.history,
    })

    socket.on('play', track => {
      player.play(track).then(playing => {
        log(`Done loading track ${track.title}, now playing it`)
        io.emit('info', {
          track: player.track(),
        })
      })
    })

    socket.on('chat', message => {
      io.emit('chat', {
        username: socket.username,
        message: message,
      })
    })

    // If I want to extend the client later, I can do so without
    // the need to modify the server, just use the general purpose
    // 'anyhing' channel :D
    socket.on('anything', data => {
      io.emit('anything', {
        username: socket.username,
        data: data,
      })
    })

    socket.on('search', data => {
      player.music.search(data).then(tracks => {
        socket.emit('search', tracks.slice(0, 10))
      })
    })
  })
})
