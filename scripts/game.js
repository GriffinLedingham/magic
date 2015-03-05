var fs = require('fs');

module.exports = function Game(player_one, player_two)
{
	this.player_one = player_one;
	this.player_two = player_two;

	this.current_turn;
	this.current_priority;

	this.current_phase;

	/**
	 * Start the game by setting the current turn and priority,
	 * then calling setup player for both of those participating.
	 * 
	 * Set starting turn and priority, the set up both players for game
	 */
	this.init = function() {
		this.current_turn = this.player_one.id;
		this.current_priority = this.player_one.id;

		setupPlayer(this.player_one, this);
		setupPlayer(this.player_two, this);
	};

	/**
	 * Tap a card by passed in unique card ID and user ID.
	 * Both parameters must be supplied.
	 * 
	 * @param  {String} 	card_uuid
	 * @param  {String} 		user_id
	 */
	this.tapCard = function(card_uuid, user_id) {
		getPlayerByUserID(user_id, this).tapCard(card_uuid);
		battlefieldUpdate(user_id, this);
	};

	/**
	 * Untap a card by passed in unique card ID and user ID.
	 * Both parameters must be supplied.
	 * 
	 * @param  {String} 	card_uuid
	 * @param  {String} 	user_id
	 */
	this.untapCard = function(card_uuid, user_id) {
		getPlayerByUserID(user_id, this).untapCard(card_uuid);
		battlefieldUpdate(user_id, this);
	};

	/**
	 * Target player draws a card from their deck into their hand.
	 * 
	 * @param  {String} 	user_id
	 */
	this.drawCard = function(user_id) {
		getPlayerByUserID(user_id, this).drawCard();
		getPlayerByUserID(user_id, this).updateClientData({'hand':true, 'library':true});
	};

	/**
	 * Target player shuffles their hand into their deck.
	 * 
	 * @param  {String} 	user_id
	 */
	this.shuffleHandToDeck = function(user_id) {
		getPlayerByUserID(user_id, this).shuffleHandToDeck();
		getPlayerByUserID(user_id, this).updateClientData({'hand':true, 'library':true});
	};

	/**
	 * Target player puts their hand into their graveyard.
	 * @param  {String} 	user_id
	 */
	this.discardHand = function(user_id) {
		getPlayerByUserID(user_id, this).discardHand();
		getPlayerByUserID(user_id, this).updateClientData({'hand':true, 'graveyard':true});
	}

	/**
	 * Target player casts card from hand to battlefield, based on passed in
	 * user ID and unique card ID.
	 * Once this has been done, call update battlefield.
	 * 
	 * @param  {String} 	card_uuid
	 * @param  {String} 	user_id
	 */
	this.castCard = function(card_uuid, user_id) {
		castPlayerCard(card_uuid, getPlayerByUserID(user_id, this), this);
		battlefieldUpdate(user_id, this);
	};

	/**
	 * Target player ends their turns, and turn is passed to opponent.
	 * 
	 * @param  {String} 	user_id
	 */
	this.endTurn = function(user_id) {
		endTurn(user_id, this);
	};

	this.init();
}

/**
 * Set up player at start of game.
 * This includes building their deck, shuffling, drawing a hand
 * and updating all information to the client.
 * 
 * @param  {Player} 	player
 * @param  {Game} 		self
 */
function setupPlayer(player, self) {
	var decks = fs.readdirSync('./data/decks');
	var deck_to_use = decks[Math.floor(Math.random()*decks.length)];
	var deck = fs.readFileSync('./data/decks/' + deck_to_use, 'utf8');
	
	player.buildDeck(deck);
	player.shuffleDeck();
	player.drawCards(7);

	player.updateClientData({
		'library':true, 
		'hand':true,
		'battlefield':true,
		'mana':true, 
		'turn': self.current_turn, 
		'priority': self.current_priority
	});
}

/**
 * Start a new turn, updating turn and priority, and pushing to player clients
 * 
 * @param  {String} 	user_id
 * @param  {Game} 		self
 */
function startTurn(user_id, self) {
	self.current_turn = user_id;
	self.current_priority = user_id;

	untapStep(user_id, self);

	if(isPlayerOne(user_id, self))
	{
		var player_one_update = {'turn': self.current_turn, 'priority': self.current_priority, 'battlefield': true};
		var player_two_update = {'turn': self.current_turn, 'priority': self.current_priority, 'opponent_battlefield': self.player_one.getSimpleBattlefield()};
	}
	else if(isPlayerTwo(user_id, self))
	{
		var player_one_update = {'turn': self.current_turn, 'priority': self.current_priority, 'opponent_battlefield': self.player_two.getSimpleBattlefield()};
		var player_two_update = {'turn': self.current_turn, 'priority': self.current_priority, 'battlefield': true};
	}

	updatePlayerClients(
		player_one_update, 
		player_two_update, 
		self
	);
}

/**
 * Untap all of target player's cards.
 * 
 * @param  {String} 	user_id
 * @param  {Game} 		self
 */
function untapStep(user_id, self) {
	getPlayerByUserID(user_id, self).untapAllCards();
}

/**
 * End current turn, and call the start of the next turn.
 * 
 * @param  {String} 	user_id
 * @param  {Game} 		self
 */
function endTurn(user_id, self) {
	if(self.current_turn == user_id && self.current_priority == user_id)
	{
		var next_turn_user_id = getOtherPlayerByUserID(user_id, self).id;
		startTurn(next_turn_user_id, self);
	}
}

/**
 * Cast card from player's hand by user ID and card unique ID.
 * This is only possible if player has priority.
 * 
 * @param  {String} 	card_uuid
 * @param  {Player} 	player
 * @param  {Game} 		self
 */
function castPlayerCard(card_uuid, player, self) {
	if(self.current_priority == player.id)
	{
		player.playCard(card_uuid);
	}
}

/**
 * Update battlefield information for both players, and send to client.
 * 
 * @param  {String} 	user_id
 * @param  {Game} 		self
 */
function battlefieldUpdate(user_id, self) {
	if(isPlayerOne(user_id, self))
	{
		var player_one_update = {'battlefield': true, 'mana': true, 'hand': true};
		var player_two_update = {'opponent_battlefield': self.player_one.getSimpleBattlefield()};
	}
	else if(isPlayerTwo(user_id, self))
	{
		var player_one_update = {'opponent_battlefield': self.player_two.getSimpleBattlefield()};
		var player_two_update = {'battlefield': true, 'mana': true, 'hand': true};
	}

	updatePlayerClients(
		player_one_update, 
		player_two_update, 
		self
	);
}

/**
 * Send player data to player clients.
 * 
 * @param  {Object} 	player_one_data
 * @param  {Object} 	player_two_data
 * @param  {Game} 		self
 */
function updatePlayerClients(player_one_data, player_two_data, self) {
	self.player_one.updateClientData(player_one_data);
	self.player_two.updateClientData(player_two_data);
}

/**
 * Emit identical data to both players' clients.
 * 
 * @param  {String} 	key
 * @param  {Object} 	data
 * @param  {Game} 		self
 */
function emitToPlayers(key, data, self) {
	self.player_one.socket.emit(key, data);
	self.player_two.socket.emit(key, data);
}

/**
 * Returns if the passed in user ID is player one.
 * 
 * @param  {String} 	user_id
 * @param  {Game} 		self
 * 
 * @return {Boolean}
 */
function isPlayerOne(user_id, self) {return user_id == self.player_one.id;}

/**
 * Returns if the passed in user ID is player two.
 * @param  {String} 	user_id
 * @param  {Game} 		self
 * 
 * @return {Boolean}
 */
function isPlayerTwo(user_id, self) {return user_id == self.player_two.id;}

/**
 * Returns the opponent's player object of the passed in user ID
 * @param  {String} 	user_id
 * @param  {Game} 		self
 * @return {Player}
 */
function getOtherPlayerByUserID(user_id, self) {var result;if(self.player_one.id == user_id){result = self.player_two;}else if(self.player_two.id == user_id){result = self.player_one;}else{result = false;}return result;}

/**
 * Returns the player object of the passed in user ID
 * 
 * @param  {String} 	user_id
 * @param  {Game} 		self
 * @return {Player}
 */
function getPlayerByUserID(user_id, self) {var result;if(self.player_one.id == user_id){result = self.player_one;}else if(self.player_two.id == user_id){result = self.player_two;}else{result = false;}return result;}