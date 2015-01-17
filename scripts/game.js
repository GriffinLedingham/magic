var fs = require('fs');

module.exports = function Game(player_one, player_two)
{
	this.player_one = player_one;
	this.player_two = player_two;

	this.current_turn;
	this.current_priority;

	this.current_phase;

	/**
	 * [init description]
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
	 * [tapCard description]
	 * @param  {String} 	card_uuid
	 * @param  {String} 		user_id
	 */
	this.tapCard = function(card_uuid, user_id) {
		getPlayerByUserID(user_id, this).tapCard(card_uuid);
		battlefieldUpdate(user_id, this);
	};

	/**
	 * [untapCard description]
	 * @param  {String} 	card_uuid
	 * @param  {String} 	user_id
	 */
	this.untapCard = function(card_uuid, user_id) {
		getPlayerByUserID(user_id, this).untapCard(card_uuid);
		battlefieldUpdate(user_id, this);
	};

	/**
	 * [drawCard description]
	 * @param  {String} 	user_id
	 */
	this.drawCard = function(user_id) {
		getPlayerByUserID(user_id, this).drawCard();
		getPlayerByUserID(user_id, this).updateClientData({'hand':true, 'library':true});
	};

	/**
	 * [shuffleHandToDeck description]
	 * @param  {String} 	user_id
	 */
	this.shuffleHandToDeck = function(user_id) {
		getPlayerByUserID(user_id, this).shuffleHandToDeck();
		getPlayerByUserID(user_id, this).updateClientData({'hand':true, 'library':true});
	};

	/**
	 * [discardHand description]
	 * @param  {String} 	user_id
	 */
	this.discardHand = function(user_id) {
		getPlayerByUserID(user_id, this).discardHand();
		getPlayerByUserID(user_id, this).updateClientData({'hand':true, 'graveyard':true});
	}

	/**
	 * [castCard description]
	 * @param  {String} 	card_uuid
	 * @param  {String} 	user_id
	 */
	this.castCard = function(card_uuid, user_id) {
		castPlayerCard(card_uuid, getPlayerByUserID(user_id, this), this);
		battlefieldUpdate(user_id, this);
	};

	/**
	 * [endTurn description]
	 * @param  {String} 	user_id
	 */
	this.endTurn = function(user_id) {
		endTurn(user_id, this);
	};

	this.init();
}

/**
 * [setupPlayer description]
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
 * [startTurn description]
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
 * [untapStep description]
 * @param  {String} 	user_id
 * @param  {Game} 		self
 */
function untapStep(user_id, self) {
	getPlayerByUserID(user_id, self).untapAllCards();
}

/**
 * [endTurn description]
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
 * [castPlayerCard description]
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
 * [battlefieldUpdate description]
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
 * [updatePlayerClients description]
 * @param  {Object} 	player_one_data
 * @param  {Object} 	player_two_data
 * @param  {Game} 		self
 */
function updatePlayerClients(player_one_data, player_two_data, self) {
	self.player_one.updateClientData(player_one_data);
	self.player_two.updateClientData(player_two_data);
}

/**
 * [emitToPlayers description]
 * @param  {String} 	key
 * @param  {Object} 	data
 * @param  {Game} 		self
 */
function emitToPlayers(key, data, self) {
	self.player_one.socket.emit(key, data);
	self.player_two.socket.emit(key, data);
}

/**
 * [isPlayerOne description]
 * @param  {String} 	user_id
 * @param  {Game} 		self
 * @return {Boolean}
 */
function isPlayerOne(user_id, self) {return user_id == self.player_one.id;}

/**
 * [isPlayerTwo description]
 * @param  {String} 	user_id
 * @param  {Game} 		self
 * @return {Boolean}
 */
function isPlayerTwo(user_id, self) {return user_id == self.player_two.id;}

/**
 * [getOtherPlayerByUserID description]
 * @param  {String} 	user_id
 * @param  {Game} 		self
 * @return {Player}
 */
function getOtherPlayerByUserID(user_id, self) {var result;if(self.player_one.id == user_id){result = self.player_two;}else if(self.player_two.id == user_id){result = self.player_one;}else{result = false;}return result;}

/**
 * [getPlayerByUserID description]
 * @param  {String} 	user_id
 * @param  {Game} 		self
 * @return {Player}
 */
function getPlayerByUserID(user_id, self) {var result;if(self.player_one.id == user_id){result = self.player_one;}else if(self.player_two.id == user_id){result = self.player_two;}else{result = false;}return result;}