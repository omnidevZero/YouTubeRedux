var player = document.querySelector('#movie_player');
var width = document.body.getAttribute('redux-player-width');
var height = document.body.getAttribute('redux-player-height');
player.setInternalSize(width, height);