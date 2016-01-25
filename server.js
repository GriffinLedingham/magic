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
server.listen(process.env.PORT||3000);
io.set('log level', 0);

var Card = require('./scripts/card');
var Player = require('./scripts/player');
var Game = require('./scripts/game');

var Goldfish = true;

var lobby = [];

io.sockets.on('connection', function (socket) {
	socket.player = new Player(socket);
	socket.current_game = false;

	var player = socket.player;

	socket.emit('set_user_id', socket.id);

	socket.on('get_deck',function(){
		lobby.push(socket);
		startGame();
	});

	socket.on('draw_card', function(){
		socket.current_game.drawCard(socket.id);
	});

	socket.on('shuffle_hand_to_deck', function(){
		socket.current_game.shuffleHandToDeck(socket.id);
	});

	socket.on('discard_hand', function(){
		socket.current_game.discardHand(socket.id);
	});

	socket.on('play_card', function(card_uuid){
		socket.current_game.castCard(card_uuid, socket.id);
	});

	socket.on('play_card_option', function(data){
		socket.current_game.castCardOption(data.uuid, data.option, socket.id);
	});

	socket.on('play_card_alt_cost', function(data){
		socket.current_game.castCardAltCost(data.uuid, data.option, socket.id);
	});

	socket.on('tap_card', function(card_uuid){
		socket.current_game.tapCard(card_uuid, socket.id);
	});

	socket.on('tap_card_option', function(data){
		socket.current_game.tapCardOption(data.uuid, data.option, socket.id);
	});

	socket.on('end_turn', function() {
		socket.current_game.endTurn(socket.id);
	});

	socket.on('end_phase', function() {
		socket.current_game.endPhase(socket.id);
	});

	socket.on('convert_color_to_generic', function(color){
		socket.current_game.convertMana(color, socket.id);
	});
});

function startGame() {
	if(!Goldfish && lobby.length == 2)
	{
		var socket_one = lobby.pop();
		var socket_two = lobby.pop();

		var new_game = new Game(socket_one.player, socket_two.player);

		socket_one.current_game = new_game;
		socket_two.current_game = new_game;
	}
	else if(Goldfish)
	{
		var socket_one = lobby.pop();

		var new_game = new Game(socket_one.player, false);

		socket_one.current_game = new_game;
	}
}
