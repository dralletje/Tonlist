var socket = io('http://dral.eu:3040');

// Utility functies
var nummerTekst = function(title, artiest, id) {
  /*
  return '<div class="row" x-id="' + id + '">'
    + '<div class="col-md-8">'
      + '<b>'+title+'</b>' + ' van ' + '<b>'+artiest+'</b>'
    + '</div><div class="col-md-4 searchbuttons">'
      + '<button class="now btn btn-success">'
        + '<i class="glyphicon glyphicon-play"></i>'
      + '</button>'
      + '<button class="now btn btn-primary" disabled>'
        + '<i class="glyphicon glyphicon-tasks"></i>'
      + '</button>'
    + '</div>'
  + '</div>'
  */

  return '<div class="row" x-id="' + id + '">'
    + '<div class="col-md-2 searchbuttons">'
      + '<button class="now btn btn-success">'
        + '<i class="glyphicon glyphicon-play"></i>'
      + '</button>'
    + '</div><div class="col-md-10">'
      + '<b>'+title+'</b>' + ' van ' + '<b>'+artiest+'</b>'
    + '</div>'
  + '</div>'
};

var updateNummerLists = function() {
  $(".numberlist .now").off()

  // Nu!
  $(".numberlist .now").click(function() {
    $this = $(this)
    socket.emit('updateWithId', $this.parent().parent().attr('x-id'))
  })

  // Queue
  /*
  $(".numberlist .now").click(function() {
    $this = $(this)
    socket.emit('updateWithId', $this.parent().parent().attr('x-id'))
  })
  */
}

var first = true
socket.on('song', function (song) {
  var $audio = $('audio')
  var audio = $audio.get(0)

  // Change source to empty for just a second
  var src = ''
  if(first) {
    src = "http://dral.eu:3040/"
  } else {
    src = $audio.attr('src')
  }
  first = false
  $audio.attr('src', '').attr('src', src)

  // Update #nowplaying tekst
  $(".nowplaying").html(song.name + "<br /><small>van</small><br />" + song.artist)

  // Add song to history
  $('#geschiedenis').prepend(nummerTekst(song.name, song.artist, song.id))
  updateNummerLists()
})

// Playlist from server
socket.on('playlist', function(nummers) {
  $("#playlistresults").html(nummers.reduce(function(html, track) {
    return html + nummerTekst(track.name, track.artist, track.id)
  }, ''))
  updateNummerLists()
})

// History push from server
socket.on('history', function(nummers) {
  console.log(nummers)
  $('#geschiedenis').append(nummers.reduce(function(html, track) {
    return html + nummerTekst(track.name, track.artist, track.id)
  }, ''))
  updateNummerLists()
})

socket.on('chat', function(chat) {
  var message = $('<div/>').text(chat.message).html()
  var titlecommand = '/title '

  if(message.indexOf(titlecommand) === 0) {
    title = message.slice(titlecommand.length)
    console.log('New title:', title)
    $("#slogan").text(title)
    message = '<b>set title to \'title\' :-D!</b>'
  }

  $("#chatspace").append("<span><b>"
    + chat.username
    + ":</b> "
    + message
    + "</span><br />")

  $("#chatspace").animate({
    scrollTop: '200000px'
  }, 50);
})

// Luisteraars update
socket.on('luisteraars', function(aantal) {
  var $l = $(".luisteraars")
  console.log('Luisteraars:', aantal)
  $l.html("Er "
    + (aantal === 2 ? 'is ' : 'zijn ')
    + (aantal - 1)
    + " andere "
    + (aantal === 2 ? 'luisteraar' : 'luisteraars')
    + "!")
})

socket.on('results', function(results) {
  console.log(results)
  $('#searchresults').html(results.reduce(function(html, track) {
    return html + nummerTekst(track.title, track.artist, track.id)
  }, ''))
  updateNummerLists()
})

socket.on('problem', function(problem) {
  console.log('error:', problem)
  $("#chatspace").append("<span><b style='color: red;'>Oeps:</b> "
    + problem
    + "</span><br />")

  $("#chatspace").animate({
    scrollTop: '200000px'
  }, 50);
})

$(function() {
  var audio = $('audio').get(0)
  audio.volume = .2
  var $audio = $(audio)

  // Search input box
  $("#search").keypress(function(e) {
    if(e.keyCode !== 13) return
    var val = $(this).val()
    socket.emit('search', val)
    //$("#search").val('')
  });

  // Playlist search
  $("#playlist").keypress(function(e) {
    if(e.keyCode !== 13) return
    var val = $(this).val()
    socket.emit('playlist', val)
  })

  // Chat
  $("#chat").keypress(function(e) {
    if(e.keyCode !== 13) return

    $this = $(this)
    var val = $this.val()
    socket.emit('chat', val)
    $this.val('')
  })

  var playing = true

  $('#stop').click(function() {
    var $this = $(this)

    console.log($audio.attr('src'))
    if(!playing) {
      $this.html('<i class="glyphicon glyphicon-pause"></i>')
        .addClass("btn-danger")
        .removeClass("btn-success")
      playing = true
      $audio.attr('src', "http://dral.eu:3040/")
    } else {
      $this.html('<i class="glyphicon glyphicon-play"></i>')
        .addClass("btn-success")
        .removeClass("btn-danger")
      playing = false
      $audio.attr('src', "")
    }
  })

  $('#higher').click(function() {
    if(audio.volume > .9) {
      audio.volume = .9
    }
    $("#lower").html('<i class="glyphicon glyphicon-volume-down"></i>')
    audio.volume += .1
  })
  $('#lower').click(function() {
    if(audio.volume < .1) {
      audio.volume = .1
    }
    audio.volume -= .1
    if(audio.volume === 0) {
      $("#lower").html('<i class="glyphicon glyphicon-volume-off"></i>')
    }
  })

  var $input = $("#spotifylink")
  updateMusic = function(val, queue) {
    var id = ''
    if((match = val.match(/http:\/\/open.spotify.com\/track\/(.+)/)) !== null) {
      id = match[1]
    } else if((match = val.match(/spotify:track:(.+)/)) !== null) {
      id = match[1]
    } else {
      return $input.parent().addClass('has-error')
    }
    $input.parent().removeClass('has-error')
    console.log('New song:', id)

    //window.open("http://dral.eu:3040/" + val,'_blank')
    $input.val('')
    socket.emit('update', id)
  }

  $("#swegbutton").click(function(e) {
    e.preventDefault()
    updateMusic($input.val())
  })

  $input.keypress(function(e) {
    if(e.keyCode !== 13) return
    e.preventDefault()
    updateMusic($input.val())
  })

  $('body')
    .bind("dragover", false)
    .bind("dragenter", false)
    .bind("drop", function(e) {
      value = e.originalEvent.dataTransfer.getData("text") ||
        e.originalEvent.dataTransfer.getData("text/plain");
      console.log('Link dropped!')
      updateMusic(value)
      return false;
  });
})
