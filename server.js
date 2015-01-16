var http = require('http');
var fs = require('fs');
var express = require('express');
var app = express();
var path    = require('path');
app.use(express.static(path.join(__dirname, 'client')));
app.configure(function(){
  app.use(express.bodyParser());
});
var server = http.createServer(app);
var io = require('socket.io').listen(server); 
server.listen(3000);  
io.set('log level', 0);

var Card = require('./scripts/card');
var Player = require('./scripts/player');

io.sockets.on('connection', function (socket) {
	var player = new Player(socket);

	socket.on('get_deck',function(){
		var decks = fs.readdirSync('./data/decks');

		//Pick a random deck from the directory
		var deck_to_use = decks[Math.floor(Math.random()*decks.length)];

		//Read in the deck
		var deck = fs.readFileSync('./data/decks/' + deck_to_use, 'utf8');
		
		player.buildDeck(deck);
		player.shuffleDeck();
	});

	socket.on('draw_card', function(){
		player.drawCard();
	});

	socket.on('shuffle_hand_to_deck', function(){
		player.shuffleHandToDeck();
	});
});
