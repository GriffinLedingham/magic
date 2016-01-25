var fs = require('fs');
var game_config = require('./config/game');

module.exports = function Game(player_one, player_two)
{
	this.goldfish = false;
	this.player_one = player_one;
	this.player_two = false;

	if(player_two != false)
	{
		this.player_two = player_two;
	}
	else
	{
		this.goldfish = true;
	}

	this.current_turn;
	this.current_priority;

	this.current_turn_data = {};

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

		if(!this.goldfish)
		{
			setupPlayer(this.player_two, this);
		}
	};

	/**
	 * Tap a card by passed in unique card ID and user ID.
	 * Both parameters must be supplied.
	 *
	 * @param  {String} 	card_uuid
	 * @param  {String} 		user_id
	 */
	this.tapCard = function(card_uuid, user_id) {
		getPlayerByUserID(user_id, this).tapCard(card_uuid, this);
		battlefieldUpdate(user_id, this);
	};

	/**
	 * Tap a card by passed in unique card ID and user ID, with option.
	 * Both parameters must be supplied.
	 *
	 * @param  {String} 	card_uuid
	 * @param  {String} 		option
	 * @param  {String} 		user_id
	 */
	this.tapCardOption = function(card_uuid, option, user_id) {
		getPlayerByUserID(user_id, this).tapCardOption(card_uuid, option, this);
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
	 * Target player casts card from hand to battlefield, based on passed in
	 * user ID and unique card ID, with option.
	 * Once this has been done, call update battlefield.
	 *
	 * @param  {String} 	card_uuid
	 * @param  {String} 	option
	 * @param  {String} 	user_id
	 */
	this.castCardOption = function(card_uuid, option, user_id) {
		castPlayerCardOption(card_uuid, getPlayerByUserID(user_id, this), option, this);
		battlefieldUpdate(user_id, this);
	};

	this.castCardAltCost = function(card_uuid, option, user_id) {
		castPlayerCardAltCost(card_uuid, getPlayerByUserID(user_id, this), option, this);
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

	/**
	 * Target player ends their phase
	 *
	 * @param  {String} 	user_id
	 */
	this.endPhase = function(user_id) {
		endPhase(user_id, this);
	};

	this.convertMana = function(color, user_id) {
		getPlayerByUserID(user_id, this).convertManaToGeneric(color);
		battlefieldUpdate(user_id, this);
	};

	this.didPlayLand = function() {
		this.current_turn_data['played_land'] = true;
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
	var deck_to_use = decks[2];//Math.floor(Math.random()*decks.length)];
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

	self.current_turn_data = {};

	untapStep(user_id, self);
	//drawStep(user_id, self);
	//upkeepStep(user_id, self);

	getPlayerByUserID(user_id, self).cureAllSummoningSick();

	if(isPlayerOne(user_id, self))
	{
		var player_one_update = {'turn': self.current_turn, 'priority': self.current_priority, 'battlefield': true};
		var player_two_update = false;
		if(!self.goldfish)
		{
			player_two_update = {'turn': self.current_turn, 'priority': self.current_priority, 'opponent_battlefield': self.player_one.getSimpleBattlefield()};
		}
	}
	else if(isPlayerTwo(user_id, self))
	{
		var player_one_update = {'turn': self.current_turn, 'priority': self.current_priority, 'opponent_battlefield': self.player_two.getSimpleBattlefield()};
		var player_two_update = false;
		if(!self.goldfish)
		{
			player_two_update = {'turn': self.current_turn, 'priority': self.current_priority, 'battlefield': true};
		}
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
	setTurnPhase('untap', user_id, self);
	battlefieldUpdate(user_id, self);
}

/**
 * Draw player card for turn
 *
 * @param  {String} 	user_id
 * @param  {Game} 		self
 */
function drawStep(user_id, self) {
	drawPlayerCards(user_id, 1, self);
	setTurnPhase('draw', user_id, self);
	battlefieldUpdate(user_id, self);
}

/**
 * Player upkeep step
 *
 * @param  {String} 	user_id
 * @param  {Game} 		self
 */
function upkeepStep(user_id, self) {
	setTurnPhase('upkeep', user_id, self);
	battlefieldUpdate(user_id, self);
}

/**
 * Player main phase 1
 *
 * @param  {String} 	user_id
 * @param  {Game} 		self
 */
function main1Step(user_id, self) {
	setTurnPhase('main1', user_id, self);
	battlefieldUpdate(user_id, self);
}

/**
 * Player combat phase
 *
 * @param  {String} 	user_id
 * @param  {Game} 		self
 */
function combatStep(user_id, self) {
	setTurnPhase('combat', user_id, self);
	battlefieldUpdate(user_id, self);
}

/**
 * Player main phase 2
 *
 * @param  {String} 	user_id
 * @param  {Game} 		self
 */
function main2Step(user_id, self) {
	setTurnPhase('main2', user_id, self);
	battlefieldUpdate(user_id, self);
}

/**
 * Player main phase 2
 *
 * @param  {String} 	user_id
 * @param  {Game} 		self
 */
function endStep(user_id, self) {
	setTurnPhase('end', user_id, self);
	battlefieldUpdate(user_id, self);
}

/**
 * Set the current phase of the turn
 *
 * @param  {String} 	phase
 * @param  {Game} 		self
 */
function setTurnPhase(phase, user_id, self) {
	self.current_turn_data['phase'] = phase;
	getPlayerByUserID(user_id, self).emptyManaPool();
	battlefieldUpdate(user_id, self);
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
		var next_turn_user_id = user_id;
		if(!self.goldfish)
		{
			next_turn_user_id = getOtherPlayerByUserID(user_id, self).id;
		}
		startTurn(next_turn_user_id, self);
	}
}

/**
 * Start next phase
 *
 * @param  {String} 	user_id
 * @param  {Game} 		self
 */
function startNextPhase(user_id, self) {
	var phases = game_config.phases;
	if(self.current_turn_data['phase'] == 'end')
	{
		endTurn(user_id, self);
	}
	else
	{
		var phase_index = phases.indexOf(self.current_turn_data['phase']) + 1;
		switch(phases[phase_index]) {
			case 'untap':
				untapStep(user_id,self);
				break;
			case 'upkeep':
				upkeepStep(user_id,self);
				break;
			case 'draw':
				drawStep(user_id, self);
				break;
			case 'main1':
				main1Step(user_id, self);
				break;
			case 'combat':
				combatStep(user_id, self);
				break;
			case 'main2':
				main2Step(user_id, self);
				break;
			case 'end':
				endStep(user_id, self);
				break;
		};
	}
}

/**
 * End current phase, and call the start of the next phase.
 *
 * @param  {String} 	user_id
 * @param  {Game} 		self
 */
function endPhase(user_id, self) {
	if(self.current_turn == user_id && self.current_priority == user_id)
	{
		startNextPhase(user_id, self);
	}
}

/**
 * Draw number amount of cards, by user ID
 *
 * @param  {String} user_id
 * @param  {Integer} number
 */
function drawPlayerCards(user_id, number, self) {
	getPlayerByUserID(user_id, self).drawCards(number);
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
		player.playCard(card_uuid, self);
	}
}

function castPlayerCardOption(card_uuid, player, option, self) {
	if(self.current_priority == player.id)
	{
		player.playCardOption(card_uuid, option, self);
	}
}

function castPlayerCardAltCost(card_uuid, player, option, self) {
	if(self.current_priority == player.id)
	{
		player.playCardAltCost(card_uuid, option, self);
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
		var player_one_update = {'battlefield': true, 'mana': true, 'hand': true, 'library':true, 'graveyard':true, 'phase': self.current_turn_data.phase, 'health': self.player_one.health};
		var player_two_update = false;
		if(!self.goldfish)
		{
			var player_two_update = {'opponent_battlefield': self.player_one.getSimpleBattlefield()};
		}
	}
	else if(isPlayerTwo(user_id, self))
	{
		var player_one_update = {'opponent_battlefield': self.player_two.getSimpleBattlefield()};
		var player_two_update = false;
		if(!self.goldfish)
		{
			player_two_update = {'battlefield': true, 'mana': true, 'hand': true, 'library':true, 'graveyard':true, 'phase': self.current_turn_data.phase};
		}
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
	if(player_two_data != false)
	{
		self.player_two.updateClientData(player_two_data);
	}
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
	if(!self.goldfish)
	{
		self.player_two.socket.emit(key, data);
	}
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