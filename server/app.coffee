Spotify = require 'spotify-web'
http = require 'http'
socketIo = require 'socket.io'
Promise = require 'bluebird'
{EventEmitter} = require 'events'
{parseString} = require 'xml2js'

class Player extends EventEmitter
  constructor: (spotify) ->
    @spotify = spotify
    @current = null
    @doingSomething = false
    @history = []
    @queue = []

  get: ->
    if not @current?
      throw new Error 'No song playing! :-('

    now = (new Date()).getTime()
    seconds = (now - @current.start) / 1000
    @current.track.slice Math.round (seconds * 160 * 1024) / 8

  next: ->
    # Skip current track and go to next in queue
    if @queue.length is 0
      @play 'spotify:track:0PV1TFUMTBrDETzW6KQulB' # '93 till infinity
      return

    @play @queue.shift()

  queue: (uri) ->
    @queue.push uri

  info: ->
    if not @current?
      return null
    song = @current.info

    id: Spotify.gid2id song.gid
    name: song.name
    artists: song.artist.map (artist) ->
      artist.name
    artist: song.artist[0].name
    duration: song.duration
    album: song.album.name

  play: (uri) ->
    ctrack = null
    new Promise (yell, cry) =>
      if @current?
        # Don't repeat same song
        if @current.uri is uri
          throw new Error "Already playing that song!"

        # Play at least 10 seconds
        now = (new Date()).getTime()
        seconds = (now - @current.start) / 1000
        if seconds < 10
          throw new Error "Previous song needs to play for at least 10 seconds."

      # Don't do more than one thing at the same time
      if @doingSomething
        cry new Error 'Already doing something else XD'
        return
      @doingSomething = yes

      # Get track metadata from spotify
      @spotify.get "spotify:track:#{uri}", (err, track) =>
        if err
          cry err
        else
          yell track

    .then (track) =>
      ctrack = track

      new Promise (yell, cry) =>
        console.log "Playing: %s - %s", track.artist[0].name, track.name

        # If song is playing, clear it's timer
        if @current?
          clearTimeout @current.timer

        # Fetch whole track
        # TODO: Make it stream... (very hard I think)
        buffer = []
        track.play().on 'readable', ->
          data = @read()
          if not data?
            return
          buffer.push data
        .on 'end', ->
          data = Buffer.concat buffer
          yell data
        .on 'error', (err) ->
          cry err

    .then (data) =>
      title = "#{ctrack.name} - #{ctrack.artist[0].name}"
      console.log 'Duration:', ctrack.duration / 1000 / 60
      @current =
        uri: uri
        start: (new Date).getTime()
        track: data
        info: ctrack
        timer: setTimeout =>
          @current = null
          console.log "Track ended, clear now!"
          @next()
        , ctrack.duration

      info = @info()
      # Add song to history:
      @history.unshift info
      if @history.length > 10
        @history.pop()

      @emit 'song', info
      @doingSomething = false

    .catch (err) =>
      @doingSomething = false
      console.log err.stack
      throw err

login = require './login'
Spotify.login login.username, login.password, (err, spotify) ->
  if err
    throw err

  player = new Player spotify

  console.log 'Connected!'
  app = http.createServer (req, res) ->
    url = req.url
    if url is '/favicon.ico'
      return res.end("NO!")

    if url is '/'
      try
        data = player.get()
        res.writeHead 200,
          'Content-Type': 'audio/mpeg'
        res.end data
      catch e
        res.writeHead 400
        res.end "Something went wrong: " + e.message
      return

    track = url.slice 1
    player.play(track).then ->
      res.end 'Got it!'
    .catch (err) ->
      res.writeHead 400
      res.end 'Error: '+err.message
  .listen 3040

  io = socketIo app
  io.on 'connection', (socket) ->
    max = 839
    min = 728
    socket.username = '&#9' + (Math.floor(Math.random()*(max-min+1)+min))

    IP = socket.request.connection.remoteAddress
    console.log IP
    if IP is '80.100.200.124'
      socket.username = 'G'

    if (info = player.info())?
      socket.emit 'song', info

    if (l = Object.keys(io.sockets.connected).length) isnt 0
      socket.emit 'luisteraars', l

    socket.emit 'history', player.history

    socket.on 'update', (uri) ->
      player.play uri

    socket.on 'queue', (uri) ->
      player.queue uri

    socket.on 'chat', (message) ->
      io.emit 'chat',
        username: socket.username
        message: message

    socket.on 'updateWithId', (data) ->
      uri = Spotify.id2uri 'track', data
      player.play(uri.match(/spotify:track:(.+)/)[1]).catch (e) ->
        socket.emit 'problem', e.message

    socket.on 'search', (data) ->
      console.log 'Searching for', data
      spotify.search data, (err, stuff) ->
        if err
          throw err

        # Parse the results
        parseString stuff, (err, result) ->
          console.log 'Sending back search results!'
          if not result?.result?.tracks?[0]?.track?
            return # Just do nothing! :-D
          socket.emit 'results', result.result.tracks[0].track
            .slice(0,5) # Take only three of them
            .map (track) -> # Map it to a decent amount of information
              id: track.id[0]
              title: track.title
              artist: track.artist[0]
              artists: track.artist

    socket.on 'playlist', (uri) ->
      fn = 'playlist'

      match = uri.match /spotify:user:(\d+):starred/
      if match?
        fn = 'starred'
        uri = match[1]

      spotify[fn] uri, (err, list) ->
        if err?
          console.log err
          return
        uris = list.contents.items.slice(0,500).map (item) ->
          item.uri

        spotify.get uris, (err, thing) ->
          console.log 'Got playlist content!'
          socket.emit 'playlist', thing.map (item) ->
            id: Spotify.gid2id item.gid
            name: item.name
            artist: item.artist[0].name
            artists: item.artist.map (artist) ->
              artist.name


  player.on 'song', (song) ->
    io.emit 'song', song
